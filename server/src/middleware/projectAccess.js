import { Project } from '../models/Project.js';
import { TeamMember } from '../models/TeamMember.js';

/**
 * Middleware to verify project access and attach user's project-specific role.
 */
export const requireProjectAccess = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.params.id;
    if (!projectId || !projectId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid project ID format',
        data: null,
        errors: null
      });
    }

    const project = await Project.findById(projectId);
    if (!project || project.isDeleted) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
        errors: null
      });
    }

    // Tenant check: project must belong to caller's college (Super Admin exempt)
    if (
      req.user.globalRole !== 'SUPER_ADMIN' &&
      project.collegeId.toString() !== req.collegeId.toString()
    ) {
      // 404 to avoid leaking cross-college existence
      return res.status(404).json({
        success: false,
        message: 'Project not found',
        data: null,
        errors: null
      });
    }

    req.project = project;

    // Check project administration rights
    if (req.user.globalRole === 'SUPER_ADMIN' || req.user.globalRole === 'COLLEGE_ADMIN') {
      req.isProjectAdmin = true;
      req.projectRole = 'LEADER';
      return next();
    }

    // Check faculty guide relation
    if (project.facultyGuideId && project.facultyGuideId.toString() === req.user._id.toString()) {
      req.isFacultyGuide = true;
    }

    // Check team membership
    const membership = await TeamMember.findOne({
      projectId: project._id,
      userId: req.user._id,
      status: 'ACTIVE'
    });

    if (membership) {
      req.teamMember = membership;
      req.projectRole = membership.projectRole; // 'LEADER' or 'MEMBER'
      return next();
    }

    // If caller is faculty guide or reviewer
    if (req.isFacultyGuide) {
      return next();
    }

    // If project is visible to college, allow read-only observer access
    if (project.visibility === 'COLLEGE' && req.method === 'GET') {
      req.isObserver = true;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'You are not a member of this project team',
      data: null,
      errors: null
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Middleware requiring caller to be the Project Leader or College/Super Admin.
 */
export const requireProjectLeader = (req, res, next) => {
  if (req.isProjectAdmin || req.projectRole === 'LEADER') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Forbidden: This action requires Team Leader permissions',
    data: null,
    errors: null
  });
};

/**
 * Middleware requiring active membership in the project team.
 */
export const requireProjectMember = (req, res, next) => {
  if (req.isProjectAdmin || req.teamMember) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Forbidden: You must be an active project team member',
    data: null,
    errors: null
  });
};

