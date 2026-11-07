import { Activity } from '../models/Activity.js';
import { Project } from '../models/Project.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export class ActivityService {
  /**
   * Log an activity and emit real-time Socket event.
   */
  static async log({
    collegeId,
    projectId,
    actorId,
    type,
    entityType = 'PROJECT',
    entityId = null,
    message,
    metadata = {}
  }) {
    try {
      const activity = await Activity.create({
        collegeId,
        projectId,
        actorId,
        type,
        entityType,
        entityId,
        message,
        metadata
      });

      // Update project's lastActivityAt
      await Project.findByIdAndUpdate(projectId, { lastActivityAt: new Date() });

      // Populate actor details for real-time feed
      const populated = await Activity.findById(activity._id)
        .populate('actorId', 'name avatar globalRole')
        .lean();

      try {
        const io = getIO();
        io.to(`project:${projectId}`).emit('activity:new', populated);
      } catch {
        // Socket may not be initialized in test environment
      }

      return populated;
    } catch (err) {
      logger.error('Failed to log activity:', err);
    }
  }

  /**
   * List activities for a project with optional filtering and pagination.
   */
  static async listActivities(projectId, options = {}) {
    const { type, limit = 20, page = 1 } = options;
    const query = { projectId };
    if (type) query.type = type;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('actorId', 'name avatar email globalRole')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Activity.countDocuments(query)
    ]);

    return { activities, total, page: parseInt(page, 10), pages: Math.ceil(total / take) };
  }
}

