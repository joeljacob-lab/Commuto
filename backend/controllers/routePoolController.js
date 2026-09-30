import RoutePool from '../models/RoutePool.js';
import Vehicle from '../models/Vehicle.js';
import normalizeRegNo from '../utils/normalizeRegNo.js';
import { calculateRoute } from '../services/routeService.js';

// @desc    Create a new recurring Route Pool (Driver)
// @route   POST /api/routepools
// @access  Driver only
export const createRoutePool = async (req, res, next) => {
  try {
    const {
      vehicleId,
      origin, // { label, coordinates: [lng, lat] }
      destination, // { label, coordinates: [lng, lat] }
      recurrenceDays, // ['Mon', 'Tue', ...]
      departureWindowStart, // '08:00'
      departureWindowEnd, // '08:15'
      maxMembers,
    } = req.body;

    if (!vehicleId || !origin || !destination || !recurrenceDays || !departureWindowStart || !departureWindowEnd) {
      return res.status(400).json({ message: 'All pool fields are required' });
    }

    // 1. Verify vehicle exists and is owned by the driver
    const normalizedReg = normalizeRegNo(vehicleId);
    const vehicle = await Vehicle.findById(normalizedReg);

    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    if (vehicle.ownerId !== req.user._id) {
      return res.status(403).json({ message: 'You do not own this vehicle' });
    }

    // 2. Strict Architectural Guard: Vehicle MUST be approved by admin
    if (vehicle.verificationStatus !== 'approved') {
      return res.status(400).json({
        message: `Cannot attach vehicle. Vehicle status is "${vehicle.verificationStatus}". Only approved vehicles can be used in Route Pools.`,
      });
    }

    // 3. Seat Capacity Guard: maxMembers cannot exceed vehicle passenger seats
    const parsedMaxMembers = Number(maxMembers);
    if (!parsedMaxMembers || parsedMaxMembers < 1) {
      return res.status(400).json({ message: 'maxMembers must be at least 1' });
    }

    if (parsedMaxMembers > vehicle.seats) {
      return res.status(400).json({
        message: `maxMembers (${parsedMaxMembers}) cannot exceed vehicle seat capacity (${vehicle.seats} seats)`,
      });
    }

    // 4. Calculate real driving distance and road polyline
    const { distanceKm, routePolyline } = await calculateRoute(origin.coordinates, destination.coordinates);

    // 5. Create the RoutePool
    const pool = await RoutePool.create({
      driverId: req.user._id,
      vehicleId: normalizedReg,
      origin: {
        label: origin.label,
        point: { type: 'Point', coordinates: origin.coordinates },
      },
      destination: {
        label: destination.label,
        point: { type: 'Point', coordinates: destination.coordinates },
      },
      routePolyline,
      distanceKm,
      recurrenceDays,
      departureWindowStart,
      departureWindowEnd,
      maxMembers: parsedMaxMembers,
      status: 'active',
    });

    res.status(201).json({
      message: 'Route pool created successfully',
      routePool: pool,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all Route Pools of logged-in driver
// @route   GET /api/routepools/my
// @access  Driver only
export const getMyRoutePools = async (req, res, next) => {
  try {
    const pools = await RoutePool.find({ driverId: req.user._id })
      .populate('vehicleId', 'model type seats mileageKmpl')
      .sort({ createdAt: -1 });

    res.status(200).json({ routePools: pools });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle status of a Route Pool (active <-> paused)
// @route   PUT /api/routepools/:id/status
// @access  Driver only
export const toggleRoutePoolStatus = async (req, res, next) => {
  try {
    const pool = await RoutePool.findById(req.params.id);

    if (!pool) return res.status(404).json({ message: 'Route pool not found' });
    if (pool.driverId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to modify this pool' });
    }

    pool.status = pool.status === 'active' ? 'paused' : 'active';
    await pool.save();

    res.status(200).json({ message: `Route pool is now ${pool.status}`, routePool: pool });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete / End a Route Pool
// @route   DELETE /api/routepools/:id
// @access  Driver only
export const deleteRoutePool = async (req, res, next) => {
  try {
    const pool = await RoutePool.findById(req.params.id);

    if (!pool) return res.status(404).json({ message: 'Route pool not found' });
    if (pool.driverId !== req.user._id) {
      return res.status(403).json({ message: 'Not authorized to delete this pool' });
    }

    await RoutePool.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Route pool deleted successfully' });
  } catch (error) {
    next(error);
  }
};