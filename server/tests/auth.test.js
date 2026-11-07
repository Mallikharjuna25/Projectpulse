import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/index.js';
import { User } from '../src/models/User.js';
import { College } from '../src/models/College.js';

let app;
let mongoServer;
let seedData;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

describe('Sprint 1 – Authentication & Multi-Tenant Authorization Tests', () => {
  describe('1. Public College Discovery', () => {
    it('should return list of active colleges for registration dropdown', async () => {
      const res = await request(app).get('/api/v1/public/colleges');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.colleges)).toBe(true);
      expect(res.body.data.colleges.length).toBeGreaterThanOrEqual(2);
      expect(res.body.data.colleges[0]).toHaveProperty('collegeName');
      expect(res.body.data.colleges[0]).toHaveProperty('collegeCode');
    });
  });

  describe('2. Student Registration Flow', () => {
    it('should register a new student with valid college domain email', async () => {
      const newStudentData = {
        name: 'Aman Gupta',
        email: 'aman.gupta@ait.edu',
        password: 'Password@123',
        collegeId: seedData.college1._id.toString(),
        rollNumber: 'AIT-CSE-099',
        academicYear: '4th',
        section: 'A'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(newStudentData);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(newStudentData.email);
      expect(res.body.data.user.globalRole).toBe('STUDENT');
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('should reject registration if email domain does not match college required domain', async () => {
      const invalidEmailStudent = {
        name: 'John Doe',
        email: 'john.doe@gmail.com', // Not @ait.edu
        password: 'Password@123',
        collegeId: seedData.college1._id.toString(),
        rollNumber: 'AIT-CSE-100',
        academicYear: '4th'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(invalidEmailStudent);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/college domain/i);
    });

    it('should reject registration with duplicate roll number in the same college', async () => {
      const duplicateRollStudent = {
        name: 'Duplicate Roll Student',
        email: 'dup.roll@ait.edu',
        password: 'Password@123',
        collegeId: seedData.college1._id.toString(),
        rollNumber: 'AIT-CSE-001', // Already used by Rahul Verma in seed
        academicYear: '4th'
      };

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send(duplicateRollStudent);

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already registered/i);
    });
  });

  describe('3. Login & JWT Session Management', () => {
    it('should log in student and return access token and set refresh cookie', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'student.rahul@ait.edu',
          password: 'Password@123'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data.user.email).toBe('student.rahul@ait.edu');

      const cookies = res.headers['set-cookie'];
      expect(cookies).toBeDefined();
      const hasRefreshCookie = cookies.some((c) => c.includes('projectpulse_refreshToken'));
      expect(hasRefreshCookie).toBe(true);
    });

    it('should reject login with wrong password without leaking account details', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'student.rahul@ait.edu',
          password: 'WrongPassword@999'
        });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password');
    });

    it('should rotate refresh token and issue new access token on refresh', async () => {
      // First login to get refresh cookie
      const loginRes = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'student.rahul@ait.edu',
          password: 'Password@123'
        });

      const cookies = loginRes.headers['set-cookie'];

      // Call refresh endpoint with cookie
      const refreshRes = await request(app)
        .post('/api/v1/auth/refresh')
        .set('Cookie', cookies);

      expect(refreshRes.status).toBe(200);
      expect(refreshRes.body.success).toBe(true);
      expect(refreshRes.body.data).toHaveProperty('accessToken');

      const rotatedCookies = refreshRes.headers['set-cookie'];
      expect(rotatedCookies).toBeDefined();
    });
  });

  describe('4. RBAC & Tenant Isolation', () => {
    let superAdminToken;
    let college1AdminToken;
    let college2AdminToken;
    let college1StudentToken;

    beforeAll(async () => {
      const saRes = await request(app).post('/api/v1/auth/login').send({
        email: 'superadmin@projectpulse.edu',
        password: 'Password@123'
      });
      superAdminToken = saRes.body.data.accessToken;

      const c1AdminRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@ait.edu',
        password: 'Password@123'
      });
      college1AdminToken = c1AdminRes.body.data.accessToken;

      const c2AdminRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@sce.edu',
        password: 'Password@123'
      });
      college2AdminToken = c2AdminRes.body.data.accessToken;

      const c1StudentRes = await request(app).post('/api/v1/auth/login').send({
        email: 'student.rahul@ait.edu',
        password: 'Password@123'
      });
      college1StudentToken = c1StudentRes.body.data.accessToken;
    });

    it('should allow Super Admin to access colleges list', async () => {
      const res = await request(app)
        .get('/api/v1/colleges')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.colleges.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject Student accessing Super Admin college endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/colleges')
        .set('Authorization', `Bearer ${college1StudentToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Forbidden/i);
    });

    it('should reject College Admin accessing Super Admin college endpoints with 403 Forbidden', async () => {
      const res = await request(app)
        .get('/api/v1/colleges')
        .set('Authorization', `Bearer ${college1AdminToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should block logins when college is SUSPENDED', async () => {
      // Suspend College 2 (Stanford College of Engineering)
      await College.findByIdAndUpdate(seedData.college2._id, { status: 'SUSPENDED' });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'student.emily@sce.edu',
          password: 'Password@123'
        });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/suspended/i);

      // Restore College 2
      await College.findByIdAndUpdate(seedData.college2._id, { status: 'ACTIVE' });
    });

    it('should return 401 when requesting protected /me without token', async () => {
      const res = await request(app).get('/api/v1/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should return authenticated user profile on /me with populated college', async () => {
      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${college1StudentToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.name).toBe('Rahul Verma');
      expect(res.body.data.user.collegeId.collegeCode).toBe('AIT');
    });
  });
});

