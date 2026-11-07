import request from 'supertest';
import mongoose from 'mongoose';
import crypto from 'crypto';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/index.js';
import { College } from '../src/models/College.js';
import { User } from '../src/models/User.js';
import { Project } from '../src/models/Project.js';
import { Task } from '../src/models/Task.js';
import { TeamMember } from '../src/models/TeamMember.js';
import { GithubIntegration } from '../src/integrations/github/models/GithubIntegration.js';
import { GithubEvent } from '../src/integrations/github/models/GithubEvent.js';

let app;
let mongoServer;
let seedData;
let c1LeaderToken;
let c2StudentToken;
let c1LeaderUser;
let c2StudentUser;
let createdProjectId;
let createdTaskId;
const sharedSecret = 'test_webhook_secret_key_12345';

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();

  const ait = await College.findOne({ collegeCode: 'AIT' });
  const sce = await College.findOne({ collegeCode: 'SCE' });

  c1LeaderUser = await User.findOne({ email: 'student.rahul@ait.edu' });
  c2StudentUser = await User.findOne({ email: 'student.emily@sce.edu' });

  // Logins
  const lRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.rahul@ait.edu',
    password: 'Password@123'
  });
  c1LeaderToken = lRes.body.data.accessToken;

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
      title: 'Decentralized Identity Verification',
      abstract: 'Self sovereign identity protocol',
      description: 'Zero knowledge cryptographic proof system',
      domain: 'Cybersecurity',
      techStack: ['Rust', 'Node.js', 'React'],
      startDate: new Date(),
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });

  createdProjectId = pRes.body.data.project._id;

  // Create a task TASK-001 in this project
  const tRes = await request(app)
    .post(`/api/v1/projects/${createdProjectId}/tasks`)
    .set('Authorization', `Bearer ${c1LeaderToken}`)
    .send({
      title: 'Design JWT authentication and zero-knowledge claim schemas',
      priority: 'HIGH',
      status: 'IN_PROGRESS'
    });

    createdTaskId = tRes.body.data._id;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Sprint 9: Phase 2 GitHub Integration Tests', () => {
  test('1. should connect a GitHub repository to the project', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/github/connect`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .send({
        repoFullName: 'projectpulse-team/zk-identity-service',
        webhookSecret: sharedSecret
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.integration.status).toBe('CONNECTED');
    expect(res.body.data.integration.repoFullName).toBe('projectpulse-team/zk-identity-service');
  });

  test('2. should reject connecting repository with invalid format', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/github/connect`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .send({
        repoFullName: 'invalid-repo-without-slash'
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('3. should retrieve GitHub integration status and stats', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/github/status`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.integration.status).toBe('CONNECTED');
    expect(res.body.data.integration.repoFullName).toBe('projectpulse-team/zk-identity-service');
  });

  test('4. should process push webhook and auto-complete task matching "fixes TASK-001"', async () => {
    const payload = {
      eventType: 'push',
      ref: 'refs/heads/main',
      commits: [
        {
          id: 'a1b2c3d4e5f6',
          message: 'feat: implement claim signing and fixes TASK-001',
          url: 'https://github.com/projectpulse-team/zk-identity-service/commit/a1b2c3d',
          author: {
            name: 'Rahul Verma',
            username: 'rahulverma'
          },
          added: ['src/zkp.js'],
          modified: []
        }
      ]
    };

    // Calculate valid HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', sharedSecret);
    const signature = `sha256=${hmac.update(JSON.stringify(payload)).digest('hex')}`;

    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/github/webhook`)
      .set('x-github-event', 'push')
      .set('x-hub-signature-256', signature)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.processedEventsCount).toBe(1);

    // Verify task TASK-001 status transitioned to COMPLETED and has githubLinks entry
    const updatedTask = await Task.findById(createdTaskId);
    expect(updatedTask.status).toBe('COMPLETED');
    expect(updatedTask.githubLinks.length).toBeGreaterThanOrEqual(1);
    expect(updatedTask.githubLinks[0].type).toBe('COMMIT');

    // Verify project progress updated
    const updatedProject = await Project.findById(createdProjectId);
    expect(updatedProject.progress).toBe(100);
  });

  test('5. should reject webhook if HMAC-SHA256 signature is invalid', async () => {
    const payload = { eventType: 'push' };

    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/github/webhook`)
      .set('x-github-event', 'push')
      .set('x-hub-signature-256', 'sha256=invalid_tampered_signature_hex')
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('6. should process pull_request webhook event', async () => {
    const prPayload = {
      eventType: 'pull_request',
      action: 'opened',
      pull_request: {
        number: 42,
        title: 'Add zero-knowledge verification benchmarks',
        html_url: 'https://github.com/projectpulse-team/zk-identity-service/pull/42',
        state: 'open',
        user: { login: 'zk-researcher' }
      }
    };

    const hmac = crypto.createHmac('sha256', sharedSecret);
    const signature = `sha256=${hmac.update(JSON.stringify(prPayload)).digest('hex')}`;

    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/github/webhook`)
      .set('x-github-event', 'pull_request')
      .set('x-hub-signature-256', signature)
      .send(prPayload);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('7. should list project GitHub events', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/github/events`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.events.length).toBeGreaterThanOrEqual(2);
  });

  test('8. should allow simulated push for live demo presentation', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/github/simulate-webhook`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .send({
        message: 'docs: update architecture diagrams and README.md',
        branch: 'develop'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  test('9. should disconnect GitHub repository from project', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${createdProjectId}/github/disconnect`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const checkRes = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/github/status`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(checkRes.body.data.integration.status).toBe('DISCONNECTED');
  });

  test('10. should enforce multi-tenant isolation: SCE student receives 404', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/github/status`)
      .set('Authorization', `Bearer ${c2StudentToken}`);

    expect(res.status).toBe(404);
  });
});
