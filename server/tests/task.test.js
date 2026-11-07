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
import { Task } from '../src/models/Task.js';

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

  // Login Rahul (Leader)
  const lRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.rahul@ait.edu',
    password: 'Password@123'
  });
  c1LeaderToken = lRes.body.data.accessToken;

  // Login Priya (Member)
  const s2Res = await request(app).post('/api/v1/auth/login').send({
    email: 'student.priya@ait.edu',
    password: 'Password@123'
  });
  c1Student2Token = s2Res.body.data.accessToken;

  // Login Emily (College 2)
  const sceRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.emily@sce.edu',
    password: 'Password@123'
  });
  c2StudentToken = sceRes.body.data.accessToken;

  // Create Project & Team with Rahul as Leader, Priya as Member
  const project = await Project.create({
    projectCode: 'AIT-2026-001',
    collegeId: ait._id,
    title: 'Autonomous Drone Navigation System',
    abstract: 'Vision-guided drone navigation',
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
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

describe('Sprint 4: Tasks, Kanban & Real-Time Sync Integration Tests', () => {
  let task1Id;
  let task2Id;

  describe('1. Task Creation & Code Sequencing', () => {
    it('should create task TASK-001 with acceptance criteria and assignees', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/tasks`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          title: 'Implement Kalman Filter for Sensor Fusion',
          description: 'Fuse IMU and optical flow sensors for altitude stabilization.',
          priority: 'HIGH',
          status: 'TODO',
          assignees: [c1Student2User._id.toString()],
          acceptanceCriteria: [
            { text: 'IMU orientation calibration matrix computed', isCompleted: false },
            { text: 'Optical flow velocity drift within 5%', isCompleted: false }
          ],
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.taskCode).toBe('TASK-001');
      expect(res.body.data.title).toBe('Implement Kalman Filter for Sensor Fusion');
      expect(res.body.data.order).toBe(0);
      expect(res.body.data.assignees.length).toBe(1);
      expect(res.body.data.acceptanceCriteria.length).toBe(2);
      task1Id = res.body.data._id;
    });

    it('should auto-increment task code to TASK-002 for subsequent task', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/tasks`)
        .set('Authorization', `Bearer ${c1LeaderToken}`)
        .send({
          title: 'Design 3D-Printed Motor Mounts',
          priority: 'MEDIUM',
          status: 'TODO',
          assignees: [c1LeaderUser._id.toString()]
        });

      expect(res.status).toBe(201);
      expect(res.body.data.taskCode).toBe('TASK-002');
      expect(res.body.data.order).toBe(1);
      task2Id = res.body.data._id;
    });

    it('should reject non-leader trying to create a task', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/tasks`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({
          title: 'Unauthorized Task Creation'
        });

      expect(res.status).toBe(403);
      expect(res.body.message).toMatch(/requires team leader permissions/i);
    });
  });

  describe('2. Task Listing & Filters', () => {
    it('should list all tasks for the project', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/tasks`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(2);
    });

    it('should filter tasks by assigneeId', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/tasks?assigneeId=${c1Student2User._id.toString()}`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].taskCode).toBe('TASK-001');
    });

    it('should filter tasks by priority', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/tasks?priority=HIGH`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBe(1);
      expect(res.body.data.tasks[0].taskCode).toBe('TASK-001');
    });
  });

  describe('3. Kanban Drag-and-Drop Movement & Status History', () => {
    it('should move task to IN_PROGRESS and append to statusHistory', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${createdProjectId}/tasks/${task1Id}/move`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({
          status: 'IN_PROGRESS',
          order: 0
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.order).toBe(0);

      const history = res.body.data.statusHistory;
      expect(history.length).toBeGreaterThanOrEqual(2);
      expect(history[history.length - 1].status).toBe('IN_PROGRESS');
    });

    it('should move task to COMPLETED and update project progress percentage', async () => {
      const res = await request(app)
        .patch(`/api/v1/projects/${createdProjectId}/tasks/${task1Id}/move`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({
          status: 'COMPLETED',
          order: 0
        });

      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('COMPLETED');
      expect(res.body.data.completedAt).toBeDefined();

      // Verify Project progress is now 50% (1 of 2 tasks completed)
      const project = await Project.findById(createdProjectId);
      expect(project.progress).toBe(50);
    });
  });

  describe('4. Acceptance Criteria Checklist', () => {
    it('should toggle acceptance criteria isCompleted status', async () => {
      const res = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/tasks/${task1Id}/criteria`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({ index: 0 });

      expect(res.status).toBe(200);
      expect(res.body.data.acceptanceCriteria[0].isCompleted).toBe(true);

      // Toggle back
      const res2 = await request(app)
        .post(`/api/v1/projects/${createdProjectId}/tasks/${task1Id}/criteria`)
        .set('Authorization', `Bearer ${c1Student2Token}`)
        .send({ index: 0 });

      expect(res2.status).toBe(200);
      expect(res2.body.data.acceptanceCriteria[0].isCompleted).toBe(false);
    });
  });

  describe('5. Personal Assigned Tasks Endpoint (/tasks/my)', () => {
    it('should return tasks assigned to logged-in student across projects', async () => {
      const res = await request(app)
        .get('/api/v1/tasks/my')
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.tasks.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.tasks[0].taskCode).toBe('TASK-001');
      expect(res.body.data.tasks[0].projectId.projectCode).toBe('AIT-2026-001');
    });
  });

  describe('6. Tenant Isolation & Delete Protection', () => {
    it('should return 404 when student from SCE attempts to view AIT tasks', async () => {
      const res = await request(app)
        .get(`/api/v1/projects/${createdProjectId}/tasks`)
        .set('Authorization', `Bearer ${c2StudentToken}`);

      expect(res.status).toBe(404);
    });

    it('should block non-leader from deleting a task', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${createdProjectId}/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${c1Student2Token}`);

      expect(res.status).toBe(403);
    });

    it('should allow leader to delete task and recalculate project progress', async () => {
      const res = await request(app)
        .delete(`/api/v1/projects/${createdProjectId}/tasks/${task2Id}`)
        .set('Authorization', `Bearer ${c1LeaderToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      // Now only 1 task remains (which is COMPLETED), so progress = 100%
      const project = await Project.findById(createdProjectId);
      expect(project.progress).toBe(100);
    });
  });
});

