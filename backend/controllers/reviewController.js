import Review from '../models/Review.js';
import Ride from '../models/Ride.js';
import Booking from '../models/Booking.js';
import User from '../models/User.js';

/**
 * @desc    Submit a post-ride review
 * @route   POST /api/reviews
 * @access  Private
 */
export const createReview = async (req, res, next) => {
  try {
    const { rideId, toUserId, rating, comment } = req.body;
    const fromUserId = req.user._id;

    // 1. Validation
    if (!rideId || !toUserId || !rating) {
      return res.status(400).json({ message: 'rideId, toUserId, and rating are required' });
    }

    if (fromUserId === toUserId) {
      return res.status(400).json({ message: 'You cannot review yourself' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // 2. Ensure the target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return res.status(404).json({ message: 'Target user not found' });
    }

    // 3. Ensure ride exists and is completed
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({ message: 'Ride not found' });
    }

    if (ride.status !== 'completed') {
      return res.status(400).json({ message: 'Reviews can only be submitted for completed rides' });
    }

    // 4. Verify that fromUserId and toUserId actually shared this completed ride
    let sharedRide = false;

    if (ride.driverId === fromUserId) {
      // Driver reviewing a passenger: verify passenger had a completed booking
      const passengerBooking = await Booking.findOne({
        rideId,
        passengerId: toUserId,
        status: 'completed',
      });
      if (passengerBooking) sharedRide = true;
    } else if (ride.driverId === toUserId) {
      // Passenger reviewing the driver: verify passenger had a completed booking
      const riderBooking = await Booking.findOne({
        rideId,
        passengerId: fromUserId,
        status: 'completed',
      });
      if (riderBooking) sharedRide = true;
    } else {
      // Passenger reviewing a fellow passenger
      const [b1, b2] = await Promise.all([
        Booking.findOne({ rideId, passengerId: fromUserId, status: 'completed' }),
        Booking.findOne({ rideId, passengerId: toUserId, status: 'completed' }),
      ]);
      if (b1 && b2) sharedRide = true;
    }

    if (!sharedRide) {
      return res.status(403).json({
        message: 'You can only review students you shared a completed ride with',
      });
    }

    // 5. Create review (unique index prevents duplicates)
    const review = await Review.create({
      rideId,
      fromUserId,
      toUserId,
      rating: Number(rating),
      comment: comment ? comment.trim() : null,
    });

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      data: review,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: 'You have already reviewed this user for this ride',
      });
    }
    next(error);
  }
};

/**
 * @desc    Get dynamic average rating and review list for a user
 * @route   GET /api/reviews/user/:userId
 * @access  Private
 */
export const getUserReviews = async (req, res, next) => {
  try {
    const { userId } = req.params;

    // 1. Fetch all reviews received by this user
    const reviews = await Review.find({ toUserId: userId })
      .populate('fromUserId', 'name deptId')
      .populate('rideId', 'date departureTime origin destination')
      .sort({ createdAt: -1 })
      .lean();

    // 2. Compute dynamic rating on demand via MongoDB Aggregation (Schema v2 rule)
    const stats = await Review.aggregate([
      { $match: { toUserId: userId } },
      {
        $group: {
          _id: '$toUserId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 },
        },
      },
    ]);

    const averageRating = stats.length > 0 ? Number(stats[0].averageRating.toFixed(1)) : null;
    const reviewCount = stats.length > 0 ? stats[0].reviewCount : 0;

    res.status(200).json({
      success: true,
      data: {
        userId,
        averageRating,
        reviewCount,
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};