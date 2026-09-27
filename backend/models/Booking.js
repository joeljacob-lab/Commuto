import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Booking — a rider's seat request/confirmation on a specific Ride.
 * Two-stage escrow hold (see Commuto_Master_Spec.md §7.3):
 *   - holdAmountProvisional: locked at request time, from estimatedCostPerHead
 *   - holdAmountFinal: set once at the ride's rosterLockAt, from costPerHeadFinal;
 *     any delta from provisional is refunded/topped-up automatically
 *
 * No natural key candidate — a booking is an event, not an entity with an
 * external identity, so it keeps the default auto-generated ObjectId _id.
 */

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat] — GeoJSON order
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2,
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const bookingSchema = new Schema(
  {
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride is required'],
    },
    passengerId: {
      type: String,
      ref: 'User',
      required: [true, 'Passenger is required'],
    },
    boardingPoint: {
      label: {
        type: String,
        required: true,
        trim: true,
      },
      point: {
        type: geoPointSchema,
        required: true,
      },
      // NOTE: controllers should validate this matches one of the ride's
      // own boardingPoints entries — Mongoose can't check across documents.
    },
    status: {
      type: String,
      enum: ['requested', 'confirmed', 'rejected', 'cancelled', 'completed'],
      default: 'requested',
    },
    holdAmountProvisional: {
      type: Number,
      required: [true, 'Provisional hold amount is required'],
      min: 0,
    },
    holdAmountFinal: {
      type: Number,
      default: null,
      min: 0,
      // Set exactly once, by the roster lock job.
    },
    holdStatus: {
      type: String,
      enum: ['held', 'released', 'forfeited'],
      default: 'held',
    },
    confirmedAt: {
      type: Date,
      default: null,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
    cutoffDeadline: {
      type: Date,
      default: null,
      // Mirrors the parent ride's rosterLockAt at the time this booking was
      // confirmed — the exact line that decides refund (before) vs. forfeit
      // (after) on cancellation.
    },
  },
  {
    timestamps: { createdAt: 'requestedAt', updatedAt: true },
  }
);

// Prevents the same rider from double-booking the same ride.
bookingSchema.index({ rideId: 1, passengerId: 1 }, { unique: true });
bookingSchema.index({ passengerId: 1, status: 1 });

export default mongoose.model('Booking', bookingSchema);