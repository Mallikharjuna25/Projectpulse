import { api } from './api';

export const milestoneApi = {
  // List all milestones for a project with completion %
  listMilestones: (projectId) =>
    api.get(`/projects/${projectId}/milestones`),

  // Create milestone
  createMilestone: (projectId, data) =>
    api.post(`/projects/${projectId}/milestones`, data),

  // Get single milestone with linked tasks
  getMilestoneById: (projectId, milestoneId) =>
    api.get(`/projects/${projectId}/milestones/${milestoneId}`),

  // Update milestone (requires deadlineChangeReason if deadline changes)
  updateMilestone: (projectId, milestoneId, data) =>
    api.patch(`/projects/${projectId}/milestones/${milestoneId}`, data),

  // Delete milestone
  deleteMilestone: (projectId, milestoneId) =>
    api.delete(`/projects/${projectId}/milestones/${milestoneId}`),

  // Get aggregated calendar events
  getCalendarEvents: (params = {}) =>
    api.get('/calendar/events', { params })
};

