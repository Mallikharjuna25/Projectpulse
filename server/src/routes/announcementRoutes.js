import express from 'express';
import {
  createAnnouncement,
  listAnnouncements,
  togglePin,
  deleteAnnouncement
} from '../controllers/announcementController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';

const router = express.Router();

router.use(authenticate, resolveTenant);

router.route('/')
  .get(listAnnouncements)
  .post(createAnnouncement);

router.patch('/:id/pin', togglePin);
router.delete('/:id', deleteAnnouncement);

export default router;

