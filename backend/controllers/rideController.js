import Ride from '../models/Ride.js';
import Vehicle from '../models/Vehicle.js';
import FuelRate from '../models/FuelRate.js';
import mongoose from 'mongoose';
import normalizeRegNo from '../utils/normalizeRegNo.js';
import { calculateRoute } from '../services/routeService.js';
import { generateDailyRides, calculateRosterLockTime } from '../jobs/dailyRideGeneratorJob.js';
import { scoreAndRankRides } from '../services/matchingService.js';
import Booking from '../models/Booking.js';
import { payoutTripToDriver } from '../services/escrowService.js';
import { recordCompletedRideTrust } from '../services/trustService.js';

// @desc    Publish a One-Off / Single-Day Ride (Ad-hoc trip)
// @route   POST /api/rides
// @access  Driver only
export const createOneOffRide = async (req, res, next) => {
  try {
    const {
      vehicleId,
      date, // YYYY-MM-DD
      departureTime, // HH:mm
      origin, // { label, coordinates: [lng, lat] }
      destination, // { label, coordinates: [lng, lat] }
      totalSeats,
    } = req.body;

    if (!vehicleId || !date || !departureTime || !origin || !destination || !totalSeats) {
      return res.status(400).json({ message: 'All ride details are required' });
    }

    // 1. Verify vehicle exists and is approved
    const normalizedReg = normalizeRegNo(vehicleId);
    const vehicle = await Vehicle.findById(normalizedReg);

    if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
    if (vehicle.ownerId !== req.user._id) {
      return res.status(403).json({ message: 'You do not own this vehicle' });
    }
    if (vehicle.verificationStatus !== 'approved') {
      return res.status(400).json({ message: 'Vehicle must be approved by admin' });
    }

    // 2. Validate seat count
    const seats = Number(totalSeats);
    if (!seats || seats < 1 || seats > vehicle.seats) {
      return res.status(400).json({
        message: `Seats must be between 1 and vehicle capacity (${vehicle.seats})`,
      });
    }

    // 3. Snapshot current fuel rate
    const latestFuel = await FuelRate.findOne().sort({ effectiveDate: -1 });
    const fuelPrice = latestFuel?.pricePerLitre || 105.0;

    // 4. Calculate route distance & road polyline
    const { distanceKm, routePolyline } = await calculateRoute(origin.coordinates, destination.coordinates);

    // 5. Calculate cost & roster lock
    const rideDate = new Date(date);
    rideDate.setHours(0, 0, 0, 0);

    const mileage = vehicle.mileageKmpl || 15;
    const dailyTripCost = (distanceKm / mileage) * fuelPrice;
    const estimatedCostPerHead = Math.max(10, Math.round(dailyTripCost / (1 + seats)));
    const rosterLockAt = calculateRosterLockTime(rideDate, departureTime);

    // 6. Create One-Off Ride (routePoolId = null)
    const ride = await Ride.create({
      routePoolId: null, // Marks this as a single-day ad-hoc ride!
      driverId: req.user._id,
      vehicleId: normalizedReg,
      date: rideDate,
      departureTime,
      origin: {
        label: origin.label,
        point: { type: 'Point', coordinates: origin.coordinates },
      },
      destination: {
        label: destination.label,
        point: { type: 'Point', coordinates: destination.coordinates },
      },
      routePolyline,
      boardingPoints: [
        {
          label: origin.label,
          point: { type: 'Point', coordinates: origin.coordinates },
        },
      ],
      availableSeats: seats,
      totalSeats: seats,
      fuelPricePerLitreUsed: fuelPrice,
      estimatedCostPerHead,
      rosterLockAt,
      status: 'published',
    });

    res.status(201).json({
      message: 'Single-day ride published successfully',
      ride,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all rides offered by the logged-in driver
// @route   GET /api/rides/my
// @access  Driver only
export const getMyDriverRides = async (req, res, next) => {
  try {
    const rides = await Ride.find({ driverId: req.user._id })
      .populate('vehicleId', 'model type seats mileageKmpl color')
      .sort({ date: -1, departureTime: -1 });
      console.log(`My driver rides:`, rides.map(r => r._id));
    res.status(200).json({ rides });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single ride details
// @route   GET /api/rides/:id
// @access  Authenticated
export const getRideById = async (req, res, next) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driverId', 'name email phone')
      .populate('vehicleId', 'model type seats color mileageKmpl');

    if (!ride) return res.status(404).json({ message: 'Ride not found' });
    res.status(200).json({ ride });
  } catch (error) {
    next(error);
  }
};

// @desc    Trigger daily ride generation job manually (for testing / admin)
// @route   POST /api/rides/generate-daily
// @access  Authenticated (Driver or Admin)
export const triggerDailyGeneration = async (req, res, next) => {
  try {
    const targetDate = req.body.date ? new Date(req.body.date) : undefined;
    const result = await generateDailyRides(targetDate);

    res.status(200).json({
      message: `Generated ${result.generatedCount} ride(s) for ${result.targetDate}`,
      result,
    });
  } catch (error) {
    next(error);
  }
};



// @desc    Search and match rides for a rider
// @route   GET /api/rides/search
// @access  Authenticated
export const searchRides = async (req, res, next) => {
  try {
    const { originLng, originLat, destLng, destLat, date, time } = req.query;

    if (!originLng || !originLat || !destLng || !destLat || !date || !time) {
      return res.status(400).json({ message: 'Missing search parameters' });
    }

    const searchDate = new Date(date);
    searchDate.setHours(0, 0, 0, 0);

    // 1. Fetch all published rides with seats available for that day
    const candidateRides = await Ride.find({
      date: searchDate,
      status: 'published',
      availableSeats: { $gt: 0 },
      driverId: { $ne: req.user._id } // Don't show the user their own rides!
    })
    
      .populate('driverId', 'name collegeId') // Will populate dept once schema allows, keeping simple for now
      .populate('vehicleId', 'model color type')
      .lean(); // .lean() makes them raw JS objects, much faster to process!
    console.log(`🔍 Search Date: ${searchDate.toISOString()} | Logged-in User: ${req.user._id} | Candidates Found in DB: ${candidateRides.length}`);  

    // 2. Prep rider query
    const riderQuery = {
      time,
      originCoordinates: [parseFloat(originLng), parseFloat(originLat)],
      destinationCoordinates: [parseFloat(destLng), parseFloat(destLat)],
    };

    // 3. Inject Trust Signals (Optional: boost if driver & rider share a department later)
    const candidatesWithTrust = candidateRides.map(ride => {
      // Default verified trust. You can expand this based on trustedges later!
      ride.trustScore = 0.8; 
      return ride;
    });
    

    // 4. Run through the Pure Matching Engine!
    const rankedRides = scoreAndRankRides(riderQuery, candidatesWithTrust);

    res.status(200).json({
      resultsCount: rankedRides.length,
      rides: rankedRides,
    });
  } catch (error) {
    next(error);
  }
};



/**
 * @desc    Mark ride as completed & release escrow payout to driver
 * @route   PUT /api/rides/:id/complete
 * @access  Private (Driver only)
 */
export const completeRide = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const rideId = req.params.id;
    const driverId = req.user._id;

    // 1. Fetch and validate ride
    const ride = await Ride.findById(rideId).session(session);
    if (!ride) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.driverId !== driverId) {
      await session.abortTransaction();
      return res.status(403).json({ message: 'Only the driver can complete this ride' });
    }

    if (ride.status === 'completed') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Ride is already completed' });
    }

    if (ride.status === 'cancelled') {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Cannot complete a cancelled ride' });
    }

    // 2. Fetch confirmed bookings
    const bookings = await Booking.find({
      rideId: ride._id,
      status: 'confirmed',
    }).session(session);

    let totalPayout = 0;

    // 3. Complete each booking and credit driver
    for (const booking of bookings) {
      booking.status = 'completed';
      await booking.save({ session });

      const fareAmount = booking.holdAmountFinal || booking.holdAmountProvisional || 0;
      if (fareAmount > 0) {
        await payoutTripToDriver(driverId, booking._id, fareAmount, session);
        totalPayout += fareAmount;
      }
    }

    // 4. Mark ride status as completed
    ride.status = 'completed';
    await ride.save({ session });

    // 5. Update Trust Graph: Record mutual rides between driver and passengers
    const passengerIds = bookings.map((b) => b.passengerId);
    await recordCompletedRideTrust(driverId, passengerIds, session);

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: 'Ride completed successfully. Payout released to driver.',
      data: {
        rideId: ride._id,
        completedRiders: bookings.length,
        totalPayout,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};