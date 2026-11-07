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
import { Document } from '../src/models/Document.js';

let app;
let mongoServer;
let seedData;
let c1LeaderToken;
let c1FacultyToken;
let c1MemberToken;
let c2StudentToken;
let c1LeaderUser;
let c1FacultyUser;
let c1MemberUser;
let c2StudentUser;
let createdProjectId;
let createdDocumentId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();

  const ait = await College.findOne({ collegeCode: 'AIT' });
  const sce = await College.findOne({ collegeCode: 'SCE' });

  c1LeaderUser = await User.findOne({ email: 'student.rahul@ait.edu' });
  c1FacultyUser = await User.findOne({ email: 'faculty.sharma@ait.edu' });
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

  // Login tokens
  const lRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.rahul@ait.edu',
    password: 'Password@123'
  });
  c1LeaderToken = lRes.body.data.accessToken;

  const fRes = await request(app).post('/api/v1/auth/login').send({
    email: 'faculty.sharma@ait.edu',
    password: 'Password@123'
  });
  c1FacultyToken = fRes.body.data.accessToken;

  const mRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.priya@ait.edu',
    password: 'Password@123'
  });
  c1MemberToken = mRes.body.data.accessToken;

  const c2Res = await request(app).post('/api/v1/auth/login').send({
    email: 'student.emily@sce.edu',
    password: 'Password@123'
  });
  c2StudentToken = c2Res.body.data.accessToken;

  // Create project under AIT with leader rahul and guide sharma
  const pRes = await request(app)
    .post('/api/v1/projects')
    .set('Authorization', `Bearer ${c1LeaderToken}`)
    .send({
      title: 'Smart Health Monitoring System',
      abstract: 'IoT and React based health monitor',
      description: 'Full stack telemetry dashboard',
      domain: 'Healthcare & IoT',
      techStack: ['Node.js', 'React', 'MongoDB'],
      startDate: new Date(),
      deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    });

  createdProjectId = pRes.body.data.project._id;

  // Add priya as active team member and assign faculty guide sharma
  await TeamMember.create({
    collegeId: ait._id,
    teamId: pRes.body.data.project.teamId,
    projectId: createdProjectId,
    userId: c1MemberUser._id,
    projectRole: 'MEMBER',
    status: 'ACTIVE'
  });

  await Project.findByIdAndUpdate(createdProjectId, {
    facultyGuideId: c1FacultyUser._id
  });
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe('Sprint 7: Document Uploads & Versioning Integration Tests', () => {
  test('1. should allow team member to upload a project document (v1)', async () => {
    const fileBuffer = Buffer.from('%PDF-1.4 Mock PDF Document Content');

    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/documents`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .field('title', 'Project Proposal Specification')
      .field('category', 'PROPOSAL')
      .field('status', 'DRAFT')
      .field('notes', 'Initial draft for review')
      .attach('file', fileBuffer, 'proposal_v1.pdf');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document).toBeDefined();
    expect(res.body.data.document.title).toBe('Project Proposal Specification');
    expect(res.body.data.document.category).toBe('PROPOSAL');
    expect(res.body.data.document.version).toBe(1);
    expect(res.body.data.document.status).toBe('DRAFT');
    expect(res.body.data.document.versions).toHaveLength(1);
    expect(res.body.data.document.versions[0].version).toBe(1);

    createdDocumentId = res.body.data.document._id;
  });

  test('2. should reject upload when no file is attached', async () => {
    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/documents`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .field('title', 'Missing File Document')
      .field('category', 'REPORT');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('3. should list documents and support category filtering', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/documents?category=PROPOSAL`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.documents.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.documents[0].category).toBe('PROPOSAL');
  });

  test('4. should get single document details with version history', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${c1MemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document._id).toBe(createdDocumentId);
    expect(res.body.data.document.versions).toHaveLength(1);
  });

  test('5. should allow uploading a new version (v2) and increment version count', async () => {
    const updatedBuffer = Buffer.from('%PDF-1.4 Mock PDF Document Content - Revised Version');

    const res = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/documents/${createdDocumentId}/versions`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .field('notes', 'Revised architecture diagrams added')
      .field('submitForReview', 'true')
      .attach('file', updatedBuffer, 'proposal_v2.pdf');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document.version).toBe(2);
    expect(res.body.data.document.status).toBe('SUBMITTED');
    expect(res.body.data.document.versions).toHaveLength(2);
    expect(res.body.data.document.versions[1].version).toBe(2);
    expect(res.body.data.document.versions[1].notes).toBe('Revised architecture diagrams added');
  });

  test('6. should block non-faculty / non-admin from approving document', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${createdProjectId}/documents/${createdDocumentId}/status`)
      .set('Authorization', `Bearer ${c1MemberToken}`)
      .send({
        status: 'APPROVED',
        reviewNotes: 'Self approval attempt'
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  test('7. should allow faculty guide to approve document with review notes', async () => {
    const res = await request(app)
      .patch(`/api/v1/projects/${createdProjectId}/documents/${createdDocumentId}/status`)
      .set('Authorization', `Bearer ${c1FacultyToken}`)
      .send({
        status: 'APPROVED',
        reviewNotes: 'Excellent proposal and clear objectives. Approved.'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.document.status).toBe('APPROVED');
    expect(res.body.data.document.reviewNotes).toBe('Excellent proposal and clear objectives. Approved.');
    expect(res.body.data.document.reviewedBy).toBeDefined();
  });

  test('8. should prevent deleting an approved document', async () => {
    const res = await request(app)
      .delete(`/api/v1/projects/${createdProjectId}/documents/${createdDocumentId}`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/approved documents cannot be deleted/i);
  });

  test('9. should allow deleting a draft document', async () => {
    // Create a temporary draft document
    const tempBuffer = Buffer.from('Temp document data');
    const createRes = await request(app)
      .post(`/api/v1/projects/${createdProjectId}/documents`)
      .set('Authorization', `Bearer ${c1LeaderToken}`)
      .field('title', 'Temporary Draft Note')
      .field('category', 'OTHER')
      .field('status', 'DRAFT')
      .attach('file', tempBuffer, 'temp_draft.txt');

    const tempDocId = createRes.body.data.document._id;

    const delRes = await request(app)
      .delete(`/api/v1/projects/${createdProjectId}/documents/${tempDocId}`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(delRes.status).toBe(200);
    expect(delRes.body.success).toBe(true);

    // Verify it is gone
    const fetchRes = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/documents/${tempDocId}`)
      .set('Authorization', `Bearer ${c1LeaderToken}`);

    expect(fetchRes.status).toBe(404);
  });

  test('10. should enforce multi-tenant isolation: College 2 student gets 404', async () => {
    const res = await request(app)
      .get(`/api/v1/projects/${createdProjectId}/documents`)
      .set('Authorization', `Bearer ${c2StudentToken}`);

    expect(res.status).toBe(404);
  });
});
