import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/index.js';
import { College } from '../src/models/College.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { TeamMember } from '../src/models/TeamMember.js';
import { Comment } from '../src/models/Comment.js';
import { Notification } from '../src/models/Notification.js';
import { Announcement } from '../src/models/Announcement.js';

let app;
let mongoServer;
let seedData;
let c1LeaderToken;
let c1MemberToken;
let c1AdminToken;
let c2StudentToken;
let c1LeaderUser;
let c1MemberUser;
let c1AdminUser;
let c2StudentUser;
let createdProjectId;
let createdCommentId;
let createdNotificationId;
let createdAnnouncementId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();

  const ait = await College.findOne({ collegeCode: 'AIT' });
  const sce = await College.findOne({ collegeCode: 'SCE' });

  c1LeaderUser = await User.findOne({ email: 'student.rahul@ait.edu' });
  c1AdminUser = await User.findOne({ email: 'admin@ait.edu' });
  c2StudentUser = await User.findOne({ email: 'student.emily@sce.edu' });

  // Create member student in AIT
  c1MemberUser = await User.create({
    name: 'Priya Sharma',
    email: 'student.priya@ait.edu',
    passwordHash: seedData.superAdmin.passwordHash,
    collegeId: ait._id,
    globalRole: 'STUDENT',
    rollNumber: 'AIT-CSE-002',
    isEmailVerified: true,
    isActive: true
  });

  // Logins
  const lRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.rahul@ait.edu',
    password: 'Password@123'
  });
  c1LeaderToken = lRes.body.data.accessToken;

  const mRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.priya@ait.edu',
    password: 'Password@123'
  });
  c1MemberToken = mRes.body.data.accessToken;

  const aRes = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@ait.edu',
    password: 'Password@123'
  });
  c1AdminToken = aRes.body.data.accessToken;

  const c2Res = await request(app).post('/api/v1/auth/login').send({
    email: 'student.emily@sce.edu',
    password: 'Password@123'
  });
  c2StudentToken = c2Res.body.data.accessToken;

  // Create project under AIT with leader rahul
  const pRes = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${c1LeaderToken}`)
    .send({
      title: 'Decentralized Campus Voting System',
      abstract: 'Blockchain voting for student council',
      description: 'Zero knowledge cryptographic ballots',
      domain: 'Blockchain & Security',
      techStack: ['Solidity', 'React', 'Node.js'],
      startDate: new Date(),
      deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000)
    });

  createdProjectId = pRes.body.data.project._id;

  // Add priya as active team member
  await TeamMember.create({
    collegeId: ait._id,
    teamId: pRes.body.data.project.teamId,
    projectId: createdProjectId,
    userId: c1MemberUser._id,
    projectRole: 'MEMBER',
    status: 'ACTIVE'
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Sprint 8: Discussions, Comments & System Notifications Integration Tests', () => {
  test('1. should post a comment with mentions and generate notifications', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/comments`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .send({
        entityType: 'DISCUSSION',
        body: 'Hey @student.priya@ait.edu please check the updated smart contract specifications.',
        mentions: [c1MemberUser._id]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.comment).toBeDefined();
    expect(res.body.data.comment.body).toContain('smart contract');
    expect(res.body.data.comment.author.name).toBe('Rahul Verma');
    expect(res.body.data.comment.mentions).toHaveLength(1);

    createdCommentId = res.body.data.comment._id;

    // Check that Priya received a notification
    const notifications = await Notification.find({
      userId: c1MemberUser._id,
      type: 'COMMENT_MENTION'
    });
    expect(notifications.length).toBeGreaterThanOrEqual(1);
    expect(notifications[0].isRead).toBe(false);
    expect(notifications[0].title).toContain('Mentioned');
    createdNotificationId = notifications[0]._id;
  });

  test('2. should list comments for a project discussion and allow threaded replies', async () => {
    // Post reply from Priya
    const replyRes = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/comments`)
      .set('Authorization', `Bearer ${c1MemberToken}`)
      .send({
        entityType: 'DISCUSSION',
        body: 'Got it, reviewing the ballot hashing logic now.',
        parentId: createdCommentId
      });

    expect(replyRes.status).toBe(201);
    expect(replyRes.body.data.comment.parentId).toBe(createdCommentId.toString());

    // Fetch comments list
    const listRes = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/comments?entityType=DISCUSSION`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(listRes.body.data.comments.length).toBeGreaterThanOrEqual(2);
  });

  test('3. should block non-author member from deleting another member comment', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${createdProjectId}/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${c1MemberToken}`); // priya trying to delete rahul's comment

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('4. should allow author or leader to delete comment', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${createdProjectId}/comments/${createdCommentId}`)
      .set('Authorization', `Bearer ${c1LeaderToken}`); // rahul (leader and author)

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('5. should fetch user notifications with unread count and pagination', async () => {
    const res = await request(app)
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${c1MemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notifications.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.unreadCount).toBeGreaterThanOrEqual(1);
  });

  test('6. should mark notification as read', async () => {
    const res = await request(app)
      .patch(`/api/v1/notifications/${createdNotificationId}/read`)
      .set('Authorization', `Bearer ${c1MemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notification.isRead).toBe(true);
  });

  test('7. should mark all notifications as read', async () => {
    // Create another notification for test
    await Notification.create({
      collegeId: c1MemberUser.collegeId,
      userId: c1MemberUser._id,
      type: 'GENERAL',
      title: 'System Notice',
      message: 'Scheduled maintenance this Sunday'
    });

    const res = await request(app)
      .patch('/api/v1/notifications/read-all')
      .set('Authorization', `Bearer ${c1MemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.unreadCount).toBe(0);
  });

  test('8. should allow College Admin to broadcast college announcement', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${c1AdminToken}`)
      .send({
        title: 'Final Project Submission Guidelines 2026',
        body: 'All project teams must submit final reports and code by December 15th.',
        pinned: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.announcement.pinned).toBe(true);
    expect(res.body.data.announcement.projectId).toBeNull();

    createdAnnouncementId = res.body.data.announcement._id;
  });

  test('9. should block non-admin student from posting college-wide announcement', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${c1MemberToken}`)
      .send({
        title: 'Unauthorized announcement',
        body: 'This should fail'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('10. should allow project leader to post project-specific announcement', async () => {
    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .send({
        title: 'Team Sprint Planning Meeting',
        body: 'We will meet on Friday 4 PM to finalize Sprint 2 goals.',
        projectId: createdProjectId,
        pinned: true
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.announcement.projectId).toBe(createdProjectId.toString());
  });

  test('11. should list announcements with pinned announcements first', async () => {
    const res = await request(app)
      .get(`/api/v1/announcements?projectId=${createdProjectId}`)
      .set('Authorization', `Bearer ${c1MemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.announcements.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.announcements[0].pinned).toBe(true);
  });

  test('12. should enforce multi-tenant isolation: SCE student cannot view AIT project comments', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/comments`)
      .set('Authorization', `Bearer ${c2StudentToken}`);

    expect(res.status).toBe(404);
  });
});

