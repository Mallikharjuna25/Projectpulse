import { NotificationService } from '../services/notificationService.js';

export const listNotifications = async (req, res, next) => {
  try {
    const result = await NotificationService.getUserNotifications({
      collegeId: req.collegeId,
      userId: req.user._id,
      query: req.query
    });

    res.status(200).json({
      success: true,
      message: 'Notifications retrieved successfully',
      data: result,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const markAsRead = async (req, res, next) => {
  try {
    const result = await NotificationService.markAsRead({
      collegeId: req.collegeId,
      userId: req.user._id,
      notificationId: req.params.id
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: result,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const markAllAsRead = async (req, res, next) => {
  try {
    const result = await NotificationService.markAllAsRead({
      collegeId: req.collegeId,
      userId: req.user._id
    });

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read',
      data: result,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const result = await NotificationService.deleteNotification({
      collegeId: req.collegeId,
      userId: req.user._id,
      notificationId: req.params.id
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully',
      data: result,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

