import express from 'express';
import {
  createComment,
  listComments,
  deleteComment
} from '../controllers/commentController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { requireProjectAccess } from '../middleware/projectAccess.js';

export const projectCommentRouter = express.Router({ mergeParams: true });

// All project comment routes require authentication, tenant scoping, and project access verification
projectCommentRouter.use(authenticate, resolveTenant, requireProjectAccess);

projectCommentRouter.route('/')
  .get(listComments)
  .post(createComment);

projectCommentRouter.delete('/:commentId', deleteComment);

