import express from 'express';
import { TaskController } from '../controllers/taskController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import {
  requireProjectAccess,
  requireProjectLeader
} from '../middleware/projectAccess.js';
import { validate } from '../middleware/validate.js';
import {
  createTaskSchema,
  updateTaskSchema,
  moveTaskSchema,
  toggleCriteriaSchema
} from '../validators/taskValidator.js';

// Project-nested tasks router (mergeParams: true to inherit :projectId)
export const projectTaskRouter = express.Router({ mergeParams: true });

projectTaskRouter.use(authenticate, resolveTenant, requireProjectAccess);

projectTaskRouter.get('/', TaskController.listTasks);
projectTaskRouter.post('/', requireProjectLeader, validate(createTaskSchema), TaskController.createTask);
projectTaskRouter.get('/:taskId', TaskController.getTaskById);
projectTaskRouter.patch('/:taskId', validate(updateTaskSchema), TaskController.updateTask);
projectTaskRouter.patch('/:taskId/move', validate(moveTaskSchema), TaskController.moveTask);
projectTaskRouter.delete('/:taskId', requireProjectLeader, TaskController.deleteTask);
projectTaskRouter.post('/:taskId/criteria', validate(toggleCriteriaSchema), TaskController.toggleAcceptanceCriteria);

// Standalone tasks router (e.g. /api/v1/tasks/my)
export const standaloneTaskRouter = express.Router();
standaloneTaskRouter.get('/my', authenticate, TaskController.getMyTasks);

