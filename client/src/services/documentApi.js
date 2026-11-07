import { api } from './api.js';

export const documentApi = {
  // List project documents
  listDocuments: (projectId, params = {}) =>
    api.get(`/projects/${projectId}/documents`, { params }),

  // Get single document
  getDocument: (projectId, documentId) =>
    api.get(`/projects/${projectId}/documents/${documentId}`),

  // Upload initial document
  uploadDocument: (projectId, formData) =>
    api.post(`/projects/${projectId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Upload a new revision version
  uploadNewVersion: (projectId, documentId, formData) =>
    api.post(`/projects/${projectId}/documents/${documentId}/versions`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    }),

  // Change document status (e.g. SUBMITTED, APPROVED, CHANGES_REQUESTED)
  updateStatus: (projectId, documentId, data) =>
    api.patch(`/projects/${projectId}/documents/${documentId}/status`, data),

  // Delete document
  deleteDocument: (projectId, documentId) =>
    api.delete(`/projects/${projectId}/documents/${documentId}`)
};

