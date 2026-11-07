import { Router } from 'express';
import multer from 'multer';
import { UserManagementController } from '../controllers/userManagementController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { requireCollegeAdmin } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  createFacultySchema,
  createReviewerSchema,
  createStudentByAdminSchema,
  toggleUserStatusSchema,
  changePasswordSchema
} from '../validators/userManagementValidator.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });
const router = Router();

// User self-service password change
router.post(
  '/users/change-password',
  authenticate,
  validate(changePasswordSchema),
  UserManagementController.changePassword
);

// College faculty directory (accessible to authenticated college users)
router.get(
  '/users/faculty',
  authenticate,
  resolveTenant,
  UserManagementController.getFacultyList
);

// College Admin protected routes
router.get(
  '/admin/stats',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  UserManagementController.getCollegeStats
);

router.get(
  '/admin/users',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  UserManagementController.listUsers
);

router.post(
  '/admin/users/faculty',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  validate(createFacultySchema),
  UserManagementController.createFaculty
);

router.post(
  '/admin/users/reviewers',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  validate(createReviewerSchema),
  UserManagementController.createReviewer
);

router.post(
  '/admin/users/students',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  validate(createStudentByAdminSchema),
  UserManagementController.createStudent
);

router.post(
  '/admin/users/students/bulk-import',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  upload.single('file'),
  UserManagementController.bulkImportStudents
);

router.patch(
  '/admin/users/:id/status',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  validate(toggleUserStatusSchema),
  UserManagementController.toggleUserStatus
);

router.post(
  '/admin/users/:id/reset-password',
  authenticate,
  resolveTenant,
  requireCollegeAdmin,
  UserManagementController.adminResetPassword
);

export default router;

