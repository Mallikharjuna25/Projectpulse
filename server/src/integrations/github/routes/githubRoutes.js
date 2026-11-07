import express from 'express';
import {
  connectRepository,
  disconnectRepository,
  getIntegrationStatus,
  listEvents,
  handleWebhook,
  simulatePush
} from '../controllers/githubController.js';
import { authenticate } from '../../../middleware/auth.js';
import { resolveTenant } from '../../../middleware/tenant.js';
import { requireProjectAccess } from '../../../middleware/projectAccess.js';

export const projectGithubRouter = express.Router({ mergeParams: true });

// Public GitHub Webhook endpoint (verified via HMAC-SHA256 signature)
projectGithubRouter.post('/webhook', handleWebhook);

// Protected Project-Scoped GitHub Management endpoints
projectGithubRouter.use(authenticate, resolveTenant, requireProjectAccess);

projectGithubRouter.get('/status', getIntegrationStatus);
projectGithubRouter.post('/connect', connectRepository);
projectGithubRouter.delete('/disconnect', disconnectRepository);
projectGithubRouter.get('/events', listEvents);
projectGithubRouter.post('/simulate-webhook', simulatePush);

