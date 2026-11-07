import crypto from 'crypto';
import { GithubIntegration } from '../models/GithubIntegration.js';
import { GithubEvent } from '../models/GithubEvent.js';
import { Project } from '../../../models/Project.js';
import { Task } from '../../../models/Task.js';
import { User } from '../../../models/User.js';
import { TaskService } from '../../../services/taskService.js';
import { ActivityService } from '../../../services/activityService.js';
import { verifyGithubSignature } from '../utils/webhookVerifier.js';
import { getIO } from '../../../config/socket.js';
import { logger } from '../../../utils/logger.js';

export class GithubService {
  /**
   * Connect a GitHub repository to a project
   */
  static async connectRepository({ collegeId, projectId, userId, data }) {
    const { repoFullName, repoUrl, installationId = '', accessToken = '', webhookSecret } = data;

    if (!repoFullName || !repoFullName.includes('/')) {
      const error = new Error('Valid repository name in "owner/repo" format is required');
      error.statusCode = 400;
      error.status = 400;
      throw error;
    }

    const project = await Project.findOne({ _id: projectId, collegeId });
    if (!project) {
      const error = new Error('Project not found in your college');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const secret = webhookSecret || crypto.randomBytes(24).toString('hex');
    const computedRepoUrl = repoUrl || `https://github.com/${repoFullName.trim()}`;

    let integration = await GithubIntegration.findOne({ projectId, collegeId });

    if (integration) {
      integration.repoFullName = repoFullName.trim();
      integration.repoUrl = computedRepoUrl;
      integration.installationId = installationId;
      integration.accessTokenEncrypted = accessToken ? 'encrypted_' + Buffer.from(accessToken).toString('base64') : '';
      integration.webhookSecret = secret;
      integration.status = 'CONNECTED';
      integration.connectedBy = userId;
      integration.connectedAt = new Date();
      await integration.save();
    } else {
      integration = await GithubIntegration.create({
        collegeId,
        projectId,
        repoFullName: repoFullName.trim(),
        repoUrl: computedRepoUrl,
        installationId,
        accessTokenEncrypted: accessToken ? 'encrypted_' + Buffer.from(accessToken).toString('base64') : '',
        webhookSecret: secret,
        status: 'CONNECTED',
        connectedBy: userId,
        connectedAt: new Date()
      });
    }

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'GITHUB_CONNECTED',
      entityType: 'PROJECT',
      entityId: project._id,
      message: `linked GitHub repository: "${repoFullName.trim()}"`
    });

