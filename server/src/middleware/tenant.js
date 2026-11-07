import { College } from '../models/College.js';

/**
 * Tenant resolution middleware.
 * Verifies that the tenant (College) exists and is ACTIVE.
 * Attaches req.collegeId for scoped database queries.
 * Super Admin bypasses college affiliation check for platform-level operations.
 */
export const resolveTenant = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required for tenant resolution',
        data: null,
        errors: null
      });
    }

    // Super Admin has global platform-level access
    if (req.user.globalRole === 'SUPER_ADMIN') {
      req.collegeId = req.headers['x-tenant-college-id'] || req.user.collegeId || null;
      return next();
    }

    if (!req.user.collegeId) {
      return res.status(403).json({
        success: false,
        message: 'User is not assigned to any college tenant',
        data: null,
        errors: null
      });
    }

    const college = await College.findById(req.user.collegeId);
    if (!college) {
      return res.status(404).json({
        success: false,
        message: 'Associated college tenant does not exist',
        data: null,
        errors: null
      });
    }

    if (college.status === 'SUSPENDED') {
      return res.status(403).json({
        success: false,
        message: 'Your college access has been suspended. Please contact your college administrator.',
        data: null,
        errors: { code: 'COLLEGE_SUSPENDED' }
      });
    }

    req.college = college;
    req.collegeId = college._id;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Helper to ensure a requested resource's collegeId matches the authenticated tenant's collegeId.
 * If there is a mismatch, returns 404 to avoid leaking cross-college resource existence.
 */
export const checkTenantIsolation = (req, resourceCollegeId) => {
  if (req.user?.globalRole === 'SUPER_ADMIN') {
    return true;
  }
  if (!resourceCollegeId || !req.collegeId) {
    return false;
  }
  return resourceCollegeId.toString() === req.collegeId.toString();
};

