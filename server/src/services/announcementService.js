import { Announcement } from '../models/Announcement.js';
import { Project } from '../models/Project.js';
import { TeamMember } from '../models/TeamMember.js';
import { ActivityService } from './activityService.js';
import { getIO } from '../config/socket.js';

export class AnnouncementService {
  /**
   * Create an announcement (college-wide or project-specific)
   */
  static async createAnnouncement({
    collegeId,
    authorId,
    userRole,
    data
  }) {
    const { title, body, projectId = null, pinned = false } = data;

    if (!title || !title.trim()) {
      const error = new Error('Announcement title is required');
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    if (!body || !body.trim()) {
      const error = new Error('Announcement content is required');
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    if (projectId) {
      // Project announcement authorization
      const project = await Project.findOne({ _id: projectId, collegeId });
      if (!project) {
        const error = new Error('Project not found in your college');
        error.statusCode = 404;
        error.status = 404;
        throw error;
      }

      const isGuide =
        project.facultyGuideId &&
        project.facultyGuideId.toString() === authorId.toString();
      const isLeader = await TeamMember.findOne({
        projectId,
        userId: authorId,
        projectRole: 'LEADER',
        status: 'ACTIVE'
      });
      const isAdmin = userRole === 'COLLEGE_ADMIN' || userRole === 'SUPER_ADMIN';

      if (!isGuide && !isLeader && !isAdmin) {
        const error = new Error('Only project leaders, faculty guides, or college admins can post project announcements');
        error.statusCode = 403;
        error.status = 403;
        throw error;
      }
    } else {
      // College-wide announcement authorization
      if (userRole !== 'COLLEGE_ADMIN' && userRole !== 'SUPER_ADMIN') {
        const error = new Error('Only college administrators can post college-wide announcements');
        error.statusCode = 403;
        error.status = 403;
        throw error;
      }
    }

    const announcement = await Announcement.create({
      collegeId,
      projectId: projectId || null,
      authorId,
      title: title.trim(),
      body: body.trim(),
      pinned: Boolean(pinned)
    });

    const populated = await Announcement.findById(announcement._id)
      .populate('authorId', 'name avatar email globalRole')
      .lean();

    // Real-time broadcast
    try {
      const io = getIO();
      if (projectId) {
        io.to(`project:${projectId}`).emit('announcement:new', populated);
      } else {
        io.to(`college:${collegeId}`).emit('announcement:new', populated);
      }
    } catch {
      // Socket may not be initialized in test environment
    }

    if (projectId) {
      await ActivityService.log({
        collegeId,
        projectId,
        actorId: authorId,
        type: 'ANNOUNCEMENT_POSTED',
        entityType: 'ANNOUNCEMENT',
        entityId: announcement._id,
        message: `posted an announcement: "${title.trim()}"`
      });
    }

    return populated;
  }

  /**
   * List announcements (college-wide or project-scoped)
   */
  static async listAnnouncements({ collegeId, projectId = null }) {
    const filter = { collegeId };

    if (projectId) {
      // Include both project-specific announcements and college-wide broadcasts
      filter.$or = [{ projectId }, { projectId: null }];
    } else {
      filter.projectId = null;
    }

    return await Announcement.find(filter)
      .sort({ pinned: -1, createdAt: -1 })
      .populate('authorId', 'name avatar email globalRole')
      .lean();
  }

  /**
   * Toggle announcement pinned state
   */
  static async togglePin({ collegeId, announcementId, userId, userRole }) {
    const announcement = await Announcement.findOne({ _id: announcementId, collegeId });
    if (!announcement) {
      const error = new Error('Announcement not found');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    announcement.pinned = !announcement.pinned;
    await announcement.save();

    return await Announcement.findById(announcement._id)
      .populate('authorId', 'name avatar email globalRole')
      .lean();
  }

  /**
   * Delete an announcement
   */
  static async deleteAnnouncement({ collegeId, announcementId, userId, userRole }) {
    const announcement = await Announcement.findOne({ _id: announcementId, collegeId });
    if (!announcement) {
      const error = new Error('Announcement not found');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const isAuthor = announcement.authorId.toString() === userId.toString();
    const isAdmin = userRole === 'COLLEGE_ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isAuthor && !isAdmin) {
      const error = new Error('You do not have permission to delete this announcement');
      error.statusCode = 403;
      error.status = 403;
      throw error;
    }

    await Announcement.deleteOne({ _id: announcement._id });
    return { success: true };
  }
}

