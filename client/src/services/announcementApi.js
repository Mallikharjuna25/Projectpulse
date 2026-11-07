import { api } from './api.js';

export const announcementApi = {
  // List announcements (college-wide or project-scoped)
  listAnnouncements: (params = {}) =>
    api.get('/announcements', { params }),

  // Post new announcement
  createAnnouncement: (data) =>
    api.post('/announcements', data),

  // Toggle pin
  togglePin: (id) =>
    api.patch(`/announcements/${id}/pin`),

  // Delete announcement
  deleteAnnouncement: (id) =>
    api.delete(`/announcements/${id}`)
};