    return await GithubIntegration.findById(integration._id)
      .populate('connectedBy', 'name email avatar')
      .lean();
  }

  /**
   * Disconnect GitHub repository from a project
   */
  static async disconnectRepository({ collegeId, projectId, userId }) {
    const integration = await GithubIntegration.findOne({ projectId, collegeId });
    if (!integration) {
      const error = new Error('No GitHub integration found for this project');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    integration.status = 'DISCONNECTED';
    await integration.save();

    await ActivityService.log({
      collegeId,
      projectId,
      actorId: userId,
      type: 'GITHUB_DISCONNECTED',
      entityType: 'PROJECT',
      entityId: projectId,
      message: `unlinked GitHub repository: "${integration.repoFullName}"`
    });

    return { success: true };
  }

  /**
   * Get GitHub integration status & stats
   */
  static async getIntegrationStatus({ collegeId, projectId }) {
    const integration = await GithubIntegration.findOne({ projectId, collegeId })
      .populate('connectedBy', 'name email avatar')
      .lean();

    return integration || { status: 'DISCONNECTED', stats: {} };
  }

  /**
   * List recent GitHub events (commits, PRs) for a project
   */
  static async listEvents({ collegeId, projectId, query = {} }) {
    const limit = parseInt(query.limit || 25, 10);
    const filter = { collegeId, projectId };

    if (query.eventType) {
      filter.eventType = query.eventType;
    }

    return await GithubEvent.find(filter)
      .sort({ receivedAt: -1 })
      .limit(limit)
      .populate('linkedTasks', 'taskCode title status priority')
      .lean();
  }

  /**
   * Ingest and process GitHub Webhook payload
   */
  static async processWebhook({ collegeId, projectId, headers = {}, payload = {} }) {
    const filter = { projectId };
    if (collegeId) {
      filter.collegeId = collegeId;
    }

    const integration = await GithubIntegration.findOne(filter);
    if (!integration || integration.status !== 'CONNECTED') {
      const error = new Error('No active GitHub repository connected to this project');
      error.statusCode = 404;
      error.status = 404;
      throw error;
    }

    const effectiveCollegeId = collegeId || integration.collegeId;

    // Verify HMAC signature if secret is configured and header provided
    const signature = headers['x-hub-signature-256'];
    if (integration.webhookSecret && signature) {
      const isValid = verifyGithubSignature(payload, signature, integration.webhookSecret);
      if (!isValid) {
        const error = new Error('Invalid GitHub webhook HMAC-SHA256 signature');
        error.statusCode = 401;
        error.status = 401;
        throw error;
      }
    }

    const eventType = headers['x-github-event'] || payload.eventType || 'push';
    const processedEvents = [];

    if (eventType === 'ping') {
      return { success: true, message: 'Ping event processed successfully' };
    }

    if (eventType === 'push') {
      const commits = Array.isArray(payload.commits) && payload.commits.length > 0
        ? payload.commits
        : [
            {
              id: payload.after || crypto.randomBytes(10).toString('hex'),
              message: payload.message || 'Commit push event',
              url: payload.compare || '',
              author: payload.head_commit?.author || { name: 'GitHub Committer', username: 'committer' },
              added: payload.head_commit?.added || [],
              modified: payload.head_commit?.modified || []
            }
          ];

      const branch = payload.ref ? payload.ref.replace('refs/heads/', '') : 'main';

      for (const c of commits) {
        const commitMessage = c.message || '';
        const sha = (c.id || '').substring(0, 7);
        const files = [...(c.added || []), ...(c.modified || [])];

        // Parse task codes mentioned in commit message (e.g. "fixes TASK-001", "#TASK-002", "TASK-003")
        const taskCodeMatches = commitMessage.match(/TASK-\d+/gi) || [];
        const uniqueTaskCodes = [...new Set(taskCodeMatches.map((t) => t.toUpperCase()))];
        const linkedTaskIds = [];

        // Check if commit message indicates task closure/completion
        const isClosingCommit = /(?:fixes|close|closes|closed|resolves|resolved)\s+(?:#)?TASK-\d+/i.test(commitMessage);

        for (const code of uniqueTaskCodes) {
          const task = await Task.findOne({ projectId, collegeId: effectiveCollegeId, taskCode: code });
          if (task) {
            linkedTaskIds.push(task._id);

            // Append GitHub commit reference to task
            task.githubLinks.push({
              type: 'COMMIT',
              url: c.url || `${integration.repoUrl}/commit/${c.id}`,
              title: `${sha}: ${commitMessage.substring(0, 80)}`
            });

            // Auto-transition task to COMPLETED if commit fixes/closes it
            if (isClosingCommit && task.status !== 'COMPLETED') {
              task.status = 'COMPLETED';
              task.completedAt = new Date();
              task.statusHistory.push({
                status: 'COMPLETED',
                changedBy: integration.connectedBy,
                changedAt: new Date()
              });

              await task.save();
              await TaskService.recalculateProjectProgress(projectId);

              try {
                const io = getIO();
                io.to(`project:${projectId}`).emit('task:updated', task);
              } catch {
                // Socket may not be initialized in test environment
              }
            } else {
              await task.save();
            }
          }
        }

        const event = await GithubEvent.create({
          collegeId: effectiveCollegeId,
          projectId,
          eventType: 'push',
          sha,
          branch,
          author: {
            name: c.author?.name || 'Committer',
            email: c.author?.email || '',
            username: c.author?.username || c.author?.name || 'git-user',
            avatarUrl: ''
          },
          message: commitMessage,
          files: files.slice(0, 10),
          url: c.url || `${integration.repoUrl}/commit/${c.id}`,
          payload: { ref: payload.ref, compare: payload.compare },
          linkedTasks: linkedTaskIds
        });

        processedEvents.push(event);

        // Update stats
        integration.stats.commitsCount += 1;
        if (linkedTaskIds.length > 0) {
          integration.stats.linkedTasksCount += linkedTaskIds.length;
        }
      }

      integration.lastSyncAt = new Date();
      await integration.save();
    } else if (eventType === 'pull_request') {
      const pr = payload.pull_request || {};
      const action = payload.action || 'opened';

      const event = await GithubEvent.create({
        collegeId: effectiveCollegeId,
        projectId,
        eventType: 'pull_request',
        action,
        sha: pr.head?.sha ? pr.head.sha.substring(0, 7) : '',
        branch: pr.head?.ref || '',
        author: {
          name: pr.user?.login || 'PR Author',
          username: pr.user?.login || 'PR Author',
          avatarUrl: pr.user?.avatar_url || ''
        },
        message: pr.title || `Pull Request #${pr.number}`,
        url: pr.html_url || '',
        payload: { number: pr.number, state: pr.state, merged: pr.merged }
      });

      processedEvents.push(event);
      integration.stats.pullRequestsCount += 1;
      integration.lastSyncAt = new Date();
      await integration.save();
    }

    // Real-time broadcast to project room
    try {
      const io = getIO();
      for (const ev of processedEvents) {
        io.to(`project:${projectId}`).emit('github:event', ev);
      }
    } catch {
      // Socket may not be initialized in test environment
    }

    return {
      success: true,
      processedEventsCount: processedEvents.length,
      events: processedEvents
    };
  }

  /**
   * Simulate a Git push webhook (for college presentation demos & offline testing)
   */
  static async simulatePush({ collegeId, projectId, userId, data }) {
    const user = await User.findById(userId).select('name email');
    const { message = 'fixes TASK-001 implement auth controller', branch = 'main', files = ['src/auth.js'] } = data;
    const sha = crypto.randomBytes(3).toString('hex');

    const fakePayload = {
      eventType: 'push',
      ref: `refs/heads/${branch}`,
      commits: [
        {
          id: `${sha}a1b2c3d4e5f6g7h8i9j0`,
          message,
          url: `https://github.com/mock-repo/commit/${sha}`,
          author: {
            name: user?.name || 'Student Developer',
            email: user?.email || 'dev@projectpulse.edu',
            username: (user?.name || 'developer').toLowerCase().replace(/\s+/g, '')
          },
          added: files,
          modified: []
        }
      ]
    };

    return await this.processWebhook({
      collegeId,
      projectId,
      headers: { 'x-github-event': 'push' },
      payload: fakePayload
    });
  }
}
