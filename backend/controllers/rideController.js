import Ride from '../models/Ride.js';
import Vehicle from '../models/Vehicle.js';
import FuelRate from '../models/FuelRate.js';
import normalizeRegNo from '../utils/normalizeRegNo.js';
import { calculateRoute } from '../services/routeService.js';
import { generateDailyRides, calculateRosterLockTime } from '../jobs/dailyRideGeneratorJob.js';

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