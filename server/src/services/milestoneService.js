import { Milestone } from '../models/Milestone.js';
import { Task } from '../models/Task.js';
import { Project } from '../models/Project.js';
import { TeamMember } from '../models/TeamMember.js';
import { ActivityService } from './activityService.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export class MilestoneService {
  /**
   * Create a milestone.
   */
  static async createMilestone(collegeId, projectId, userId, data) {
    const milestone = await Milestone.create({
      collegeId,
      projectId,
      title: data.title,
      description: data.description || '',
      deliverables: data.deliverables || [],
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      dueDate: new Date(data.dueDate),
      status: data.status || 'PENDING',
      completionPercent: 0
    });

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'PROJECT_UPDATED',
      entityType: 'MILESTONE',
      entityId: milestone._id,
      message: `Created milestone "${milestone.title}" (Due: ${new Date(milestone.dueDate).toLocaleDateString()})`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('milestone:created', milestone);
    } catch {
      // test fallback
    }

    return milestone;
  }

  /**
   * List milestones for a project with dynamic linked task completion.
   */
  static async listMilestones(projectId) {
    const milestones = await Milestone.find({ projectId })
      .populate('deadlineHistory.changedBy', 'name avatar')
      .sort({ dueDate: 1 })
      .lean();

    // Compute progress dynamically from linked tasks
    const enriched = await Promise.all(
      milestones.map(async (m) => {
        const [totalTasks, completedTasks] = await Promise.all([
          Task.countDocuments({ milestoneId: m._id }),
          Task.countDocuments({ milestoneId: m._id, status: 'COMPLETED' })
        ]);

        let calculatedPercent = m.completionPercent || 0;
        if (totalTasks > 0) {
          calculatedPercent = Math.round((completedTasks / totalTasks) * 100);
        } else if (m.status === 'COMPLETED') {
          calculatedPercent = 100;
        }

        if (calculatedPercent !== m.completionPercent) {
          await Milestone.findByIdAndUpdate(m._id, { completionPercent: calculatedPercent });
          m.completionPercent = calculatedPercent;
        }

        return {
          ...m,
          totalTasks,
          completedTasks
        };
      })
    );

    return { milestones: enriched };
  }

  /**
   * Get single milestone details with linked tasks.
   */
  static async getMilestoneById(projectId, milestoneId) {
    const milestone = await Milestone.findOne({ _id: milestoneId, projectId })
      .populate('deadlineHistory.changedBy', 'name avatar')
      .lean();

    if (!milestone) {
      const err = new Error('Milestone not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const linkedTasks = await Task.find({ milestoneId })
      .populate('assignees', 'name email avatar rollNumber')
      .lean();

    return { milestone, tasks: linkedTasks };
  }

  /**
   * Update milestone with required reason if deadline is modified.
   */
  static async updateMilestone(projectId, milestoneId, userId, updateData) {
    const milestone = await Milestone.findOne({ _id: milestoneId, projectId });
    if (!milestone) {
      const err = new Error('Milestone not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    if (updateData.title !== undefined) milestone.title = updateData.title;
    if (updateData.description !== undefined) milestone.description = updateData.description;
    if (updateData.deliverables !== undefined) milestone.deliverables = updateData.deliverables;
    if (updateData.status !== undefined) milestone.status = updateData.status;
    if (updateData.startDate !== undefined) milestone.startDate = updateData.startDate ? new Date(updateData.startDate) : milestone.startDate;

    // Check if target deadline changed
    if (updateData.dueDate) {
      const oldDue = new Date(milestone.dueDate).toISOString().split('T')[0];
      const newDue = new Date(updateData.dueDate).toISOString().split('T')[0];

      if (oldDue !== newDue) {
        if (!updateData.deadlineChangeReason || !updateData.deadlineChangeReason.trim()) {
          const err = new Error('A reason is required when modifying a milestone target deadline');
          err.statusCode = 400;
          err.status = 400;
          throw err;
        }

        milestone.deadlineHistory.push({
          oldDate: milestone.dueDate,
          newDate: new Date(updateData.dueDate),
          reason: updateData.deadlineChangeReason.trim(),
          changedBy: userId,
          changedAt: new Date()
        });

        milestone.dueDate = new Date(updateData.dueDate);
      }
    }

    await milestone.save();

    await ActivityService.log({
      collegeId: milestone.collegeId,
      projectId,
      actorId: userId,
      type: 'PROJECT_UPDATED',
      entityType: 'MILESTONE',
      entityId: milestone._id,
      message: `Updated milestone "${milestone.title}"`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('milestone:updated', milestone);
    } catch {
      // test fallback
    }

    return milestone;
  }

  /**
   * Delete milestone and unlink attached tasks.
   */
  static async deleteMilestone(projectId, milestoneId, userId) {
    const milestone = await Milestone.findOne({ _id: milestoneId, projectId });
    if (!milestone) {
      const err = new Error('Milestone not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    await Task.updateMany({ milestoneId }, { milestoneId: null });
    await Milestone.deleteOne({ _id: milestoneId });

    await ActivityService.log({
      collegeId: milestone.collegeId,
      projectId,
      actorId: userId,
      type: 'PROJECT_UPDATED',
      entityType: 'MILESTONE',
      entityId: milestoneId,
      message: `Deleted milestone "${milestone.title}"`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('milestone:deleted', { milestoneId });
    } catch {
      // test fallback
    }

    return { message: 'Milestone deleted successfully' };
  }

  /**
   * Aggregate calendar events for user's visible projects.
   */
  static async getCalendarEvents(user, collegeId, query = {}) {
    let projectQuery = { isDeleted: false };

    if (user.globalRole !== 'SUPER_ADMIN') {
      projectQuery.collegeId = collegeId;
    }

    if (query.projectId) {
      projectQuery._id = query.projectId;
    } else if (user.globalRole === 'STUDENT') {
      const memberships = await TeamMember.find({
        userId: user._id,
        status: 'ACTIVE'
      }).select('projectId');
      const projectIds = memberships.map((m) => m.projectId);
      projectQuery._id = { $in: projectIds };
    } else if (user.globalRole === 'FACULTY') {
      projectQuery.$or = [{ facultyGuideId: user._id }, { createdBy: user._id }];
    }

    const projects = await Project.find(projectQuery).select('title projectCode deadline status priority').lean();
    const projectIds = projects.map((p) => p._id);

    const [milestones, tasks] = await Promise.all([
      Milestone.find({ projectId: { $in: projectIds } })
        .populate('projectId', 'title projectCode')
        .lean(),
      Task.find({ projectId: { $in: projectIds }, dueDate: { $ne: null } })
        .populate('projectId', 'title projectCode')
        .populate('assignees', 'name email avatar')
        .lean()
    ]);

    const events = [];

    // 1. Project Final Deadlines
    projects.forEach((p) => {
      if (p.deadline) {
        events.push({
          id: `proj_${p._id}`,
          title: `[Project Deadline] ${p.title}`,
          start: new Date(p.deadline).toISOString(),
          allDay: true,
          backgroundColor: '#4f46e5',
          borderColor: '#4338ca',
          textColor: '#ffffff',
          extendedProps: {
            type: 'PROJECT',
            projectId: p._id,
            projectCode: p.projectCode,
            status: p.status,
            priority: p.priority
          }
        });
      }
    });

    // 2. Milestones
    milestones.forEach((m) => {
      events.push({
        id: `ms_${m._id}`,
        title: `[Milestone] ${m.title}`,
        start: new Date(m.startDate || m.dueDate).toISOString(),
        end: new Date(m.dueDate).toISOString(),
        allDay: true,
        backgroundColor: '#7c3aed',
        borderColor: '#6d28d9',
        textColor: '#ffffff',
        extendedProps: {
          type: 'MILESTONE',
          projectId: m.projectId?._id,
          projectTitle: m.projectId?.title,
          milestoneId: m._id,
          status: m.status,
          completionPercent: m.completionPercent
        }
      });
    });

    // 3. Task Due Dates
    tasks.forEach((t) => {
      const isDone = t.status === 'COMPLETED';
      const isOverdue = !isDone && new Date() > new Date(t.dueDate);
      const color = isDone ? '#10b981' : isOverdue ? '#ef4444' : '#0284c7';

      events.push({
        id: `task_${t._id}`,
        title: `${t.taskCode}: ${t.title}`,
        start: new Date(t.dueDate).toISOString(),
        allDay: true,
        backgroundColor: color,
        borderColor: color,
        textColor: '#ffffff',
        extendedProps: {
          type: 'TASK',
          taskId: t._id,
          projectId: t.projectId?._id,
          projectTitle: t.projectId?.title,
          status: t.status,
          priority: t.priority,
          assignees: t.assignees
        }
      });
    });

    return { events };
  }
}

