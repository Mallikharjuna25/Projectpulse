import { DepartmentService } from '../services/departmentService.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class DepartmentController {
  static listDepartments = asyncHandler(async (req, res) => {
    const departments = await DepartmentService.listDepartments(req.collegeId);
    return apiResponse.success(res, 'Departments retrieved successfully', { departments });
  });

  static createDepartment = asyncHandler(async (req, res) => {
    const department = await DepartmentService.createDepartment(req.collegeId, req.body);
    return apiResponse.success(res, 'Department created successfully', { department }, 201);
  });

  static updateDepartment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const department = await DepartmentService.updateDepartment(req.collegeId, id, req.body);
    return apiResponse.success(res, 'Department updated successfully', { department });
  });

  static deleteDepartment = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await DepartmentService.deleteDepartment(req.collegeId, id);
    return apiResponse.success(res, result.message);
  });
}

