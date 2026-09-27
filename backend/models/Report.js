import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Report — a safety/complaint report filed by one user against another,
 * optionally tied to a specific ride for context. Feeds the admin triage
 * queue (Phase 12).
 *
 * No natural key candidate — keeps the default auto-generated ObjectId _id.
 */
const reportSchema = new Schema(
  {
    reportedBy: {
      type: String,
      ref: 'User',
      required: [true, 'reportedBy is required'],
    },
    against: {
      type: String,
      ref: 'User',
      required: [true, 'against is required'],
    },
    rideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'investigating', 'resolved', 'dismissed'],
      default: 'open',
    },
    handledBy: {
      type: String,
      ref: 'User',
      default: null, // admin who closed/actioned it
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
);

reportSchema.index({ against: 1, status: 1 });
reportSchema.index({ reportedBy: 1 });

export default mongoose.model('Report', reportSchema);