import { SuperAdminService } from '../services/superAdminService.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class SuperAdminController {
  static getStats = asyncHandler(async (req, res) => {
    const stats = await SuperAdminService.getPlatformStats();
    return apiResponse.success(res, 'Platform stats retrieved', { stats });
  });

  static listColleges = asyncHandler(async (req, res) => {
    const colleges = await SuperAdminService.listCollegesWithStats();
    return apiResponse.success(res, 'Colleges list with stats', { colleges });
  });

  static createCollege = asyncHandler(async (req, res) => {
    const { collegeName, collegeCode, emailDomain, address, logo, adminName, adminEmail } = req.body;
    const result = await SuperAdminService.createCollegeWithAdmin(
      { collegeName, collegeCode, emailDomain, address, logo },
      { adminName, adminEmail }
    );
    return apiResponse.success(res, 'College and initial administrator onboarded successfully', result, 201);
  });
}

