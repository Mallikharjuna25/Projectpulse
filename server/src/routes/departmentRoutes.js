import { Router } from 'express';
import { DepartmentController } from '../controllers/departmentController.js';
import { authenticate } from '../middleware/auth.js';
import { resolveTenant } from '../middleware/tenant.js';
import { requireCollegeAdmin } from '../middleware/role.js';
import { validate } from '../middleware/validate.js';
import {
  createDepartmentSchema,
  updateDepartmentSchema
} from '../validators/departmentValidator.js';

const router = Router();

// All department management routes require Authentication, Tenant Resolution, and College Admin Role
router.use(authenticate, resolveTenant, requireCollegeAdmin);

router.get('/departments', DepartmentController.listDepartments);
router.post('/departments', validate(createDepartmentSchema), DepartmentController.createDepartment);
router.put('/departments/:id', validate(updateDepartmentSchema), DepartmentController.updateDepartment);
router.delete('/departments/:id', DepartmentController.deleteDepartment);

export default router;

