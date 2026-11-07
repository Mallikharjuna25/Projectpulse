import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { apiResponse } from '../utils/apiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export class CollegeController {
  /**
   * Public list of active colleges for registration dropdown.
   */
  static getPublicColleges = asyncHandler(async (req, res) => {
    const colleges = await College.find({ status: 'ACTIVE' })
      .select('collegeName collegeCode emailDomain logo')
      .sort({ collegeName: 1 });

    return apiResponse.success(res, 'Active colleges list', { colleges });
  });

  /**
   * Public list of departments for a chosen college during registration.
   */
  static getPublicDepartments = asyncHandler(async (req, res) => {
    const { collegeId } = req.params;
    const departments = await Department.find({ collegeId })
      .select('name code hodName')
      .sort({ name: 1 });

    return apiResponse.success(res, 'Departments list', { departments });
  });

  /**
   * Super Admin: List all colleges with counts.
   */
  static getAllColleges = asyncHandler(async (req, res) => {
    const colleges = await College.find().sort({ createdAt: -1 });
    return apiResponse.success(res, 'All colleges retrieved', { colleges });
  });

  /**
   * Super Admin: Create new college.
   */
  static createCollege = asyncHandler(async (req, res) => {
    const { collegeName, collegeCode, emailDomain, address, logo } = req.body;
    const college = new College({
      collegeName,
      collegeCode,
      emailDomain: emailDomain || null,
      address: address || '',
      logo: logo || '',
      status: 'ACTIVE'
    });
    await college.save();
    return apiResponse.success(res, 'College created successfully', { college }, 201);
  });

  /**
   * Super Admin: Update college status (ACTIVE / SUSPENDED).
   */
  static toggleCollegeStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
      return apiResponse.error(res, 'Status must be ACTIVE or SUSPENDED', null, 400);
    }

    const college = await College.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!college) {
      return apiResponse.error(res, 'College not found', null, 404);
    }

    return apiResponse.success(res, `College status updated to ${status}`, { college });
  });
}

