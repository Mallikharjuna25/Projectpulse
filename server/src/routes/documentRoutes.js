import express from 'express';
import {
  uploadDocument,
  listDocuments,
  getDocumentById,
  uploadNewVersion,
  updateDocumentStatus,
  deleteDocument
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';
import { documentUpload } from '../middleware/upload.js';

export const projectDocumentRouter = express.Router({ mergeParams: true });

// All document routes require authentication, tenant resolution, and project access verification
projectDocumentRouter.use(authenticate, resolveTenant, requireProjectAccess);

projectDocumentRouter.route('/')
  .get(listDocuments)
  .post(documentUpload.single('file'), uploadDocument);

projectDocumentRouter.route('/:documentId')
  .get(getDocumentById)
  .delete(deleteDocument);

projectDocumentRouter.post(
  '/:documentId/versions',
  documentUpload.single('file'),
  uploadNewVersion
);

projectDocumentRouter.patch(
  '/:documentId/status',
  updateDocumentStatus
);

