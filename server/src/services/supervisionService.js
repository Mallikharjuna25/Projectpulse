import { FacultyRequest } from '../models/FacultyRequest.js';
import { ProgressUpdate } from '../models/ProgressUpdate.js';
import { Feedback } from '../models/Feedback.js';
import { Project } from '../models/Project.js';
import { User } from '../models/User.js';
import { TeamMember } from '../models/TeamMember.js';
import { ActivityService } from './activityService.js';
import { getIO } from '../config/socket.js';
import { logger } from '../utils/logger.js';

export class SupervisionService {
  /**
   * Student Leader submits request for faculty supervision.
   */
  static async requestFacultyGuide(collegeId, projectId, leaderUserId, { facultyId, message }) {
    const faculty = await User.findOne({ _id: facultyId, collegeId, globalRole: 'FACULTY' });
    if (!faculty) {
      const err = new Error('Faculty guide not found in your college');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const project = await Project.findOne({ _id: projectId, collegeId, isDeleted: false });
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    if (project.facultyGuideId) {
      const err = new Error('This project already has an assigned faculty guide');
      err.statusCode = 400;
      err.status = 400;
      throw err;
    }

    // Check existing pending request
    const existingPending = await FacultyRequest.findOne({
      projectId,
      status: 'PENDING'
    });
    if (existingPending) {
      const err = new Error('There is already a pending supervision request for this project');
      err.statusCode = 400;
      err.status = 400;
      throw err;
    }

    // Check faculty capacity
    const currentSupervisedCount = await Project.countDocuments({
      collegeId,
      facultyGuideId: facultyId,
      status: { $in: ['PLANNING', 'ACTIVE'] },
      isDeleted: false
    });

    const maxCapacity = faculty.maxSupervisionCapacity || 5;
    if (currentSupervisedCount >= maxCapacity) {
      const err = new Error(
        `Faculty ${faculty.name} has reached maximum project supervision capacity (${currentSupervisedCount}/${maxCapacity})`
      );
      err.statusCode = 400;
      err.status = 400;
      throw err;
    }

    const request = await FacultyRequest.create({
      collegeId,
      projectId,
      facultyId,
      requestedBy: leaderUserId,
      source: 'STUDENT_REQUEST',
      status: 'PENDING',
      message: message || ''
    });

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: leaderUserId,
      type: 'PROJECT_UPDATED',
      entityType: 'SUPERVISION',
      entityId: request._id,
      message: `Requested supervision from ${faculty.name}`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('supervision:request_created', request);
    } catch {
      // test fallback
    }

    return request;
  }

  /**
   * Faculty Guide accepts or rejects supervision request.
   */
  static async respondFacultyRequest(collegeId, facultyUserId, requestId, { decision, responseNote }) {
    const request = await FacultyRequest.findOne({
      _id: requestId,
      facultyId: facultyUserId,
      status: 'PENDING'
    }).populate('projectId');

    if (!request) {
      const err = new Error('Supervision request not found or already processed');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const faculty = await User.findById(facultyUserId);

    if (decision === 'ACCEPTED') {
      // Check quota
      const currentCount = await Project.countDocuments({
        collegeId,
        facultyGuideId: facultyUserId,
        status: { $in: ['PLANNING', 'ACTIVE'] },
        isDeleted: false
      });
      const maxCap = faculty.maxSupervisionCapacity || 5;
      if (currentCount >= maxCap) {
        const err = new Error('You have reached your maximum supervision capacity');
        err.statusCode = 400;
        err.status = 400;
        throw err;
      }

      request.status = 'ACCEPTED';
      request.responseNote = responseNote || '';
      request.respondedAt = new Date();
      await request.save();

      // Assign to project
      await Project.findByIdAndUpdate(request.projectId._id, {
        facultyGuideId: facultyUserId
      });

      await ActivityService.log({
        collegeId,
        projectId: request.projectId._id,
        actorId: facultyUserId,
        type: 'PROJECT_UPDATED',
        entityType: 'SUPERVISION',
        entityId: request._id,
        message: `${faculty.name} accepted supervision of this project`
      });

      try {
        const io = getIO();
        io.to(`project:${request.projectId._id}`).emit('supervision:request_responded', {
          decision: 'ACCEPTED',
          facultyGuide: {
            _id: faculty._id,
            name: faculty.name,
            designation: faculty.designation,
            email: faculty.email
          }
        });
      } catch {
        // test fallback
      }

      return { message: 'Supervision request accepted successfully', request };
    } else {
      request.status = 'REJECTED';
      request.responseNote = responseNote || '';
      request.respondedAt = new Date();
      await request.save();

      await ActivityService.log({
        collegeId,
        projectId: request.projectId._id,
        actorId: facultyUserId,
        type: 'PROJECT_UPDATED',
        entityType: 'SUPERVISION',
        entityId: request._id,
        message: `${faculty.name} declined supervision request: "${responseNote || 'No reason provided'}"`
      });

      try {
        const io = getIO();
        io.to(`project:${request.projectId._id}`).emit('supervision:request_responded', {
          decision: 'REJECTED',
          responseNote
        });
      } catch {
        // test fallback
      }

      return { message: 'Supervision request rejected', request };
    }
  }

  /**
   * College Admin assigns faculty guide directly.
   */
  static async assignFacultyGuide(collegeId, projectId, adminUserId, { facultyId, message }) {
    const faculty = await User.findOne({ _id: facultyId, collegeId, globalRole: 'FACULTY' });
    if (!faculty) {
      const err = new Error('Faculty member not found in your college');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    const project = await Project.findOne({ _id: projectId, collegeId, isDeleted: false });
    if (!project) {
      const err = new Error('Project not found');
      err.statusCode = 404;
      err.status = 404;
      throw err;
    }

    // Record assignment
    const request = await FacultyRequest.create({
      collegeId,
      projectId,
      facultyId,
      requestedBy: adminUserId,
      source: 'ADMIN_ASSIGNMENT',
      status: 'ACCEPTED',
      message: message || 'Direct institutional administrative assignment',
      respondedAt: new Date()
    });

    project.facultyGuideId = facultyId;
    await project.save();

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: adminUserId,
      type: 'PROJECT_UPDATED',
      entityType: 'SUPERVISION',
      entityId: request._id,
      message: `Administrator assigned ${faculty.name} as Faculty Guide`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('supervision:assigned', {
        facultyGuide: {
          _id: faculty._id,
          name: faculty.name,
          designation: faculty.designation,
          email: faculty.email
        }
      });
    } catch {
      // test fallback
    }

    return { message: `Faculty guide ${faculty.name} assigned successfully`, project };
  }

  /**
   * List supervision requests scoped by role.
   */
  static async listFacultyRequests(collegeId, user, query = {}) {
    const filter = { collegeId };

    if (user.globalRole === 'FACULTY') {
      filter.facultyId = user._id;
    }

    if (query.status) {
      filter.status = query.status;
    }
    if (query.projectId) {
      filter.projectId = query.projectId;
    }

    const requests = await FacultyRequest.find(filter)
      .populate('projectId', 'title projectCode domain status deadline progress health')
      .populate('requestedBy', 'name email rollNumber')
      .populate('facultyId', 'name email designation')
      .sort({ createdAt: -1 })
      .lean();

    return { requests };
  }

  /**
   * Post progress standup update or meeting note.
   */
  static async createProgressUpdate(collegeId, projectId, authorUserId, data) {
    const update = await ProgressUpdate.create({
      collegeId,
      projectId,
      authorId: authorUserId,
      type: data.type || 'WEEKLY',
      content: data.content,
      blockers: data.blockers || '',
      nextSteps: data.nextSteps || '',
      weekNumber: data.weekNumber || 1
    });

    const populated = await ProgressUpdate.findById(update._id)
      .populate('authorId', 'name email avatar globalRole rollNumber')
      .lean();

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: authorUserId,
      type: 'PROJECT_UPDATED',
      entityType: 'PROGRESS_UPDATE',
      entityId: update._id,
      message: `Posted ${update.type.toLowerCase().replace('_', ' ')} progress update (Week ${update.weekNumber})`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('progress_update:created', populated);
    } catch {
      // test fallback
    }

    return populated;
  }

