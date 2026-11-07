import crypto from 'crypto';
import { Project } from '../models/Project.js';
import { Team } from '../models/Team.js';
import { TeamMember } from '../models/TeamMember.js';
import { Invitation } from '../models/Invitation.js';
import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { Activity } from '../models/Activity.js';
import { ActivityService } from './activityService.js';

export class ProjectService {
  /**
   * Generate atomic project code: {COLLEGECODE}-{YEAR}-{001}
   */
  static async generateProjectCode(collegeId) {
    const college = await College.findById(collegeId);
    const collegeCode = college ? college.collegeCode : 'COL';
    const year = new Date().getFullYear();
    const prefix = `${collegeCode}-${year}-`;

    const latestProject = await Project.findOne({
      collegeId,
      projectCode: new RegExp(`^${prefix}`)
    })
      .sort({ projectCode: -1 })
      .lean();

    let seq = 1;
    if (latestProject && latestProject.projectCode) {
      const parts = latestProject.projectCode.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        seq = lastSeq + 1;
      }
    }

    let code = `${prefix}${String(seq).padStart(3, '0')}`;
    while (await Project.exists({ projectCode: code })) {
      seq += 1;
      code = `${prefix}${String(seq).padStart(3, '0')}`;
    }

    return code;
  }

  /**
   * Generate unique alphanumeric 6-character team join code.
   */
  static async generateJoinCode() {
    let code = '';
    let exists = true;
    while (exists) {
      code = crypto.randomBytes(4).toString('hex').slice(0, 6).toUpperCase();
      exists = await Team.exists({ joinCode: code });
    }
    return code;
  }

  /**
   * Create a new project along with team and initial leader membership.
   */
  static async createProject(collegeId, userId, data) {
    const projectCode = await this.generateProjectCode(collegeId);
    const joinCode = await this.generateJoinCode();

    const project = await Project.create({
      projectCode,
      collegeId,
      title: data.title,
      abstract: data.abstract || '',
      description: data.description || '',
      objectives: data.objectives || [],
      domain: data.domain || 'General',
      techStack: data.techStack || [],
      priority: data.priority || 'MEDIUM',
      startDate: data.startDate ? new Date(data.startDate) : new Date(),
      deadline: new Date(data.deadline),
      visibility: data.visibility || 'COLLEGE',
      createdBy: userId,
      status: 'PLANNING',
      health: 'ON_TRACK',
      progress: 0
    });

    const cleanTitle = (project.title || 'Project').trim();
    const teamName = cleanTitle.length > 80 ? `${cleanTitle.slice(0, 80)}... Team` : `${cleanTitle} Team`;

    const team = await Team.create({
      collegeId,
      projectId: project._id,
      name: teamName,
      joinCode,
      createdBy: userId
    });

    project.teamId = team._id;
    await project.save();

    const leaderMember = await TeamMember.create({
      collegeId,
      teamId: team._id,
      projectId: project._id,
      userId,
      projectRole: 'LEADER',
      responsibility: 'Project Leader',
      status: 'ACTIVE'
    });

    // Handle initial email invitations if provided
    if (Array.isArray(data.invitedEmails) && data.invitedEmails.length > 0) {
      for (const email of data.invitedEmails) {
        const cleanEmail = email.trim().toLowerCase();
        const existingUser = await User.findOne({ email: cleanEmail, collegeId });
        await Invitation.create({
          collegeId,
          type: 'EMAIL_INVITE',
          projectId: project._id,
          teamId: team._id,
          email: cleanEmail,
          userId: existingUser ? existingUser._id : null,
          invitedBy: userId,
          token: crypto.randomBytes(24).toString('hex'),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        });
      }
    }

    await ActivityService.log({
      collegeId,
      projectId: project._id,
      actorId: userId,
      type: 'PROJECT_CREATED',
      entityType: 'PROJECT',
      entityId: project._id,
      message: `Created project ${project.title} (${project.projectCode})`
    });

    return this.getProjectOverview(project._id, userId);
  }

  /**
   * List projects with tenant isolation, role scoping, and filtering.
   */
  static async listProjects(collegeId, user, filters = {}) {
    const { status, search, roleFilter, page = 1, limit = 12 } = filters;
    const query = { isDeleted: false };

    if (user.globalRole !== 'SUPER_ADMIN') {
      query.collegeId = collegeId;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { projectCode: searchRegex },
        { domain: searchRegex },
        { techStack: searchRegex }
      ];
    }

    // Role-specific scoping
    if (user.globalRole === 'STUDENT') {
      if (roleFilter === 'EXPLORE') {
        // Projects visible to college where student is NOT yet a member
        const myMemberships = await TeamMember.find({
          userId: user._id,
          status: 'ACTIVE'
        }).select('projectId');
        const myProjectIds = myMemberships.map((m) => m.projectId);
        query.visibility = 'COLLEGE';
        query._id = { $nin: myProjectIds };
      } else {
        // Default: projects where user is active team member
        const myMemberships = await TeamMember.find({
          userId: user._id,
          status: 'ACTIVE'
        }).select('projectId');
        const myProjectIds = myMemberships.map((m) => m.projectId);
        query._id = { $in: myProjectIds };
      }
    } else if (user.globalRole === 'FACULTY') {
      if (roleFilter === 'SUPERVISED') {
        query.facultyGuideId = user._id;
      }
      // If no specific roleFilter for faculty, show all college projects
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('createdBy', 'name email avatar')
        .populate('facultyGuideId', 'name email avatar designation')
        .populate('teamId', 'name joinCode')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      Project.countDocuments(query)
    ]);

    // Attach caller's projectRole to each project item
    const projectIds = projects.map((p) => p._id);
    const memberships = await TeamMember.find({
      projectId: { $in: projectIds },
      userId: user._id,
      status: 'ACTIVE'
    }).lean();

    const roleMap = new Map();
    memberships.forEach((m) => roleMap.set(m.projectId.toString(), m.projectRole));

    const enriched = projects.map((proj) => ({
      ...proj,
      userProjectRole: roleMap.get(proj._id.toString()) || null
    }));

    return {
      projects: enriched,
      total,
      page: parseInt(page, 10),
      pages: Math.ceil(total / take)
    };
  }

  /**
   * Get detailed project overview including team members, health check, and recent activities.
   */
  static async getProjectOverview(projectId, userId) {
    const project = await Project.findOne({ _id: projectId, isDeleted: false })
      .populate('collegeId', 'collegeName collegeCode')
      .populate('createdBy', 'name email avatar')
      .populate('facultyGuideId', 'name email avatar designation')
      .populate('teamId', 'name joinCode createdBy')
      .lean();

    if (!project) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const teamMembers = await TeamMember.find({
      projectId,
      status: 'ACTIVE'
    })
      .populate('userId', 'name email avatar rollNumber academicYear section skills bio designation')
      .sort({ projectRole: 1, joinedAt: 1 })
      .lean();

    // Check user membership
    const callerMembership = teamMembers.find(
      (m) => m.userId && m.userId._id.toString() === userId.toString()
    );
    const isLeader = callerMembership?.projectRole === 'LEADER';

    // Pending invitations & join requests (visible to leader and admin)
    let pendingInvitations = [];
    if (isLeader) {
      pendingInvitations = await Invitation.find({
        projectId,
        status: 'PENDING'
      })
        .populate('userId', 'name email avatar rollNumber academicYear')
        .populate('invitedBy', 'name email')
        .sort({ createdAt: -1 })
        .lean();
    }

    // Recent activities (up to 10)
    const recentActivities = await Activity.find({ projectId })
      .populate('actorId', 'name avatar globalRole')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    // Calculate days remaining and health explanation
    const now = new Date();
    const deadline = new Date(project.deadline);
    const diffTime = deadline.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let computedHealth = project.health || 'ON_TRACK';
    let healthExplanation = 'Project is proceeding on schedule.';

    if (project.status === 'COMPLETED') {
      computedHealth = 'ON_TRACK';
      healthExplanation = 'Project has been completed successfully.';
    } else if (daysRemaining < 0 && project.progress < 100) {
      computedHealth = 'DELAYED';
      healthExplanation = `Deadline passed ${Math.abs(daysRemaining)} days ago with ${project.progress}% completed.`;
    } else if (daysRemaining <= 7 && project.progress < 70) {
      computedHealth = 'AT_RISK';
      healthExplanation = `Only ${daysRemaining} days remaining with ${project.progress}% progress. Requires immediate attention.`;
    } else if (project.status === 'ON_HOLD') {
      computedHealth = 'INACTIVE';
      healthExplanation = 'Project is currently on hold.';
    }

    if (computedHealth !== project.health) {
      await Project.findByIdAndUpdate(projectId, { health: computedHealth });
      project.health = computedHealth;
    }

    return {
      project,
      teamMembers,
      pendingInvitations,
      recentActivities,
      daysRemaining,
      healthExplanation,
      currentUserRole: callerMembership ? callerMembership.projectRole : null
    };
  }

  /**
   * Update project fields and append to change history.
   */
  static async updateProject(projectId, userId, updateData) {
    const project = await Project.findById(projectId);
    if (!project || project.isDeleted) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    const trackableFields = [
      'title',
      'abstract',
      'description',
      'domain',
      'techStack',
      'priority',
      'status',
      'visibility',
      'deadline'
    ];

    trackableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        let oldVal = project[field];
        let newVal = updateData[field];

        if (field === 'deadline') {
          oldVal = oldVal ? new Date(oldVal).toISOString() : null;
          newVal = newVal ? new Date(newVal).toISOString() : null;
        }

        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          project.changeHistory.push({
            field,
            oldValue: oldVal,
            newValue: newVal,
            changedBy: userId,
            changedAt: new Date(),
            reason: updateData.deadlineChangeReason || ''
          });
          project[field] = updateData[field];
        }
      }
    });

    if (updateData.objectives) {
      project.objectives = updateData.objectives;
    }
    if (updateData.startDate) {
      project.startDate = new Date(updateData.startDate);
    }

    await project.save();

    await ActivityService.log({
      collegeId: project.collegeId,
      projectId: project._id,
      actorId: userId,
      type: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: project._id,
      message: `Updated project details for ${project.title}`
    });

    return this.getProjectOverview(projectId, userId);
  }

  /**
   * Regenerate project team join code.
   */
  static async regenerateJoinCode(projectId, userId) {
    const team = await Team.findOne({ projectId });
    if (!team) {
      const err = new Error('Team not found for this project');
      err.status = 404;
      throw err;
    }

    const newCode = await this.generateJoinCode();
    team.joinCode = newCode;
    await team.save();

    await ActivityService.log({
      collegeId: team.collegeId,
      projectId,
      actorId: userId,
      type: 'PROJECT_UPDATED',
      entityType: 'TEAM',
      entityId: team._id,
      message: `Regenerated team join code to ${newCode}`
    });

    return { joinCode: newCode };
  }

  /**
   * Student enters join code to submit a join request.
   */
  static async requestJoinByCode(collegeId, userId, rawJoinCode) {
    const joinCode = rawJoinCode.trim().toUpperCase();
    const team = await Team.findOne({ joinCode, collegeId });

    if (!team) {
      const err = new Error('Invalid join code or team not found in your college');
      err.status = 404;
      throw err;
    }

    const project = await Project.findOne({ _id: team.projectId, isDeleted: false });
    if (!project) {
      const err = new Error('Project associated with this code is not found or has been deleted');
      err.status = 404;
      throw err;
    }

    // Check if already active member
    const existingMember = await TeamMember.findOne({
      projectId: project._id,
      userId,
      status: 'ACTIVE'
    });
    if (existingMember) {
      const err = new Error('You are already an active member of this project');
      err.status = 400;
      throw err;
    }

    // Check if pending request exists
    const pendingRequest = await Invitation.findOne({
      projectId: project._id,
      userId,
      type: 'JOIN_CODE_REQUEST',
      status: 'PENDING'
    });
    if (pendingRequest) {
      const err = new Error('You already have a pending join request for this project');
      err.status = 400;
      throw err;
    }

    const invitation = await Invitation.create({
      collegeId,
      type: 'JOIN_CODE_REQUEST',
      projectId: project._id,
      teamId: team._id,
      userId,
      invitedBy: userId,
      status: 'PENDING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });

    await ActivityService.log({
      collegeId,
      projectId: project._id,
      actorId: userId,
      type: 'MEMBER_JOINED',
      entityType: 'TEAM',
      entityId: team._id,
      message: `Submitted a join request via join code`
    });

    return {
      message: `Join request submitted for project "${project.title}". The project leader must approve your request.`,
      projectId: project._id,
      projectTitle: project.title,
      invitationId: invitation._id
    };
  }

  /**
   * Leader approves or rejects a join request.
   */
  static async respondJoinRequest(projectId, leaderUserId, requestId, decision) {
    const invitation = await Invitation.findOne({
      _id: requestId,
      projectId,
      type: 'JOIN_CODE_REQUEST',
      status: 'PENDING'
    }).populate('userId', 'name email');

    if (!invitation) {
      const err = new Error('Join request not found or already processed');
      err.status = 404;
      throw err;
    }

    if (decision === 'ACCEPTED') {
      invitation.status = 'ACCEPTED';
      await invitation.save();

      await TeamMember.findOneAndUpdate(
        { projectId, userId: invitation.userId._id },
        {
          collegeId: invitation.collegeId,
          teamId: invitation.teamId,
          projectId,
          userId: invitation.userId._id,
          projectRole: 'MEMBER',
          responsibility: 'Team Member',
          status: 'ACTIVE',
          joinedAt: new Date()
        },
        { upsert: true, new: true }
      );

      await ActivityService.log({
        collegeId: invitation.collegeId,
        projectId,
        actorId: leaderUserId,
        type: 'MEMBER_JOINED',
        entityType: 'TEAM',
        entityId: invitation.teamId,
        message: `Accepted join request for ${invitation.userId.name}`
      });

      return { message: `Accepted join request for ${invitation.userId.name}`, invitation };
    } else {
      invitation.status = 'REJECTED';
      await invitation.save();

      await ActivityService.log({
        collegeId: invitation.collegeId,
        projectId,
        actorId: leaderUserId,
        type: 'MEMBER_REMOVED',
        entityType: 'TEAM',
        entityId: invitation.teamId,
        message: `Rejected join request for ${invitation.userId.name}`
      });

      return { message: `Rejected join request for ${invitation.userId.name}`, invitation };
    }
  }

  /**
   * Invite member via email.
   */
  static async inviteMember(projectId, collegeId, leaderUserId, { email, responsibility }) {
    const cleanEmail = email.trim().toLowerCase();
    const team = await Team.findOne({ projectId });
    if (!team) {
      const err = new Error('Team not found');
      err.status = 404;
      throw err;
    }

    const existingUser = await User.findOne({ email: cleanEmail, collegeId });
    if (existingUser) {
      const isMember = await TeamMember.findOne({
        projectId,
        userId: existingUser._id,
        status: 'ACTIVE'
      });
      if (isMember) {
        const err = new Error('User is already an active member of this project');
        err.status = 400;
        throw err;
      }
    }

    const pendingInvite = await Invitation.findOne({
      projectId,
      email: cleanEmail,
      type: 'EMAIL_INVITE',
      status: 'PENDING'
    });
    if (pendingInvite) {
      const err = new Error('An invitation has already been sent to this email');
      err.status = 400;
      throw err;
    }

    const invitation = await Invitation.create({
      collegeId,
      type: 'EMAIL_INVITE',
      projectId,
      teamId: team._id,
      email: cleanEmail,
      userId: existingUser ? existingUser._id : null,
      invitedBy: leaderUserId,
      token: crypto.randomBytes(24).toString('hex'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      responseNote: responsibility || ''
    });

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: leaderUserId,
      type: 'MEMBER_JOINED',
      entityType: 'TEAM',
      entityId: team._id,
      message: `Sent invitation to ${cleanEmail}`
    });

    return invitation;
  }

  /**
   * Accept an email invitation using invitation token.
   */
  static async acceptEmailInvite(token, userId) {
    const invitation = await Invitation.findOne({
      token,
      type: 'EMAIL_INVITE',
      status: 'PENDING'
    });

    if (!invitation) {
      const err = new Error('Invitation not found or already processed');
      err.status = 404;
      throw err;
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = 'EXPIRED';
      await invitation.save();
      const err = new Error('This invitation has expired');
      err.status = 400;
      throw err;
    }

    invitation.status = 'ACCEPTED';
    invitation.userId = userId;
    await invitation.save();

    await TeamMember.findOneAndUpdate(
      { projectId: invitation.projectId, userId },
      {
        collegeId: invitation.collegeId,
        teamId: invitation.teamId,
        projectId: invitation.projectId,
        userId,
        projectRole: 'MEMBER',
        responsibility: invitation.responseNote || 'Team Member',
        status: 'ACTIVE',
        joinedAt: new Date()
      },
      { upsert: true, new: true }
    );

    const user = await User.findById(userId);

    await ActivityService.log({
      collegeId: invitation.collegeId,
      projectId: invitation.projectId,
      actorId: userId,
      type: 'MEMBER_JOINED',
      entityType: 'TEAM',
      entityId: invitation.teamId,
      message: `${user ? user.name : 'A new member'} accepted team invitation`
    });

    return { projectId: invitation.projectId };
  }

  /**
   * Transfer leadership to another active team member.
   */
  static async transferLeadership(projectId, currentLeaderUserId, newLeaderUserId) {
    if (currentLeaderUserId.toString() === newLeaderUserId.toString()) {
      const err = new Error('Cannot transfer leadership to yourself');
      err.status = 400;
      throw err;
    }

    const targetMember = await TeamMember.findOne({
      projectId,
      userId: newLeaderUserId,
      status: 'ACTIVE'
    });

    if (!targetMember) {
      const err = new Error('Target user is not an active member of this project');
      err.status = 400;
      throw err;
    }

    // Demote existing leader(s)
    await TeamMember.updateMany(
      { projectId, projectRole: 'LEADER' },
      { projectRole: 'MEMBER' }
    );

    // Promote target member
    targetMember.projectRole = 'LEADER';
    await targetMember.save();

    const newLeader = await User.findById(newLeaderUserId);

    await ActivityService.log({
      collegeId: targetMember.collegeId,
      projectId,
      actorId: currentLeaderUserId,
      type: 'PROJECT_UPDATED',
      entityType: 'TEAM',
      entityId: targetMember.teamId,
      message: `Transferred leadership to ${newLeader ? newLeader.name : 'another member'}`
    });

    return { message: `Leadership transferred successfully to ${newLeader?.name || 'new leader'}` };
  }

  /**
   * Remove a member or leave team.
   */
  static async removeMember(projectId, callerUserId, memberId) {
    const member = await TeamMember.findOne({ _id: memberId, projectId });
    if (!member) {
      const err = new Error('Team member not found');
      err.status = 404;
      throw err;
    }

    if (member.projectRole === 'LEADER') {
      const leaderCount = await TeamMember.countDocuments({
        projectId,
        projectRole: 'LEADER',
        status: 'ACTIVE'
      });
      if (leaderCount <= 1) {
        const err = new Error('Cannot remove the only project leader. Transfer leadership first.');
        err.status = 400;
        throw err;
      }
    }

    member.status = 'REMOVED';
    await member.save();

    const removedUser = await User.findById(member.userId);

    await ActivityService.log({
      collegeId: member.collegeId,
      projectId,
      actorId: callerUserId,
      type: 'MEMBER_REMOVED',
      entityType: 'TEAM',
      entityId: member.teamId,
      message: `Removed ${removedUser ? removedUser.name : 'member'} from the team`
    });

    return { message: 'Member removed successfully' };
  }

  /**
   * Update member responsibility.
   */
  static async updateMember(projectId, memberId, { responsibility }) {
    const member = await TeamMember.findOneAndUpdate(
      { _id: memberId, projectId },
      { responsibility },
      { new: true }
    ).populate('userId', 'name email avatar rollNumber');

    if (!member) {
      const err = new Error('Team member not found');
      err.status = 404;
      throw err;
    }

    return member;
  }

  /**
   * Soft delete / archive project.
   */
  static async deleteProject(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project || project.isDeleted) {
      const err = new Error('Project not found');
      err.status = 404;
      throw err;
    }

    project.isDeleted = true;
    project.status = 'ARCHIVED';
    await project.save();

    await ActivityService.log({
      collegeId: project.collegeId,
      projectId,
      actorId: userId,
      type: 'PROJECT_UPDATED',
      entityType: 'PROJECT',
      entityId: project._id,
      message: `Archived project ${project.title}`
    });

    return { message: 'Project archived successfully' };
  }
}

