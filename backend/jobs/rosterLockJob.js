import cron from 'node-cron';
import mongoose from 'mongoose';
import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';
import { processLockDelta } from '../services/escrowService.js';

export const startRosterLockJob = () => {
    // Run at 21:00 (9 PM) every day
    cron.schedule('0 21 * * *', async () => {
        console.log('🔒 [CRON] Running Daily Roster Lock Job...');
        const session = await mongoose.startSession();

        try {
            const now = new Date();

            // Find scheduled rides where the lock time has passed
            const ridesToLock = await Ride.find({
                status: 'scheduled',
                rosterLockAt: { $lte: now }
            });

            if (ridesToLock.length === 0) {
                console.log('   No rides to lock at this time.');
                return;
            }

            for (const ride of ridesToLock) {
                session.startTransaction();
                try {
                    // 1. Equal Split Model: total cost / (driver + confirmed riders)
                    const costPerHeadFinal = Math.round(ride.totalTripCost / (1 + ride.confirmedRiderCount));

                    // 2. Lock the ride
                    ride.status = 'locked';
                    ride.costPerHeadFinal = costPerHeadFinal;
                    await ride.save({ session });

                    // 3. Process Escrow Delta for all confirmed bookings
                    const bookings = await Booking.find({ 
                        rideId: ride._id, 
                        status: 'confirmed' 
                    }).session(session);

                    for (const booking of bookings) {
                        const delta = costPerHeadFinal - booking.holdAmountProvisional;
                        
                        // If cost went up because the car didn't fill, hold the rest
                        if (delta > 0) {
                            await processLockDelta(booking.passengerId, booking._id, delta, session);
                        }

                        booking.holdAmountFinal = costPerHeadFinal;
                        await booking.save({ session });
                    }

                    await session.commitTransaction();
                    console.log(`✅ Locked Ride ${ride._id} | Final Cost: ₹${costPerHeadFinal} | Riders: ${ride.confirmedRiderCount}`);
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