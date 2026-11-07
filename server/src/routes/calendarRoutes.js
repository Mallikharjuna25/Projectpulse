import express from 'express';
import { CalendarController } from '../controllers/calendarController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { validate } from '../middleware/validate.js';
import { calendarQuerySchema } from '../validators/milestoneValidator.js';

const router = express.Router();

router.use(authenticate, resolveTenant);

router.get('/events', validate(calendarQuerySchema), CalendarController.getEvents);

export default router;

