import { api } from './api.js';

export const collegeApi = {
  getPublicColleges: () => api.get('/public/colleges'),
  getPublicDepartments: (collegeId) => api.get(`/public/colleges/${collegeId}/departments`),
  getAllColleges: () => api.get('/colleges'),
  createCollege: (data) => api.post('/colleges', data),
  toggleCollegeStatus: (id, status) => api.patch(`/colleges/${id}/status`, { status }),
  getSuperAdminStats: () => api.get('/super-admin/stats'),
};

