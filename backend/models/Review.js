const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Review — a post-ride rating in ONE direction (driver→passenger or
 * passenger→driver get separate documents). This is also the source of
 * truth for a user's rating: User has no stored rating field (see
 * User.js) — it's computed on demand via
 *   Review.aggregate([{ $match: { toUserId } }, { $group: { _id: null, avg: { $avg: '$rating' } } }])
 *
 * No natural key candidate — keeps the default auto-generated ObjectId _id.
 */
const reviewSchema = new Schema(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride is required'],
    },
    fromUserId: {
      type: String,
      ref: 'User',
      required: [true, 'fromUserId is required'],
    },
    toUserId: {
      type: String,
      ref: 'User',
      required: [true, 'toUserId is required'],
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be between 1 and 5'],
      max: [5, 'Rating must be between 1 and 5'],
    },
    comment: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// One review per direction per ride — stops a user from rating the same
// person on the same ride twice.
reviewSchema.index({ rideId: 1, fromUserId: 1, toUserId: 1 }, { unique: true });
reviewSchema.index({ toUserId: 1 }); // feeds the rating aggregation

module.exports = mongoose.model('Review', reviewSchema);