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
import { Invitation } from '../src/models/Invitation.js';

let app;
let mongoServer;
let seedData;
let c1LeaderToken;
let c1Student2Token;
let c2StudentToken;
let c1CollegeId;
let c2CollegeId;
let c1Student2User;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();

  const ait = await College.findOne({ collegeCode: 'AIT' });
  const sce = await College.findOne({ collegeCode: 'SCE' });
  c1CollegeId = ait._id.toString();
  c2CollegeId = sce._id.toString();

  // Create second student in AIT for team invite & join tests
  c1Student2User = await User.create({
    name: 'Priya Sharma',
    email: 'student.priya@ait.edu',
    passwordHash: seedData.superAdmin.passwordHash,
    collegeId: ait._id,
    globalRole: 'STUDENT',
    rollNumber: 'AIT-CSE-002',
    academicYear: '4th',
    section: 'A',
    isEmailVerified: true,
    isActive: true
  });

  // Login Rahul (Leader)
  const lRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.rahul@ait.edu',
    password: 'Password@123'
  });
  c1LeaderToken = lRes.body.data.accessToken;

  // Login Priya (Second student in AIT)
  const s2Res = await request(app).post('/api/v1/auth/login').send({
    email: 'student.priya@ait.edu',
    password: 'Password@123'
  });
  c1Student2Token = s2Res.body.data.accessToken;

  // Login Emily (Student in SCE / College 2)
  const sceRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.emily@sce.edu',
    password: 'Password@123'
  });
  c2StudentToken = sceRes.body.data.accessToken;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
}, 30000);

describe('Sprint 3: Projects, Teams, and Invitations Integration Tests', () => {
  let createdProjectId;
  let teamJoinCode;

  describe('1. Project Creation & Auto-Code Sequencing', () => {
    it('should create a project, generate AIT-YYYY-001 code, and make creator the LEADER', async () => {
      const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          title: 'Autonomous Drone Navigation System',
          abstract: 'Computer vision based path planning and navigation for quadcopters.',
          domain: 'Robotics & AI',
          techStack: ['Python', 'ROS', 'OpenCV'],
          priority: 'HIGH',
          deadline: futureDate,
          visibility: 'COLLEGE'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.project).toBeDefined();

      const { project, teamMembers } = res.body.data;
      createdProjectId = project._id;
      expect(project.projectCode).toMatch(/^AIT-\d{4}-001$/);
      expect(project.title).toBe('Autonomous Drone Navigation System');
      expect(project.status).toBe('PLANNING');
      expect(project.health).toBe('ON_TRACK');

      // Verify team and leader membership
      expect(teamMembers.length).toBe(1);
      expect(teamMembers[0].projectRole).toBe('LEADER');
      expect(project.teamId.joinCode).toBeDefined();
      teamJoinCode = project.teamId.joinCode;
    });

    it('should increment project code for subsequent project in same college', async () => {
      const futureDate = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .post('/api/v1/projects')
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          title: 'Decentralized Healthcare Ledger',
          abstract: 'Blockchain EHR management platform.',
          domain: 'Blockchain',
          techStack: ['Solidity', 'Ethereum', 'React'],
          deadline: futureDate
        });

      expect(res.status).toBe(201);
      expect(res.body.data.project.projectCode).toMatch(/^AIT-\d{4}-002$/);
    });
  });

  describe('2. Project Overview & Read Access', () => {
    it('should retrieve project overview with populated team and health metrics', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${c1LeaderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.project._id).toBe(createdProjectId);
      expect(res.body.data.daysRemaining).toBeGreaterThan(0);
      expect(res.body.data.currentUserRole).toBe('LEADER');
    });

    it('should list projects for the logged in student', async () => {
      const res = await request(app)
        .get('/api/v1/projects')
        .set('Authorization', `Bearer ${c1LeaderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.projects.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.projects[0].userProjectRole).toBe('LEADER');
    });
  });

  describe('3. Team Join Code & Approval Workflow', () => {
    let requestId;

    it('should allow student in same college to request join via valid join code', async () => {
      const res = await request(app)
        .post('/api/v1/projects/join-by-code')
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({ joinCode: teamJoinCode });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.invitationId).toBeDefined();
      requestId = res.body.data.invitationId;
    });

    it('should reject duplicate join request while first request is pending', async () => {
      const res = await request(app)
        .post('/api/v1/projects/join-by-code')
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({ joinCode: teamJoinCode });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already have a pending join request/i);
    });

    it('should reject non-leader trying to accept or reject the join request', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/join-requests/${requestId}/respond`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({ decision: 'ACCEPTED' });

      expect(res.status).toBe(403);
    });

    it('should allow leader to accept join request and enroll user as active MEMBER', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/join-requests/${requestId}/respond`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({ decision: 'ACCEPTED' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Priya is now active MEMBER
      const overviewRes = await request(app)
        .get(`/api/v1/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${c1LeaderToken}`);

      const priyaMember = overviewRes.body.data.teamMembers.find(
        (m) => m.userId.email === 'student.priya@ait.edu'
      );
      expect(priyaMember).toBeDefined();
      expect(priyaMember.projectRole).toBe('MEMBER');
    });
  });

  describe('4. Email Invitations Workflow', () => {
    it('should allow leader to send email invitation', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/invitations`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          email: 'newpeer@ait.edu',
          responsibility: 'Frontend Engineer'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.email).toBe('newpeer@ait.edu');
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.status).toBe('PENDING');
    });

    it('should reject inviting someone who is already an active member', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/invitations`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          email: 'student.priya@ait.edu',
          responsibility: 'Frontend Engineer'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already an active member/i);
    });
  });

  describe('5. Multi-Tenant Isolation Enforcement', () => {
    it('should return 404 when student from SCE tries to join AIT project with valid joinCode', async () => {
      const res = await request(app)
        .post('/api/v1/projects/join-by-code')
        .set('Authorization', `Bearer ${c2StudentToken}`)
        .send({ joinCode: teamJoinCode });

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found in your college/i);
    });

    it('should return 404 when student from SCE tries to access AIT project directly', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${c2StudentToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toMatch(/not found/i);
    });
  });

  describe('6. Leadership Transfer & Member Removal', () => {
    it('should allow current leader to transfer leadership to an active member', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/transfer-leadership`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({ newLeaderUserId: c1Student2User._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      // Verify Priya is now LEADER and Rahul is demoted to MEMBER
      const overviewRes = await request(app)
        .get(`/api/v1/projects/${createdProjectId}`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(overviewRes.body.data.currentUserRole).toBe('LEADER');

      const rahulMember = overviewRes.body.data.teamMembers.find(
        (m) => m.userId.email === 'student.rahul@ait.edu'
      );
      expect(rahulMember.projectRole).toBe('MEMBER');
    });

    it('should prevent removing the only leader in the project', async () => {
      const priyaMemberRecord = await TeamMember.findOne({
        projectId: createdProjectId,
        userId: c1Student2User._id
      });

      const res = await request(app)
        .delete(`/api/v1/projects/${createdProjectId}/members/${priyaMemberRecord._id}`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/cannot remove the only project leader/i);
    });

    it('should allow new leader to regenerate the team join code', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/regenerate-code`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.joinCode).toBeDefined();
      expect(res.body.data.joinCode).not.toBe(teamJoinCode);
    });
  });
});

