import { api } from './api.js';

export const commentApi = {
  // List comments for an entity (discussion, task, etc.)
  listComments: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/comments`, { params }),

  // Post new comment
  createComment: (projectId, data) =>
    api.post(`/projects/${projectId}/comments`, data),

  // Delete comment
  deleteComment: (projectId, commentId) =>
    api.delete(`/projects/${projectId}/comments/${commentId}`)
};

