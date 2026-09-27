import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Notification — in-app notification feed per user, written alongside a
 * Socket.IO emit by notificationService (Phase 11) so the same event is
 * both persisted here AND pushed in real time.
 *
 * No natural key candidate — keeps the default auto-generated ObjectId _id.
 */
const notificationSchema = new Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User is required'],
    },
    type: {
      type: String,
      enum: [
        'booking_request',
        'booking_accepted',
        'booking_rejected',
        'ride_reminder',
        'ride_cancelled',
        'report_update',
      ],
      required: [true, 'Notification type is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
    },
    relatedRideId: {
      type: Schema.Types.ObjectId,
      ref: 'Ride',
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Powers the unread-count / notification-bell query efficiently.
notificationSchema.index({ userId: 1, read: 1 });

export default mongoose.model('Notification', notificationSchema);