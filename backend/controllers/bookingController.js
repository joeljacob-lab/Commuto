import mongoose from 'mongoose';
import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';
import { holdFunds, releaseFunds, forfeitFunds } from '../services/escrowService.js';

/**
 * @desc    Book a seat on a ride
 * @route   POST /api/bookings/ride/:id
 * @access  Private (Rider)
 */
export const createBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const rideId = req.params.id;
        const riderId = req.user._id;

        // 1. Fetch and validate ride
        const ride = await Ride.findById(rideId).session(session);
        if (!ride) throw new Error('Ride not found');
        if (ride.driverId === riderId) throw new Error('Drivers cannot book their own rides');
        if (ride.status !== 'scheduled') throw new Error('Ride is not available for booking');
        if (new Date() >= ride.rosterLockAt) throw new Error('Booking closed (roster locked)');

        // 2. Check for duplicate booking
        const existingBooking = await Booking.findOne({ 
            rideId, 
            passengerId: riderId, 
            status: { $ne: 'cancelled' } 
        }).session(session);
        if (existingBooking) throw new Error('You have already booked a seat on this ride');

        // 3. Atomically reserve seat to prevent overbooking races
        const updatedRide = await Ride.findOneAndUpdate(
            { _id: rideId, availableSeats: { $gt: 0 } },
            { $inc: { availableSeats: -1, confirmedRiderCount: 1 } },
            { new: true, session }
        );

        if (!updatedRide) {
            throw new Error('No seats available or ride locked');
        }

        // 4. Calculate provisional cost (optimistic based on full occupancy)
        // [REG-11]: Final cost might be higher at lock time if car doesn't fill
        const provisionalCost = Math.round(updatedRide.totalTripCost / (1 + updatedRide.totalSeats));

        // 5. Create booking record
        const booking = new Booking({
            rideId,
            driverId: updatedRide.driverId,
            passengerId: riderId,
            status: 'confirmed',
            holdAmountProvisional: provisionalCost,
            holdStatus: 'held',
            cutoffDeadline: updatedRide.rosterLockAt
        });

        await booking.save({ session });

        // 6. Escrow Hold
        await holdFunds(riderId, booking._id, provisionalCost, session);

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ success: true, data: booking });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Cancel a booking
 * @route   PUT /api/bookings/:id/cancel
 * @access  Private (Rider)
 */
export const cancelBooking = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const bookingId = req.params.id;
        const riderId = req.user._id;

        const booking = await Booking.findOne({ _id: bookingId, passengerId: riderId }).session(session);
        if (!booking) throw new Error('Booking not found');
        if (booking.status === 'cancelled') throw new Error('Booking already cancelled');

        const ride = await Ride.findById(booking.rideId).session(session);
        if (!ride) throw new Error('Ride not found');

        const isAfterLock = new Date() >= ride.rosterLockAt;

        if (!isAfterLock) {
            // Pre-lock: Refund rider, free up the seat
            await releaseFunds(riderId, booking._id, booking.holdAmountProvisional, session);
            
            await Ride.findByIdAndUpdate(ride._id, {
                $inc: { availableSeats: 1, confirmedRiderCount: -1 }
            }, { session });

            booking.status = 'cancelled';
            booking.holdStatus = 'released';
        } else {
            // Post-lock: Forfeit hold to driver, seat is burned (not returned to pool)
            await forfeitFunds(riderId, ride.driverId, booking._id, booking.holdAmountProvisional, session);
            
            booking.status = 'cancelled';
            booking.holdStatus = 'forfeited';
        }

        await booking.save({ session });

        await session.commitTransaction();
        session.endSession();

        res.status(200).json({ 
            success: true, 
            data: booking,
            message: isAfterLock 
                ? 'Cancelled after roster lock. Funds forfeited to driver.' 
                : 'Cancelled successfully. Full refund issued.'
        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        res.status(400).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get logged in user's bookings
 * @route   GET /api/bookings/my-bookings
 * @access  Private
 */
export const getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ passengerId: req.user._id })
            .populate({ path: 'rideId', populate: { path: 'vehicleId' } })
            .sort({ createdAt: -1 });
            
        res.status(200).json({ success: true, count: bookings.length, data: bookings });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};