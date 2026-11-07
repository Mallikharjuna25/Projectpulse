import { UserManagementService } from '../services/userManagementService.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class UserManagementController {
  static listUsers = asyncHandler(async (req, res) => {
    const result = await UserManagementService.listUsers(req.collegeId, req.query);
    return apiResponse.success(res, 'Users retrieved successfully', result);
  });

  static getFacultyList = asyncHandler(async (req, res) => {
    const result = await UserManagementService.listUsers(req.collegeId, {
      role: 'FACULTY',
      isActive: true,
      limit: req.query.limit || 100
    });
    return apiResponse.success(res, 'Faculty members retrieved successfully', result);
  });

  static createFaculty = asyncHandler(async (req, res) => {
    const faculty = await UserManagementService.createFaculty(req.collegeId, req.body);
    return apiResponse.success(res, 'Faculty guide created and invitation dispatched', { faculty }, 201);
  });

  static createReviewer = asyncHandler(async (req, res) => {
    const reviewer = await UserManagementService.createReviewer(req.collegeId, req.body);
    return apiResponse.success(res, 'Project reviewer created successfully', { reviewer }, 201);
  });

  static createStudent = asyncHandler(async (req, res) => {
    const student = await UserManagementService.createStudent(req.collegeId, req.body);
    return apiResponse.success(res, 'Student created successfully', { student }, 201);
  });

  static bulkImportStudents = asyncHandler(async (req, res) => {
    let rows = [];

    // Support parsed rows in body or JSON array
    if (Array.isArray(req.body.students)) {
      rows = req.body.students;
    } else if (Array.isArray(req.body)) {
      rows = req.body;
    } else if (req.file) {
      // In case a CSV file was uploaded via multer, parse CSV string
      const csvContent = req.file.buffer.toString('utf-8');
      const lines = csvContent.split(/\r?\n/).filter((line) => line.trim().length > 0);
      if (lines.length > 1) {
        const headers = lines[0].split(',').map((h) => h.trim());
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',').map((v) => v.trim());
          const obj = {};
          headers.forEach((h, idx) => {
            obj[h] = values[idx] || '';
          });
          rows.push(obj);
        }
      }
    }

    if (!rows.length) {
      return apiResponse.error(res, 'No student rows provided for import', null, 400);
    }

    const result = await UserManagementService.bulkImportStudents(req.collegeId, rows);
    return apiResponse.success(res, `Bulk import finished: ${result.createdCount} created, ${result.skippedCount} skipped`, result);
  });

  static toggleUserStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    const result = await UserManagementService.toggleUserStatus(req.collegeId, id, isActive);
    return apiResponse.success(res, result.message, result);
  });

  static adminResetPassword = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const result = await UserManagementService.adminResetPassword(req.collegeId, id);
    return apiResponse.success(res, result.message, { resetToken: result.resetToken });
  });

  static changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await UserManagementService.changePassword(
      req.user._id,
      currentPassword,
      newPassword
    );
    return apiResponse.success(res, result.message);
  });

  static getCollegeStats = asyncHandler(async (req, res) => {
    const stats = await UserManagementService.getCollegeStats(req.collegeId);
    return apiResponse.success(res, 'College administrative statistics retrieved', { stats });
  });
}

