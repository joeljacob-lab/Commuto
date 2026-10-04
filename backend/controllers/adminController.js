import User from '../models/User.js';
import Vehicle from '../models/Vehicle.js';
import Ride from '../models/Ride.js';
import RoutePool from '../models/RoutePool.js';
import Booking from '../models/Booking.js';
import Report from '../models/Report.js';
import WalletLedger from '../models/WalletLedger.js';
import TrustEdge from '../models/TrustEdge.js';
import Review from '../models/Review.js';

/**
 * @desc    Get aggregated platform statistics across all collections
 * @route   GET /api/admin/stats
 * @access  Private (Admin only)
 */
export const getPlatformStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalRiders,
      totalDrivers,
      totalAdmins,
      totalVehicles,
      pendingVehicles,
      approvedVehicles,
      rejectedVehicles,
      totalRoutePools,
      activeRoutePools,
      totalRides,
      completedRides,
      cancelledRides,
      totalBookings,
      confirmedBookings,
      completedBookings,
      totalReports,
      openReports,
      investigatingReports,
      resolvedReports,
      totalTrustEdges,
      totalReviews,
      financialAggregates,
    ] = await Promise.all([
      // Users
      User.countDocuments(),
      User.countDocuments({ roles: 'rider' }),
      User.countDocuments({ roles: 'driver' }),
      User.countDocuments({ roles: 'admin' }),

      // Vehicles
      Vehicle.countDocuments(),
      Vehicle.countDocuments({ verificationStatus: 'pending' }),
      Vehicle.countDocuments({ verificationStatus: 'approved' }),
      Vehicle.countDocuments({ verificationStatus: 'rejected' }),

      // Route Pools
      RoutePool.countDocuments(),
      RoutePool.countDocuments({ status: 'active' }),

      // Rides
      Ride.countDocuments(),
      Ride.countDocuments({ status: 'completed' }),
      Ride.countDocuments({ status: 'cancelled' }),

      // Bookings
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' }),

      // Safety Reports
      Report.countDocuments(),
      Report.countDocuments({ status: 'open' }),
      Report.countDocuments({ status: 'investigating' }),
      Report.countDocuments({ status: 'resolved' }),

      // Trust Graph & Feedback
      TrustEdge.countDocuments(),
      Review.countDocuments(),

      // Financial Volume (from WalletLedger)
      WalletLedger.aggregate([
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ]),
    ]);

    // Format financial totals
    const financialSummary = {
      totalTopupVolume: 0,
      totalPayoutVolume: 0,
      totalForfeitedVolume: 0,
    };

    financialAggregates.forEach((item) => {
      if (item._id === 'topup') financialSummary.totalTopupVolume = item.totalAmount;
      if (item._id === 'payout') financialSummary.totalPayoutVolume = item.totalAmount;
      if (item._id === 'forfeit') financialSummary.totalForfeitedVolume = item.totalAmount;
    });

    res.status(200).json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          riders: totalRiders,
          drivers: totalDrivers,
          admins: totalAdmins,
        },
        vehicles: {
          total: totalVehicles,
          pending: pendingVehicles,
          approved: approvedVehicles,
          rejected: rejectedVehicles,
        },
        routePools: {
          total: totalRoutePools,
          active: activeRoutePools,
        },
        rides: {
          total: totalRides,
          completed: completedRides,
          cancelled: cancelledRides,
          active: totalRides - completedRides - cancelledRides,
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          completed: completedBookings,
        },
        reports: {
          total: totalReports,
          open: openReports,
          investigating: investigatingReports,
          resolved: resolvedReports,
        },
        trust: {
          edges: totalTrustEdges,
          reviews: totalReviews,
        },
        financials: financialSummary,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get registered users with filtering and search
 * @route   GET /api/admin/users
 * @access  Private (Admin only)
 */
export const getAllUsers = async (req, res, next) => {
  try {
    const { role, search } = req.query;
    const filter = {};

    if (role && role !== 'all') {
      filter.roles = role;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { _id: searchRegex },
      ];
    }

    const users = await User.find(filter)
      .populate('deptId', 'name code')
      .select('-passwordHash')
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    res.status(200).json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    next(error);
  }
};