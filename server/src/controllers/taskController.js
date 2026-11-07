import { TaskService } from '../services/taskService.js';

export class TaskController {
  static async createTask(req, res, next) {
    try {
      const data = await TaskService.createTask(
        req.collegeId,
        req.project._id,
        req.user._id,
        req.body
      );
      res.status(201).json({
        success: true,
        message: 'Task created successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async listTasks(req, res, next) {
    try {
      const data = await TaskService.listTasks(req.project._id, req.query);
      res.json({
        success: true,
        message: 'Tasks retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async getTaskById(req, res, next) {
    try {
      const data = await TaskService.getTaskById(req.project._id, req.params.taskId);
      res.json({
        success: true,
        message: 'Task details retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateTask(req, res, next) {
    try {
      const data = await TaskService.updateTask(
        req.project._id,
        req.params.taskId,
        req.user._id,
        req.body
      );
      res.json({
        success: true,
        message: 'Task updated successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async moveTask(req, res, next) {
    try {
      const data = await TaskService.moveTask(
        req.project._id,
        req.params.taskId,
        req.user._id,
        req.body
      );
      res.json({
        success: true,
        message: 'Task moved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteTask(req, res, next) {
    try {
      const data = await TaskService.deleteTask(
        req.project._id,
        req.params.taskId,
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

  static async toggleAcceptanceCriteria(req, res, next) {
    try {
      const data = await TaskService.toggleAcceptanceCriteria(
        req.project._id,
        req.params.taskId,
        req.user._id,
        req.body.index
      );
      res.json({
        success: true,
        message: 'Acceptance criterion updated',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }

  static async getMyTasks(req, res, next) {
    try {
      const data = await TaskService.getMyTasks(req.user._id, req.query);
      res.json({
        success: true,
        message: 'Assigned tasks retrieved successfully',
        data,
        errors: null
      });
    } catch (err) {
      next(err);
    }
  }
}

