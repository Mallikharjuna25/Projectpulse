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
import { Milestone } from '../src/models/Milestone.js';
import { Task } from '../src/models/Task.js';
import { DeadlineJob } from '../src/jobs/deadlineJob.js';

let app;
let mongoServer;
let seedData;
let c1LeaderToken;
let c1Student2Token;
let c2StudentToken;
let c1LeaderUser;
let c1Student2User;
let createdProjectId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();

  const ait = await College.findOne({ collegeCode: 'AIT' });
  c1LeaderUser = await User.findOne({ email: 'student.rahul@ait.edu' });

  // Create second student in AIT as team member
  c1Student2User = await User.create({
    name: 'Priya Sharma',
    email: 'student.priya@ait.edu',
    passwordHash: seedData.superAdmin.passwordHash,
    collegeId: ait._id,
    globalRole: 'STUDENT',
    rollNumber: 'AIT-CSE-002',
    isEmailVerified: true,
    isActive: true
  });

  // Login tokens
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

  const sceRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.emily@sce.edu',
    password: 'Password@123'
  });
  c2StudentToken = sceRes.body.data.accessToken;

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

describe('Sprint 5: Milestones, Calendar & Deadline Tracking Integration Tests', () => {
  let milestone1Id;
  const initialDueDate = new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString();

  describe('1. Milestone Creation & RBAC', () => {
    it('should create milestone with deliverables when requested by Leader', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/milestones`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          title: 'Sensor Calibration & Hardware Assembly',
          description: 'Assembly of flight controller, IMU, and camera telemetry modules.',
          deliverables: [
            'Assembled quadcopter frame',
            'Sensor calibration logs',
            'Telemetry link established'
          ],
          dueDate: initialDueDate,
          status: 'PENDING'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Sensor Calibration & Hardware Assembly');
      expect(res.body.data.deliverables.length).toBe(3);
      expect(res.body.data.status).toBe('PENDING');
      milestone1Id = res.body.data._id;
    });

    it('should block non-leader from creating a milestone', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/milestones`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({
          title: 'Unauthorized Milestone',
          dueDate: initialDueDate
        });

      expect(res.status).toBe(403);
    });
  });

  describe('2. Dynamic Completion Percentage Calculation', () => {
    it('should calculate milestone completion percent from linked tasks', async () => {
      // Create 2 tasks linked to milestone: 1 COMPLETED, 1 TODO
      const ait = await College.findOne({ collegeCode: 'AIT' });

      await Task.create({
        collegeId: ait._id,
        projectId: createdProjectId,
        milestoneId: milestone1Id,
        taskCode: 'TASK-010',
        title: 'Calibrate Accelerometer',
        status: 'COMPLETED'
      });

      await Task.create({
        collegeId: ait._id,
        projectId: createdProjectId,
        milestoneId: milestone1Id,
        taskCode: 'TASK-011',
        title: 'Mount Camera Telemetry',
        status: 'TODO'
      });

      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/milestones`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.milestones.length).toBe(1);

      const ms = res.body.data.milestones[0];
      expect(ms.totalTasks).toBe(2);
      expect(ms.completedTasks).toBe(1);
      expect(ms.completionPercent).toBe(50);
    });
  });

  describe('3. Deadline Modification Audit Trail', () => {
    it('should reject modifying milestone target deadline without an audit reason', async () => {
      const extendedDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .patch(`/api/v1/projects/${createdProjectId}/milestones/${milestone1Id}`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          dueDate: extendedDate
          // missing deadlineChangeReason
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/reason is required/i);
    });

    it('should record deadline change history when audit reason is provided', async () => {
      const extendedDate = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();
      const res = await request(app)
        .patch(`/api/v1/projects/${createdProjectId}/milestones/${milestone1Id}`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          dueDate: extendedDate,
          deadlineChangeReason: 'Delayed flight controller shipment from supplier'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.deadlineHistory.length).toBe(1);
      expect(res.body.data.deadlineHistory[0].reason).toBe(
        'Delayed flight controller shipment from supplier'
      );
      expect(res.body.data.deadlineHistory[0].changedBy).toBe(c1LeaderUser._id.toString());
    });
  });

  describe('4. Automated Overdue Inspection Job', () => {
    it('should mark past due milestones as DELAYED', async () => {
      const ait = await College.findOne({ collegeCode: 'AIT' });
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);

      const pastMilestone = await Milestone.create({
        collegeId: ait._id,
        projectId: createdProjectId,
        title: 'Initial Architecture Review',
        dueDate: yesterday,
        status: 'PENDING'
      });

      const auditResult = await DeadlineJob.checkDeadlines();
      expect(auditResult.overdueMilestonesCount).toBeGreaterThanOrEqual(1);

      const updatedMs = await Milestone.findById(pastMilestone._id);
      expect(updatedMs.status).toBe('DELAYED');
    });
  });

  describe('5. Calendar Events Aggregation', () => {
    it('should return project deadlines, milestones, and task due dates formatted for FullCalendar', async () => {
      const res = await request(app)
        .get('/api/v1/calendar/events')
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const events = res.body.data.events;
      expect(events.length).toBeGreaterThanOrEqual(2);

      const projectEvents = events.filter((e) => e.extendedProps.type === 'PROJECT');
      const milestoneEvents = events.filter((e) => e.extendedProps.type === 'MILESTONE');

      expect(projectEvents.length).toBeGreaterThanOrEqual(1);
      expect(milestoneEvents.length).toBeGreaterThanOrEqual(1);

      // Verify FullCalendar schema
      expect(milestoneEvents[0].id).toMatch(/^ms_/);
      expect(milestoneEvents[0].start).toBeDefined();
      expect(milestoneEvents[0].allDay).toBe(true);
      expect(milestoneEvents[0].backgroundColor).toBe('#7c3aed');
    });
  });

  describe('6. Multi-Tenant Isolation', () => {
    it('should return 404 when student from SCE attempts to view AIT milestones', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/milestones`)
        .set('Authorization', `Bearer ${c2StudentToken}`);

      expect(res.status).toBe(404);
    });
  });
});

