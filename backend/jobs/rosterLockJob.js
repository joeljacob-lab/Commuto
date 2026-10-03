import cron from 'node-cron';
import mongoose from 'mongoose';
import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';
import { processLockDelta } from '../services/escrowService.js';

export const startRosterLockJob = () => {
    cron.schedule('0 21 * * *', async () => {
        console.log('🔒 [CRON] Running Daily Roster Lock Job...');
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
                console.log('   No rides to lock at this time.');
                return;
            }

            for (const ride of ridesToLock) {
                session.startTransaction();
                try {
                    // 1. Fetch real confirmed bookings first to get TRUE passenger count
                    const bookings = await Booking.find({ 
                        rideId: ride._id, 
                        status: 'confirmed' 
                    }).session(session);

                    const confirmedCount = bookings.length;

                    // 2. Equal Split: total trip cost / (1 driver + confirmed passengers)
                    const totalTripCost = ride.estimatedCostPerHead * (1 + ride.totalSeats);
                    const costPerHeadFinal = Math.round(totalTripCost / (1 + confirmedCount));

                    // 3. Freeze ride
                    ride.costLocked = true;
                    ride.costPerHeadFinal = costPerHeadFinal;
                    ride.confirmedRiderCount = confirmedCount;
                    await ride.save({ session });

                    // 4. Process Escrow Delta for all confirmed bookings
                    for (const booking of bookings) {
                        const delta = costPerHeadFinal - booking.holdAmountProvisional;
                        
                        if (delta > 0) {
                            await processLockDelta(booking.passengerId, booking._id, delta, session);
                        }

                        booking.holdAmountFinal = costPerHeadFinal;
                        await booking.save({ session });
                    }

                    await session.commitTransaction();
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
    });
};