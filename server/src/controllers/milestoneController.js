import { MilestoneService } from '../services/milestoneService.js';

export class MilestoneController {
  static async createMilestone(req, res, next) {
    try {
      const data = await MilestoneService.createMilestone(
        req.collegeId,
        req.project._id,
        req.user._id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Milestone created successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async listMilestones(req, res, next) {
    try {
      const data = await MilestoneService.listMilestones(req.project._id);
      res.json({
        success: true,
        message: 'Milestones retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMilestoneById(req, res, next) {
    try {
      const data = await MilestoneService.getMilestoneById(
        req.project._id,
        req.params.milestoneId
      );
      res.json({
        success: true,
        message: 'Milestone details retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateMilestone(req, res, next) {
    try {
      const data = await MilestoneService.updateMilestone(
        req.project._id,
        req.params.milestoneId,
        req.user._id,
        req.body
      );
      res.json({
        success: true,
        message: 'Milestone updated successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteMilestone(req, res, next) {
    try {
      const data = await MilestoneService.deleteMilestone(
        req.project._id,
        req.params.milestoneId,
        req.user._id
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
}

