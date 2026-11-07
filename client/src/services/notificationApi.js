import { api } from './api.js';

export const notificationApi = {
  // List notifications with pagination
  listNotifications: (params = {}) =>
    api.get('/notifications', { params }),

  // Mark single notification as read
  markAsRead: (id) =>
    api.patch(`/notifications/${id}/read`),

  // Mark all notifications as read
  markAllAsRead: () =>
    api.patch('/notifications/read-all'),

  // Delete notification
  deleteNotification: (id) =>
    api.delete(`/notifications/${id}`)
};

