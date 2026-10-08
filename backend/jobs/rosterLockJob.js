import cron from 'node-cron';
import mongoose from 'mongoose';
import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';
import { processLockDelta } from '../services/escrowService.js';
import { sendNotification } from '../services/notificationService.js';

export const runRosterLock = async () => {
    const session = await mongoose.startSession();

    try {
        const now = new Date();

        // Find open rides where rosterLockAt has passed and cost isn't locked yet
        const ridesToLock = await Ride.find({
            status: { $in: ['published', 'booking', 'full'] },
            costLocked: { $ne: true },
            rosterLockAt: { $lte: now }
        });

        if (ridesToLock.length === 0) {
            return;
        }

        console.log(`🔒 [ROSTER LOCK] Found ${ridesToLock.length} ride(s) past rosterLockAt cutoff. Freezing rosters...`);

        for (const ride of ridesToLock) {
            session.startTransaction();
            try {
                // 1. Fetch real confirmed bookings first to get TRUE passenger count
                const bookings = await Booking.find({ 
                    rideId: ride._id, 
                    status: 'confirmed' 
                }).session(session);

                const confirmedCount = bookings.length;

                // CASE A: No passengers booked before lock
                if (confirmedCount === 0) {
                    ride.status = 'cancelled';
                    ride.costLocked = true;
                    ride.costPerHeadFinal = 0;
                    ride.confirmedRiderCount = 0;
                    await ride.save({ session });

                    await session.commitTransaction();

                    sendNotification({
                      userId: ride.driverId,
                      type: 'ride_cancelled',
                      message: `Roster locked: No passengers booked your ride to ${ride.destination?.label || 'campus'}. Trip closed.`,
                      relatedRideId: ride._id,
                    });

                    console.log(`ℹ️ Ride ${ride._id} closed (0 bookings).`);
                    continue;
                }

                // CASE B: 1 or more confirmed passengers -> Calculate true Equal Split
                const totalTripCost = ride.estimatedCostPerHead * (1 + ride.totalSeats);
                const costPerHeadFinal = Math.round(totalTripCost / (1 + confirmedCount));

                // Freeze ride
                ride.costLocked = true;
                ride.costPerHeadFinal = costPerHeadFinal;
                ride.confirmedRiderCount = confirmedCount;
                await ride.save({ session });

                // Process Escrow Delta for all confirmed bookings
                for (const booking of bookings) {
                    const delta = costPerHeadFinal - booking.holdAmountProvisional;
                    
                    if (delta > 0) {
                        await processLockDelta(booking.passengerId, booking._id, delta, session);
                    }

                    booking.holdAmountFinal = costPerHeadFinal;
                    await booking.save({ session });
                }

                await session.commitTransaction();

                // Notify Driver of locked roster with real count
                sendNotification({
                  userId: ride.driverId,
                  type: 'booking_accepted',
                  message: `Roster locked! Confirmed passengers: ${confirmedCount}. Final cost per head: ₹${costPerHeadFinal}.`,
                  relatedRideId: ride._id,
                });

                // Notify each confirmed passenger of final locked cost
                for (const booking of bookings) {
                  sendNotification({
                    userId: booking.passengerId,
                    type: 'booking_accepted',
                    message: `Your ride is locked! Final cost is ₹${costPerHeadFinal}. Driver is ready.`,
                    relatedRideId: ride._id,
                  });
                }

                console.log(`✅ Locked Ride ${ride._id} | Final Cost: ₹${costPerHeadFinal} | Confirmed Riders: ${confirmedCount}`);
            } catch (err) {
                await session.abortTransaction();
                console.error(`❌ Failed to lock ride ${ride._id}:`, err.message);
            }
        }
    } catch (error) {
        console.error('Roster Lock Job Error:', error);
    } finally {
        session.endSession();
    }
};

export const startRosterLockJob = () => {
    // Run immediately on server boot to catch any past-lock rides during downtime
    runRosterLock();

    // Check every 5 minutes to ensure morning and afternoon rides freeze right on schedule
    cron.schedule('*/5 * * * *', () => {
        runRosterLock();
    });
};