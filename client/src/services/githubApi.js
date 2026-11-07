import { api } from './api.js';

export const githubApi = {
  // Get integration status and stats
  getStatus: (projectId) =>
    api.get(`/projects/${projectId}/github/status`),

  // Connect repository
  connect: (projectId, data) =>
    api.post(`/projects/${projectId}/github/connect`, data),

  // Disconnect repository
  disconnect: (projectId) =>
    api.delete(`/projects/${projectId}/github/disconnect`),

  // List commits and PR events
  listEvents: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/github/events`, { params }),

  // Simulate Git push event for college evaluations & demos
  simulateWebhook: (projectId, data = {}) =>
    api.post(`/projects/${projectId}/github/simulate-webhook`, data)
};

