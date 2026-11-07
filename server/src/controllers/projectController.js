import { ProjectService } from '../services/projectService.js';
import { ActivityService } from '../services/activityService.js';

export class ProjectController {
  static async createProject(req, res, next) {
    try {
      const data = await ProjectService.createProject(req.collegeId, req.user._id, req.body);
      res.status(201).json({
        success: true,
        message: 'Project created successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async listProjects(req, res, next) {
    try {
      const data = await ProjectService.listProjects(req.collegeId, req.user, req.query);
      res.json({
        success: true,
        message: 'Projects retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async getProjectOverview(req, res, next) {
    try {
      const data = await ProjectService.getProjectOverview(req.project._id, req.user._id);
      res.json({
        success: true,
        message: 'Project overview retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateProject(req, res, next) {
    try {
      const data = await ProjectService.updateProject(req.project._id, req.user._id, req.body);
      res.json({
        success: true,
        message: 'Project updated successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteProject(req, res, next) {
    try {
      const data = await ProjectService.deleteProject(req.project._id, req.user._id);
      res.json({
        success: true,
        message: data.message,
        data: null,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async regenerateJoinCode(req, res, next) {
    try {
      const data = await ProjectService.regenerateJoinCode(req.project._id, req.user._id);
      res.json({
        success: true,
        message: 'Join code regenerated successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async requestJoinByCode(req, res, next) {
    try {
      const data = await ProjectService.requestJoinByCode(
        req.collegeId,
        req.user._id,
        req.body.joinCode
      );
      res.json({
        success: true,
        message: data.message,
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async respondJoinRequest(req, res, next) {
    try {
      const data = await ProjectService.respondJoinRequest(
        req.project._id,
        req.user._id,
        req.params.requestId,
        req.body.decision
      );
      res.json({
        success: true,
        message: data.message,
        data: data.invitation,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async inviteMember(req, res, next) {
    try {
      const data = await ProjectService.inviteMember(
        req.project._id,
        req.collegeId,
        req.user._id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: `Invitation sent to ${data.email}`,
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async acceptEmailInvite(req, res, next) {
    try {
      const data = await ProjectService.acceptEmailInvite(req.params.token, req.user._id);
      res.json({
        success: true,
        message: 'Successfully joined the project team',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async transferLeadership(req, res, next) {
    try {
      const data = await ProjectService.transferLeadership(
        req.project._id,
        req.user._id,
        req.body.newLeaderUserId
      );
      res.json({
        success: true,
        message: data.message,
        data: null,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async removeMember(req, res, next) {
    try {
      const data = await ProjectService.removeMember(
        req.project._id,
        req.user._id,
        req.params.memberId
      );
      res.json({
        success: true,
        message: data.message,
        data: null,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMember(req, res, next) {
    try {
      const data = await ProjectService.updateMember(
        req.project._id,
        req.params.memberId,
        req.body
      );
      res.json({
        success: true,
        message: 'Member responsibility updated',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async listActivities(req, res, next) {
    try {
      const data = await ActivityService.listActivities(req.project._id, req.query);
      res.json({
        success: true,
        message: 'Activities retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }
}

