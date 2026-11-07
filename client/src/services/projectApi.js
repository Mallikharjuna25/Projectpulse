import { api } from './api';

export const projectApi = {
  // List projects with optional status, search, roleFilter, page, limit
  listProjects: (params = {}) => api.get('/projects', { params }),

  // Create project
  createProject: (data) => api.post('/projects', data),

  // Get project overview & details
  getProjectOverview: (projectId) => api.get(`/projects/${projectId}`),

  // Update project metadata
  updateProject: (projectId, data) => api.patch(`/projects/${projectId}`, data),

  // Delete / Archive project
  deleteProject: (projectId) => api.delete(`/projects/${projectId}`),

  // Join by code
  requestJoinByCode: (joinCode) => api.post('/projects/join-by-code', { joinCode }),

  // Regenerate join code
  regenerateJoinCode: (projectId) => api.post(`/projects/${projectId}/regenerate-code`),

  // Send email invite
  inviteMember: (projectId, data) => api.post(`/projects/${projectId}/invitations`, data),

  // Respond to join request (accept/reject)
  respondJoinRequest: (projectId, requestId, decision) =>
    api.post(`/projects/${projectId}/join-requests/${requestId}/respond`, { decision }),

  // Transfer leadership
  transferLeadership: (projectId, newLeaderUserId) =>
    api.post(`/projects/${projectId}/transfer-leadership`, { newLeaderUserId }),

  // Remove member
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),

  // Update member responsibility
  updateMember: (projectId, memberId, data) => api.patch(`/projects/${projectId}/members/${memberId}`, data),

  // List activities
  listActivities: (projectId, params = {}) => api.get(`/projects/${projectId}/activities`, { params })
};
