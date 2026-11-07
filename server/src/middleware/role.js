/**
 * Global role-based authorization middleware.
 * @param  {...string} allowedRoles Allowed global roles
 */
export const requireRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required',
        data: null,
        errors: null
      });
    }

    if (!allowedRoles.includes(req.user.globalRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: This action requires one of the following roles: [${allowedRoles.join(', ')}]`,
        data: null,
        errors: { userRole: req.user.globalRole, allowedRoles }
      });
    }

    next();
  };
};

export const requireSuperAdmin = requireRoles('SUPER_ADMIN');
export const requireCollegeAdmin = requireRoles('SUPER_ADMIN', 'COLLEGE_ADMIN');
export const requireFacultyOrAdmin = requireRoles('SUPER_ADMIN', 'COLLEGE_ADMIN', 'FACULTY');
export const requireStudent = requireRoles('STUDENT');

