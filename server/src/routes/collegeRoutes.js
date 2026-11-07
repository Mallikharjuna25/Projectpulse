import { Router } from 'express';
import { CollegeController } from '../controllers/collegeController.js';
import { SuperAdminController } from '../controllers/superAdminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireSuperAdmin } from '../middleware/role.js';

const router = Router();

// Public routes for registration dropdowns
router.get('/public/colleges', CollegeController.getPublicColleges);
router.get('/public/colleges/:collegeId/departments', CollegeController.getPublicDepartments);

// Super Admin platform routes
router.get('/super-admin/stats', authenticate, requireSuperAdmin, SuperAdminController.getStats);
router.get('/colleges', authenticate, requireSuperAdmin, SuperAdminController.listColleges);
router.post('/colleges', authenticate, requireSuperAdmin, SuperAdminController.createCollege);
router.patch('/colleges/:id/status', authenticate, requireSuperAdmin, CollegeController.toggleCollegeStatus);

export default router;

