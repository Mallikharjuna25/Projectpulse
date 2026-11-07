import express from 'express';
import { ProjectController } from '../controllers/projectController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { requireRoles } from '../middleware/role.js';
import {
  requireProjectAccess,
  requireProjectLeader
} from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  joinByCodeSchema,
  respondJoinRequestSchema,
  inviteMemberSchema,
  transferLeadershipSchema,
  updateMemberSchema
} from '../validators/projectValidator.js';
import { projectTaskRouter } from './taskRoutes.js';
import { projectMilestoneRouter } from './milestoneRoutes.js';
import { projectSupervisionRouter } from './supervisionRoutes.js';
import { projectDocumentRouter } from './documentRoutes.js';
import { projectCommentRouter } from './commentRoutes.js';
import { projectGithubRouter } from '../integrations/github/routes/githubRoutes.js';

const router = express.Router();

// Mount project sub-routes
router.use('/:projectId/tasks', projectTaskRouter);
router.use('/:projectId/milestones', projectMilestoneRouter);
router.use('/:projectId/supervision', projectSupervisionRouter);
router.use('/:projectId/documents', projectDocumentRouter);
router.use('/:projectId/comments', projectCommentRouter);
router.use('/:projectId/github', projectGithubRouter);

// General project listing & creation
router.get('/', authenticate, resolveTenant, ProjectController.listProjects);
router.post(
  '/',
  authenticate,
  resolveTenant,
  requireRoles('STUDENT', 'FACULTY', 'COLLEGE_ADMIN'),
  validate(createProjectSchema),
  ProjectController.createProject
);

// Join by code & email invite acceptance
router.post(
  '/join-by-code',
  authenticate,
  resolveTenant,
  validate(joinByCodeSchema),
  ProjectController.requestJoinByCode
);
router.post(
  '/invitations/:token/accept',
  authenticate,
  resolveTenant,
  ProjectController.acceptEmailInvite
);

// Single project access routes
router.get(
  '/:projectId',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  ProjectController.getProjectOverview
);
router.patch(
  '/:projectId',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  validate(updateProjectSchema),
  ProjectController.updateProject
);
router.delete(
  '/:projectId',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  ProjectController.deleteProject
);

// Team management routes (Leader only)
router.post(
  '/:projectId/regenerate-code',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  ProjectController.regenerateJoinCode
);
router.post(
  '/:projectId/invitations',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  validate(inviteMemberSchema),
  ProjectController.inviteMember
);
router.post(
  '/:projectId/join-requests/:requestId/respond',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  validate(respondJoinRequestSchema),
  ProjectController.respondJoinRequest
);
router.post(
  '/:projectId/transfer-leadership',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  validate(transferLeadershipSchema),
  ProjectController.transferLeadership
);
router.delete(
  '/:projectId/members/:memberId',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  ProjectController.removeMember
);
router.patch(
  '/:projectId/members/:memberId',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  requireProjectLeader,
  validate(updateMemberSchema),
  ProjectController.updateMember
);

// Activity feed
router.get(
  '/:projectId/activities',
  authenticate,
  resolveTenant,
  requireProjectAccess,
  ProjectController.listActivities
);

export default router;