  /**
   * List progress updates for project.
   */
  static async listProgressUpdates(projectId) {
    const updates = await ProgressUpdate.find({ projectId })
      .populate('authorId', 'name email avatar globalRole rollNumber')
      .sort({ createdAt: -1 })
      .lean();

    return { updates };
  }

  /**
   * Faculty / Reviewer submits review feedback.
   */
  static async submitFeedback(collegeId, projectId, reviewerUserId, data) {
    const feedback = await Feedback.create({
      collegeId,
      projectId,
      entityType: data.entityType || 'PROJECT',
      entityId: data.entityId || null,
      authorId: reviewerUserId,
      comment: data.comment,
      decision: data.decision || 'COMMENT'
    });

    const populated = await Feedback.findById(feedback._id)
      .populate('authorId', 'name email avatar designation globalRole')
      .lean();

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: reviewerUserId,
      type: 'PROJECT_UPDATED',
      entityType: 'FEEDBACK',
      entityId: feedback._id,
      message: `Submitted review feedback: "${data.decision}"`
    });

    try {
      const io = getIO();
      io.to(`project:${projectId}`).emit('feedback:created', populated);
    } catch {
      // test fallback
    }

    return populated;
  }

  /**
   * List feedback for project.
   */
  static async listFeedback(projectId) {
    const feedback = await Feedback.find({ projectId })
      .populate('authorId', 'name email avatar designation globalRole')
      .sort({ createdAt: -1 })
      .lean();

    return { feedback };
  }

  /**
   * Faculty Dashboard summary stats.
   */
  static async getFacultyDashboardStats(collegeId, facultyUserId) {
    const faculty = await User.findById(facultyUserId);

    const [supervisedProjects, pendingRequests, totalReviews] = await Promise.all([
      Project.find({
        collegeId,
        facultyGuideId: facultyUserId,
        status: { $in: ['PLANNING', 'ACTIVE'] },
        isDeleted: false
      })
        .populate('teamId', 'name')
        .sort({ deadline: 1 })
        .lean(),
      FacultyRequest.find({
        collegeId,
        facultyId: facultyUserId,
        status: 'PENDING'
      })
        .populate('projectId', 'title projectCode domain deadline progress')
        .populate('requestedBy', 'name email rollNumber')
        .sort({ createdAt: -1 })
        .lean(),
      Feedback.countDocuments({ collegeId, authorId: facultyUserId })
    ]);

    const capacity = faculty?.maxSupervisionCapacity || 5;

    return {
      supervisedProjects,
      supervisedCount: supervisedProjects.length,
      pendingRequests,
      pendingRequestsCount: pendingRequests.length,
      totalReviews,
      capacity,
      capacityAvailable: Math.max(0, capacity - supervisedProjects.length)
    };
  }
}

