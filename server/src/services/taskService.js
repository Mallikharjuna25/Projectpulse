import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { ActivityService } from './activityService.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export class TaskService {
  /**
   * Generate sequential task code: TASK-001, TASK-002 per project.
   */
  static async generateTaskCode(projectId) {
    const tasks = await Task.find({ projectId }).select('taskCode').lean();
    let maxSeq = 0;

    tasks.forEach((t) => {
      if (t.taskCode) {
        const match = t.taskCode.match(/^TASK-(\d+)$/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxSeq) {
            maxSeq = num;
          }
        }
      }
    });

    let seq = maxSeq + 1;
    let code = `TASK-${String(seq).padStart(3, '0')}`;
    while (await Task.exists({ projectId, taskCode: code })) {
      seq += 1;
      code = `TASK-${String(seq).padStart(3, '0')}`;
    }

    return code;
  }

  /**
   * Recalculate project progress percentage & health based on completed tasks.
   */
  static async recalculateProjectProgress(projectId) {
    try {
      const [totalTasks, completedTasks] = await Promise.all([
        Task.countDocuments({ projectId }),
        Task.countDocuments({ projectId, status: 'COMPLETED' })
      ]);

      const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      const project = await Project.findById(projectId);
      if (project) {
        project.progress = progress;

        const now = new Date();
        const deadline = new Date(project.deadline);
        const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (project.status === 'COMPLETED' || progress === 100) {
          project.health = 'ON_TRACK';
        } else if (diffDays < 0) {
          project.health = 'DELAYED';
        } else if (diffDays <= 7 && progress < 70) {
          project.health = 'AT_RISK';
        } else {
          project.health = 'ON_TRACK';
        }

        await project.save();

        try {
          const io = getIO();
          io.to(`project:${projectId}`).emit('project:progress_updated', {
            projectId,
            progress,
            health: project.health
          });
        } catch {
          // Socket might not be active in test env
        }
      }

      return progress;
    } catch (err) {
      logger.error('Failed to recalculate project progress:', err);
    }
  }

  /**
   * Create a new task.
   */
  static async createTask(collegeId, projectId, userId, data) {
    const taskCode = await this.generateTaskCode(projectId);

    // Normalize criteria
    const criteria = (data.acceptanceCriteria || []).map((item) => {
      if (typeof item === 'string') {
        return { text: item, isCompleted: false };
      }
      return { text: item.text, isCompleted: !!item.isCompleted };
    });

    const status = data.status || 'TODO';

    // Place at end of column
    const highestInCol = await Task.findOne({ projectId, status })
      .sort({ order: -1 })
      .select('order')
      .lean();
    const order = (highestInCol?.order ?? -1) + 1;

    const task = await Task.create({
      collegeId,
      projectId,
      taskCode,
      title: data.title,
      description: data.description || '',
      acceptanceCriteria: criteria,
      priority: data.priority || 'MEDIUM',
      status,
      assignees: data.assignees || [],
      milestoneId: data.milestoneId || null,
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      order,
      statusHistory: [
        {
          status,
          changedBy: userId,
          changedAt: new Date()
        }
      ]
    });

    await this.recalculateProjectProgress(projectId);

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email avatar rollNumber')
      .lean();

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'TASK_CREATED',
      entityType: 'TASK',
      entityId: task._id,
      message: `Created task ${task.taskCode}: "${task.title}"`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('task:created', populated);
    } catch {
      // test fallback
    }

    return populated;
  }

  /**
   * List all tasks for a project with optional filters.
   */
  static async listTasks(projectId, query = {}) {
    const filter = { projectId };

    if (query.status) {
      filter.status = query.status;
    }
    if (query.assigneeId) {
      filter.assignees = query.assigneeId;
    }
    if (query.priority) {
      filter.priority = query.priority;
    }
    if (query.milestoneId) {
      filter.milestoneId = query.milestoneId;
    }
    if (query.search) {
      filter.title = new RegExp(query.search.trim(), 'i');
    }

    const tasks = await Task.find(filter)
      .populate('assignees', 'name email avatar rollNumber')
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return { tasks };
  }

  /**
   * Get single task details.
   */
  static async getTaskById(projectId, taskId) {
    const task = await Task.findOne({ _id: taskId, projectId })
      .populate('assignees', 'name email avatar rollNumber')
      .populate('statusHistory.changedBy', 'name avatar')
      .lean();

    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    return task;
  }

  /**
   * Update task fields.
   */
  static async updateTask(projectId, taskId, userId, data) {
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const oldStatus = task.status;

    if (data.title !== undefined) task.title = data.title;
    if (data.description !== undefined) task.description = data.description;
    if (data.priority !== undefined) task.priority = data.priority;
    if (data.assignees !== undefined) task.assignees = data.assignees;
    if (data.milestoneId !== undefined) task.milestoneId = data.milestoneId;
    if (data.startDate !== undefined) task.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.dueDate !== undefined) task.dueDate = data.dueDate ? new Date(data.dueDate) : null;

    if (data.acceptanceCriteria !== undefined) {
      task.acceptanceCriteria = data.acceptanceCriteria.map((item) => {
        if (typeof item === 'string') {
          return { text: item, isCompleted: false };
        }
        return { text: item.text, isCompleted: !!item.isCompleted };
      });
    }

    if (data.status !== undefined && data.status !== oldStatus) {
      task.status = data.status;
      if (data.status === 'COMPLETED') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }
      task.statusHistory.push({
        status: data.status,
        changedBy: userId,
        changedAt: new Date()
      });
    }

    await task.save();

    if (data.status !== undefined && data.status !== oldStatus) {
      await this.recalculateProjectProgress(projectId);
    }

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email avatar rollNumber')
      .populate('statusHistory.changedBy', 'name avatar')
      .lean();

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('task:updated', populated);
    } catch {
      // test fallback
    }

    return populated;
  }

  /**
   * Move task across Kanban columns and reorder.
   */
  static async moveTask(projectId, taskId, userId, { status: newStatus, order: newOrder }) {
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const oldStatus = task.status;
    const oldOrder = task.order;

    if (oldStatus !== newStatus) {
      // 1. Shift tasks in old column down
      await Task.updateMany(
        { projectId, status: oldStatus, order: { $gt: oldOrder } },
        { $inc: { order: -1 } }
      );

      // 2. Shift tasks in new column up
      await Task.updateMany(
        { projectId, status: newStatus, order: { $gte: newOrder } },
        { $inc: { order: 1 } }
      );

      task.status = newStatus;
      task.order = newOrder;
      if (newStatus === 'COMPLETED') {
        task.completedAt = new Date();
      } else {
        task.completedAt = null;
      }

      task.statusHistory.push({
        status: newStatus,
        changedBy: userId,
        changedAt: new Date()
      });

      await task.save();
      await this.recalculateProjectProgress(projectId);

      await ActivityService.log({
        collegeId: task.collegeId,
        projectId,
        actorId: userId,
        type: 'TASK_UPDATED',
        entityType: 'TASK',
        entityId: task._id,
        message: `Moved ${task.taskCode} from ${oldStatus} to ${newStatus}`
      });
    } else if (oldOrder !== newOrder) {
      // Reordering within the same column
      if (newOrder > oldOrder) {
        await Task.updateMany(
          { projectId, status: oldStatus, order: { $gt: oldOrder, $lte: newOrder } },
          { $inc: { order: -1 } }
        );
      } else {
        await Task.updateMany(
          { projectId, status: oldStatus, order: { $gte: newOrder, $lt: oldOrder } },
          { $inc: { order: 1 } }
        );
      }

      task.order = newOrder;
      await task.save();
    }

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email avatar rollNumber')
      .populate('statusHistory.changedBy', 'name avatar')
      .lean();

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('task:moved', {
        taskId,
        oldStatus,
        newStatus,
        newOrder,
        task: populated
      });
    } catch {
      // test fallback
    }

    return populated;
  }

  /**
   * Delete task and shift remaining tasks in column.
   */
  static async deleteTask(projectId, taskId, userId) {
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const { status, order, taskCode, title, collegeId } = task;

    await Task.deleteOne({ _id: taskId });

    // Shift remaining down
    await Task.updateMany(
      { projectId, status, order: { $gt: order } },
      { $inc: { order: -1 } }
    );

    await this.recalculateProjectProgress(projectId);

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'TASK_UPDATED',
      entityType: 'TASK',
      entityId: taskId,
      message: `Deleted task ${taskCode}: "${title}"`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('task:deleted', { taskId, status });
    } catch {
      // test fallback
    }

    return { message: 'Task deleted successfully' };
  }

  /**
   * Toggle acceptance criterion checkbox.
   */
  static async toggleAcceptanceCriteria(projectId, taskId, userId, index) {
    const task = await Task.findOne({ _id: taskId, projectId });
    if (!task) {
      const err = new Error('Task not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    if (!task.acceptanceCriteria || !task.acceptanceCriteria[index]) {
      const err = new Error('Acceptance criterion not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    task.acceptanceCriteria[index].isCompleted = !task.acceptanceCriteria[index].isCompleted;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name email avatar rollNumber')
      .lean();

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('task:updated', populated);
    } catch {
      // test fallback
    }

    return populated;
  }

  /**
   * List all tasks assigned to logged-in student across all projects.
   */
  static async getMyTasks(userId, query = {}) {
    const filter = { assignees: userId };

    if (query.status) {
      filter.status = query.status;
    }

    const tasks = await Task.find(filter)
      .populate('projectId', 'title projectCode domain status deadline priority')
      .populate('assignees', 'name email avatar rollNumber')
      .sort({ dueDate: 1, createdAt: -1 })
      .lean();

    return { tasks };
  }
}

