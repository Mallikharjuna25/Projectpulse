import { SupervisionService } from '../services/supervisionService.js';

export class SupervisionController {
  static async requestFacultyGuide(req, res, next) {
    try {
      const data = await SupervisionService.requestFacultyGuide(
        req.collegeId,
        req.project._id,
        req.user._id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Supervision request submitted successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async respondFacultyRequest(req, res, next) {
    try {
      const data = await SupervisionService.respondFacultyRequest(
        req.collegeId,
        req.user._id,
        req.params.requestId,
        req.body
      );
      res.json({
        success: true,
        message: data.message,
        data: data.request,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async assignFacultyGuide(req, res, next) {
    try {
      const data = await SupervisionService.assignFacultyGuide(
        req.collegeId,
        req.project._id,
        req.user._id,
        req.body
      );
      res.json({
        success: true,
        message: data.message,
        data: data.project,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async listFacultyRequests(req, res, next) {
    try {
      const data = await SupervisionService.listFacultyRequests(
        req.collegeId,
        req.user,
        req.query
      );
      res.json({
        success: true,
        message: 'Supervision requests retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async createProgressUpdate(req, res, next) {
    try {
      const data = await SupervisionService.createProgressUpdate(
        req.collegeId,
        req.project._id,
        req.user._id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Progress update recorded successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async listProgressUpdates(req, res, next) {
    try {
      const data = await SupervisionService.listProgressUpdates(req.project._id);
      res.json({
        success: true,
        message: 'Progress updates retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async submitFeedback(req, res, next) {
    try {
      const data = await SupervisionService.submitFeedback(
        req.collegeId,
        req.project._id,
        req.user._id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async listFeedback(req, res, next) {
    try {
      const data = await SupervisionService.listFeedback(req.project._id);
      res.json({
        success: true,
        message: 'Feedback records retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async getFacultyDashboardStats(req, res, next) {
    try {
      const data = await SupervisionService.getFacultyDashboardStats(
        req.collegeId,
        req.user._id
      );
      res.json({
        success: true,
        message: 'Faculty dashboard statistics retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }
}

