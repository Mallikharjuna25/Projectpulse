import { api } from './api';

export const taskApi = {
  // List tasks for a project with optional filters
  listProjectTasks: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/tasks`, { params }),

  // Create a new task in a project
  createTask: (projectId, data) =>
    api.post(`/projects/${projectId}/tasks`, data),

  // Get single task details
  getTaskById: (projectId, taskId) =>
    api.get(`/projects/${projectId}/tasks/${taskId}`),

  // Update task metadata
  updateTask: (projectId, taskId, data) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}`, data),

  // Move task (Kanban drag-and-drop / column transition)
  moveTask: (projectId, taskId, { status, order }) =>
    api.patch(`/projects/${projectId}/tasks/${taskId}/move`, {
      status,
      order
    }),

  // Delete task
  deleteTask: (projectId, taskId) =>
    api.delete(`/projects/${projectId}/tasks/${taskId}`),

  // Toggle acceptance criterion checkbox
  toggleAcceptanceCriteria: (projectId, taskId, index) =>
    api.post(`/projects/${projectId}/tasks/${taskId}/criteria`, {
      index
    }),

  // Get current student's assigned tasks across all projects
  getMyTasks: (params = {}) =>
    api.get('/tasks/my', { params })
};

