import { api } from './api';

export const supervisionApi = {
  // Student leader requests faculty guide
  requestFacultyGuide: (projectId, data) =>
    api.post(`/projects/${projectId}/supervision/request`, data),

  // Admin directly assigns faculty guide
  assignFacultyGuide: (projectId, data) =>
    api.post(`/projects/${projectId}/supervision/assign`, data),

  // Post progress standup update
  createProgressUpdate: (projectId, data) =>
    api.post(`/projects/${projectId}/supervision/progress-updates`, data),

  // List progress updates for project
  listProgressUpdates: (projectId) =>
    api.get(`/projects/${projectId}/supervision/progress-updates`),

  // Faculty/Reviewer submits feedback
  submitFeedback: (projectId, data) =>
    api.post(`/projects/${projectId}/supervision/feedback`, data),

  // List feedback for project
  listFeedback: (projectId) =>
    api.get(`/projects/${projectId}/supervision/feedback`),

  // Faculty dashboard statistics
  getFacultyDashboardStats: () =>
    api.get('/faculty/stats'),

  // List supervision requests
  listFacultyRequests: (params = {}) =>
    api.get('/faculty/requests', { params }),

  // Faculty responds to supervision request
  respondFacultyRequest: (requestId, data) =>
    api.post(`/faculty/requests/${requestId}/respond`, data)
};

