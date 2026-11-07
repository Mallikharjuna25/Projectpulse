import { Notification } from '../models/Notification.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export class NotificationService {
  /**
   * Create a system notification and deliver it in real-time via Socket.IO
   */
  static async createNotification({
    collegeId,
    userId,
    type = 'GENERAL',
    title,
    message,
    link = ''
  }) {
    try {
      const notification = await Notification.create({
        collegeId,
        userId,
        type,
        title,
        message,
        link,
        isRead: false
      });

      // Deliver real-time notification to user's personal socket room
      try {
        const io = getIO();
        io.to(`user:${userId}`).emit('notification:new', notification);
      } catch (socketErr) {
        // Socket may not be initialized in test environment
      }

      return notification;
    } catch (err) {
      logger.error('Failed to create notification:', err);
      throw err;
    }
  }

  /**
   * Get user notifications with pagination and unread counts
   */
  static async getUserNotifications({ collegeId, userId, query = {} }) {
    const page = parseInt(query.page || 1, 10);
    const limit = parseInt(query.limit || 20, 10);
    const skip = (page - 1) * limit;

    const filter = { collegeId, userId };
    if (query.isRead !== undefined && query.isRead !== '') {
      filter.isRead = query.isRead === 'true' || query.isRead === true;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(filter),
      Notification.countDocuments({ collegeId, userId, isRead: false })
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Mark single notification as read
   */
  static async markAsRead({ collegeId, userId, notificationId }) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, collegeId, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const unreadCount = await Notification.countDocuments({
      collegeId,
      userId,
      isRead: false
    });

    return { notification, unreadCount };
  }

  /**
   * Mark all unread notifications for a user as read
   */
  static async markAllAsRead({ collegeId, userId }) {
    await Notification.updateMany(
      { collegeId, userId, isRead: false },
      { isRead: true }
    );

    return { success: true, unreadCount: 0 };
  }

  /**
   * Delete a notification
   */
  static async deleteNotification({ collegeId, userId, notificationId }) {
    const result = await Notification.deleteOne({
      _id: notificationId,
      collegeId,
      userId
    });

    if (result.deletedCount === 0) {
      const error = new Error('Notification not found');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const unreadCount = await Notification.countDocuments({
      collegeId,
      userId,
      isRead: false
    });

    return { success: true, unreadCount };
  }
}

