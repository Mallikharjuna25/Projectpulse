import { Comment } from '../models/Comment.js';
import { User } from '../models/User.js';
import { Project } from '../models/Project.js';
import { NotificationService } from './notificationService.js';
import { ActivityService } from './activityService.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export class CommentService {
  /**
   * Create a comment, extract mentions, notify mentioned users, and emit Socket event
   */
  static async createComment({ collegeId, projectId, userId, data }) {
    const { body, entityType = 'DISCUSSION', parentId = null } = data;
    const entityId = data.entityId || projectId;

    if (!body || !body.trim()) {
      const error = new Error('Comment content cannot be empty');
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    // Extract or process mentions
    let mentions = Array.isArray(data.mentions) ? [...data.mentions] : [];

    // Parse @[username] or @username mentions in comment text if not already provided
    if (mentions.length === 0) {
      const mentionMatches = body.match(/@([a-zA-Z0-9._-]+)/g);
      if (mentionMatches && mentionMatches.length > 0) {
        const rawHandles = mentionMatches.map((m) => m.substring(1));
        const matchedUsers = await User.find({
          collegeId,
          $or: [
            { email: { $in: rawHandles.map((h) => new RegExp(h, 'i')) } },
            { name: { $in: rawHandles.map((h) => new RegExp(h, 'i')) } }
          ]
        }).select('_id');
        mentions = matchedUsers.map((u) => u._id);
      }
    }

    // Filter out author from mentions to prevent self-notification
    mentions = mentions.filter(
      (mId) => mId && mId.toString() !== userId.toString()
    );

    const comment = await Comment.create({
      collegeId,
      projectId,
      entityType,
      entityId,
      author: userId,
      body: body.trim(),
      mentions,
      parentId: parentId || null
    });

    const populatedComment = await Comment.findById(comment._id)
      .populate('author', 'name avatar globalRole email')
      .populate('mentions', 'name avatar email');

    // Notify mentioned users
    if (mentions.length > 0) {
      const authorUser = await User.findById(userId).select('name');
      const project = await Project.findById(projectId).select('title');
      const authorName = authorUser?.name || 'A team member';

      for (const targetUserId of mentions) {
        await NotificationService.createNotification({
          collegeId,
          userId: targetUserId,
          type: 'COMMENT_MENTION',
          title: `Mentioned in ${project?.title || 'Project'}`,
          message: `${authorName} mentioned you in a comment: "${body.substring(0, 80)}..."`,
          link: `/projects/${projectId}?tab=discussions`
        }).catch((err) => logger.warn(`Failed to notify mentioned user: ${err.message}`));
      }
    }

    // Real-time broadcast to project room
    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('comment:new', populatedComment);
    } catch {
      // Socket may not be initialized in test environment
    }

    // Log activity
    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'COMMENT_POSTED',
      entityType: 'DISCUSSION',
      entityId: comment._id,
      message: `posted a comment: "${body.substring(0, 60)}..."`
    });

    return populatedComment;
  }

  /**
   * List comments for a given entity (Discussion, Task, etc.)
   */
  static async listComments({ collegeId, projectId, entityType = 'DISCUSSION', entityId }) {
    const targetEntityId = entityId || projectId;

    return await Comment.find({
      collegeId,
      projectId,
      entityType,
      entityId: targetEntityId
    })
      .sort({ createdAt: 1 })
      .populate('author', 'name avatar globalRole email')
      .populate('mentions', 'name avatar email')
      .lean();
  }

  /**
   * Delete a comment and its child replies
   */
  static async deleteComment({
    collegeId,
    projectId,
    commentId,
    userId,
    userRole,
    projectRole
  }) {
    const comment = await Comment.findOne({
      _id: commentId,
      collegeId,
      projectId
    });

    if (!comment) {
      const error = new Error('Comment not found');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const isAuthor = comment.author.toString() === userId.toString();
    const isLeaderOrAdmin =
      projectRole === 'LEADER' ||
      userRole === 'COLLEGE_ADMIN' ||
      userRole === 'SUPER_ADMIN';

    if (!isAuthor && !isLeaderOrAdmin) {
      const error = new Error('You do not have permission to delete this comment');
      error.statusCode = 403;
      error.status = 403;
      throw error;
    }

    // Delete the comment and any child replies
    await Comment.deleteMany({
      collegeId,
      projectId,
      $or: [{ _id: comment._id }, { parentId: comment._id }]
    });

    return { success: true };
  }
}

