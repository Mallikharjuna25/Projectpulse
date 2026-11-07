import express from 'express';
import { MilestoneController } from '../controllers/milestoneController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import {
  requireProjectAccess,
  requireProjectLeader
} from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import {
  createMilestoneSchema,
  updateMilestoneSchema
} from '../validators/milestoneValidator.js';

export const projectMilestoneRouter = express.Router({ mergeParams: true });

projectMilestoneRouter.use(authenticate, resolveTenant, requireProjectAccess);

projectMilestoneRouter.get('/', MilestoneController.listMilestones);
projectMilestoneRouter.post(
  '/',
  requireProjectLeader,
  validate(createMilestoneSchema),
  MilestoneController.createMilestone
);
projectMilestoneRouter.get('/:milestoneId', MilestoneController.getMilestoneById);
projectMilestoneRouter.patch(
  '/:milestoneId',
  requireProjectLeader,
  validate(updateMilestoneSchema),
  MilestoneController.updateMilestone
);
projectMilestoneRouter.delete(
  '/:milestoneId',
  requireProjectLeader,
  MilestoneController.deleteMilestone
);

