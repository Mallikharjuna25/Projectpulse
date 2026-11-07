import express from 'express';
import { SupervisionController } from '../controllers/supervisionController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { requireRoles } from '../middleware/role.js';
import {
  requireProjectAccess,
  requireProjectLeader
} from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import {
  requestFacultyGuideSchema,
  respondFacultyRequestSchema,
  assignFacultyGuideSchema,
  createProgressUpdateSchema,
  submitFeedbackSchema
} from '../validators/supervisionValidator.js';

// Project-nested supervision routes
export const projectSupervisionRouter = express.Router({ mergeParams: true });

projectSupervisionRouter.use(authenticate, resolveTenant, requireProjectAccess);

// Request / Assign faculty guide
projectSupervisionRouter.post(
  '/request',
  requireProjectLeader,
  validate(requestFacultyGuideSchema),
  SupervisionController.requestFacultyGuide
);
projectSupervisionRouter.post(
  '/assign',
  requireRoles('COLLEGE_ADMIN', 'SUPER_ADMIN'),
  validate(assignFacultyGuideSchema),
  SupervisionController.assignFacultyGuide
);

// Progress Updates
projectSupervisionRouter.post(
  '/progress-updates',
  validate(createProgressUpdateSchema),
  SupervisionController.createProgressUpdate
);
projectSupervisionRouter.get(
  '/progress-updates',
  SupervisionController.listProgressUpdates
);

// Faculty Feedback & Review
projectSupervisionRouter.post(
  '/feedback',
  validate(submitFeedbackSchema),
  SupervisionController.submitFeedback
);
projectSupervisionRouter.get(
  '/feedback',
  SupervisionController.listFeedback
);

// Standalone faculty routes
export const facultyRouter = express.Router();

facultyRouter.use(authenticate, resolveTenant);

facultyRouter.get(
  '/stats',
  requireRoles('FACULTY'),
  SupervisionController.getFacultyDashboardStats
);
facultyRouter.get(
  '/requests',
  requireRoles('FACULTY', 'COLLEGE_ADMIN'),
  SupervisionController.listFacultyRequests
);
facultyRouter.post(
  '/requests/:requestId/respond',
  requireRoles('FACULTY'),
  validate(respondFacultyRequestSchema),
  SupervisionController.respondFacultyRequest
);

