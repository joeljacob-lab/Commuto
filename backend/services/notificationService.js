import Notification from '../models/Notification.js';

let ioInstance = null;

/**
 * Initializes the Socket.IO instance for the notification service.
 * Called once during server boot in server.js.
 */
export const initNotificationSocket = (io) => {
  ioInstance = io;
};

/**
 * Dual-Delivery Notification Dispatcher:
 * 1. Persists notification document in MongoDB.
 * 2. Emits real-time event directly to the recipient's private socket room.
 */
export const sendNotification = async ({ userId, type, message, relatedRideId = null }) => {
  try {
    // 1. Save to MongoDB
    const notification = await Notification.create({
      userId,
      type,
      message,
      relatedRideId,
      read: false,
    });

    // 2. Real-time push via Socket.IO to the user's private room
    if (ioInstance) {
      ioInstance.to(userId).emit('new_notification', notification);
    }

    return notification;
  } catch (error) {
    console.error(`❌ Failed to send notification to ${userId}:`, error.message);
    return null;
  }
};