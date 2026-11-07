import { api } from './api.js';

export const userManagementApi = {
  getCollegeStats: () => api.get('/admin/stats'),
  listUsers: (params) => api.get('/admin/users', { params }),
  getUsers: (params) => api.get('/admin/users', { params }),
  getFacultyList: () => api.get('/users/faculty'),
  createFaculty: (data) => api.post('/admin/users/faculty', data),
  createReviewer: (data) => api.post('/admin/users/reviewers', data),
  createStudent: (data) => api.post('/admin/users/students', data),
  bulkImportStudents: (data) => api.post('/admin/users/students/bulk-import', data),
  toggleUserStatus: (id, isActive) => api.patch(`/admin/users/${id}/status`, { isActive }),
  adminResetPassword: (id) => api.post(`/admin/users/${id}/reset-password`),
  changePassword: (data) => api.post('/users/change-password', data),
};

