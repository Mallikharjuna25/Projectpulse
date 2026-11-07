import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/index.js';
import { College } from '../src/models/College.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Team } from '../src/models/Team.js';
import { TeamMember } from '../src/models/TeamMember.js';
import { FacultyRequest } from '../src/models/FacultyRequest.js';

let app;
let mongoServer;
let seedData;
let c1AdminToken;
let c1FacultyToken;
let c1LeaderToken;
let c1Student2Token;
let c2FacultyToken;
let c1FacultyUser;
let createdProjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();

  const ait = await College.findOne({ collegeCode: 'AIT' });
  const c1LeaderUser = await User.findOne({ email: 'student.rahul@ait.edu' });
  c1FacultyUser = await User.findOne({ email: 'faculty.sharma@ait.edu' });

  // Create second student in AIT as team member
  const c1Student2User = await User.create({
    name: 'Priya Sharma',
    email: 'student.priya@ait.edu',
    passwordHash: seedData.superAdmin.passwordHash,
    collegeId: ait._id,
    globalRole: 'STUDENT',
    rollNumber: 'AIT-CSE-002',
    isEmailVerified: true,
    isActive: true
  });

  // Log in tokens
  const aRes = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@ait.edu',
    password: 'Password@123'
  });
  c1AdminToken = aRes.body.data.accessToken;

  const fRes = await request(app).post('/api/v1/auth/login').send({
    email: 'faculty.sharma@ait.edu',
    password: 'Password@123'
  });
  c1FacultyToken = fRes.body.data.accessToken;

  const lRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.rahul@ait.edu',
    password: 'Password@123'
  });
  c1LeaderToken = lRes.body.data.accessToken;

  const s2Res = await request(app).post('/api/v1/auth/login').send({
    email: 'student.priya@ait.edu',
    password: 'Password@123'
  });
  c1Student2Token = s2Res.body.data.accessToken;

  const c2fRes = await request(app).post('/api/v1/auth/login').send({
    email: 'faculty.johnson@sce.edu',
    password: 'Password@123'
  });
  c2FacultyToken = c2fRes.body.data.accessToken;

  // Create Project & Team
  const project = await Project.create({
    projectCode: 'AIT-2026-001',
    collegeId: ait._id,
    title: 'Autonomous Drone Navigation System',
    abstract: 'Vision-guided drone navigation',
    deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
    createdBy: c1LeaderUser._id,
    status: 'ACTIVE'
  });
  createdProjectId = project._id.toString();

  const team = await Team.create({
    collegeId: ait._id,
    projectId: project._id,
    name: 'Drone Team',
    joinCode: 'DRONE1',
    createdBy: c1LeaderUser._id
  });

  project.teamId = team._id;
  await project.save();

  await TeamMember.create({
    collegeId: ait._id,
    teamId: team._id,
    projectId: project._id,
    userId: c1LeaderUser._id,
    projectRole: 'LEADER',
    status: 'ACTIVE'
  });

  await TeamMember.create({
    collegeId: ait._id,
    teamId: team._id,
    projectId: project._id,
    userId: c1Student2User._id,
    projectRole: 'MEMBER',
    status: 'ACTIVE'
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

describe('Sprint 6: Faculty Supervision & Progress Updates Integration Tests', () => {
  let createdRequestId;

  describe('1. Student Requests Faculty Guide', () => {
    it('should allow Project Leader to request faculty supervision', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/supervision/request`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          facultyId: c1FacultyUser._id.toString(),
          message: 'Dr. Sharma, we would be honored if you would guide our AI Drone project.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
      expect(res.body.data.facultyId).toBe(c1FacultyUser._id.toString());
      createdRequestId = res.body.data._id;
    });

    it('should block non-leader team member from requesting faculty', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/supervision/request`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({
          facultyId: c1FacultyUser._id.toString()
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Faculty Response & Assignment', () => {
    it('should list pending requests in faculty dashboard queue', async () => {
      const res = await request(app)
        .get('/api/v1/faculty/requests?status=PENDING')
        .set('Authorization', `Bearer ${c1FacultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.requests.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.requests[0]._id).toBe(createdRequestId);
    });

    it('should allow faculty to accept the supervision request and link guide to project', async () => {
      const res = await request(app)
        .post(`/api/v1/faculty/requests/${createdRequestId}/respond`)
        .set('Authorization', `Bearer ${c1FacultyToken}`)
        .send({
          decision: 'ACCEPTED',
          responseNote: 'Excited to mentor this autonomous systems project.'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('ACCEPTED');

      // Verify Project now has Dr. Sharma as facultyGuideId
      const project = await Project.findById(createdProjectId);
      expect(project.facultyGuideId.toString()).toBe(c1FacultyUser._id.toString());
    });
  });

  describe('3. Progress Updates & Standup Meeting Notes', () => {
    it('should allow team members to post weekly progress updates with blockers', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/supervision/progress-updates`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({
          type: 'WEEKLY',
          content: 'Completed sensor calibration. IMU noise filter implemented in C++.',
          blockers: 'Optical flow camera lens adapter is backordered.',
          nextSteps: 'Implement altitude hold control loop in simulator.',
          weekNumber: 3
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.weekNumber).toBe(3);
      expect(res.body.data.blockers).toMatch(/backordered/i);
    });

    it('should list all progress updates for the project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/supervision/progress-updates`)
        .set('Authorization', `Bearer ${c1LeaderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.updates.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('4. Faculty Feedback & Review', () => {
    it('should allow faculty guide to submit review feedback with approval decision', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/supervision/feedback`)
        .set('Authorization', `Bearer ${c1FacultyToken}`)
        .send({
          entityType: 'PROJECT',
          comment: 'Great progress on sensor calibration. Proceed with simulator validation.',
          decision: 'APPROVED'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.decision).toBe('APPROVED');
      expect(res.body.data.authorId.name).toMatch(/Sharma/i);
    });

    it('should list all feedback entries for the project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/supervision/feedback`)
        .set('Authorization', `Bearer ${c1LeaderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.feedback.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.feedback[0].decision).toBe('APPROVED');
    });
  });

  describe('5. Faculty Dashboard Stats Endpoint', () => {
    it('should return aggregated faculty supervision statistics', async () => {
      const res = await request(app)
        .get('/api/v1/faculty/stats')
        .set('Authorization', `Bearer ${c1FacultyToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.supervisedCount).toBeGreaterThanOrEqual(1);
      expect(res.body.data.capacity).toBeDefined();
    });
  });

  describe('6. Tenant Isolation', () => {
    it('should return 404 when faculty from SCE attempts to respond to AIT request', async () => {
      const res = await request(app)
        .post(`/api/v1/faculty/requests/${createdRequestId}/respond`)
        .set('Authorization', `Bearer ${c2FacultyToken}`)
        .send({ decision: 'ACCEPTED' });

      expect(res.status).toBe(404);
    });
  });

  describe('7. Faculty Directory Lookup for Students', () => {
    it('should allow student to fetch active faculty list of their college', async () => {
      const res = await request(app)
        .get('/api/v1/users/faculty')
        .set('Authorization', `Bearer ${c1LeaderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.users).toBeInstanceOf(Array);
      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.users[0].globalRole).toBe('FACULTY');
    });
  });
});

