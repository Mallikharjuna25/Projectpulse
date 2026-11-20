import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { createApp } from '../src/app.js';
import { seedDatabase } from '../src/seed/index.js';
import { College } from '../src/models/College.js';
import { Department } from '../src/models/Department.js';
import { User } from '../src/models/User.js';

let app;
let mongoServer;
let seedData;
let superAdminToken;
let c1AdminToken;
let c2AdminToken;
let c1StudentToken;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp();
  seedData = await seedDatabase();

  // Log in test roles to acquire JWT tokens
  const saRes = await request(app).post('/api/v1/auth/login').send({
    email: 'superadmin@projectpulse.edu',
    password: 'Password@123'
  });
  superAdminToken = saRes.body.data.accessToken;

  const c1Res = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@ait.edu',
    password: 'Password@123'
  });
  c1AdminToken = c1Res.body.data.accessToken;

  const c2Res = await request(app).post('/api/v1/auth/login').send({
    email: 'admin@sce.edu',
    password: 'Password@123'
  });
  c2AdminToken = c2Res.body.data.accessToken;

  const stRes = await request(app).post('/api/v1/auth/login').send({
    email: 'student.rahul@ait.edu',
    password: 'Password@123'
  });
  c1StudentToken = stRes.body.data.accessToken;
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
}, 30000);

describe('Sprint 2 – College, Department & User Management Tests', () => {
  describe('1. Super Admin College Onboarding & Governance', () => {
    it('should allow Super Admin to onboard a new college along with initial College Admin', async () => {
      const payload = {
        collegeName: 'National Institute of Robotics',
        collegeCode: 'NIR',
        emailDomain: 'nir.edu',
        address: '100 Innovation Way',
        adminName: 'Prof. Alok Verma',
        adminEmail: 'admin@nir.edu'
      };

      const res = await request(app)
        .post('/api/v1/colleges')
        .set('Authorization', `Bearer ${superAdminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.college.collegeCode).toBe('NIR');
      expect(res.body.data.admin.email).toBe('admin@nir.edu');

      // Verify the newly created College Admin can log in with default credentials
      const loginRes = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@nir.edu',
        password: 'Password@123'
      });
      expect(loginRes.status).toBe(200);
      expect(loginRes.body.data.user.globalRole).toBe('COLLEGE_ADMIN');
    });

    it('should return platform-wide statistics for Super Admin', async () => {
      const res = await request(app)
        .get('/api/v1/super-admin/stats')
        .set('Authorization', `Bearer ${superAdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalColleges).toBeGreaterThanOrEqual(2);
      expect(res.body.data.stats.totalUsers).toBeGreaterThanOrEqual(5);
    });
  });

  describe('2. College Admin Department Management', () => {
    let createdDeptId;

    it('should allow College Admin to create a new department in their college', async () => {
      const res = await request(app)
        .post('/api/v1/admin/departments')
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({
          name: 'Artificial Intelligence & Machine Learning',
          code: 'AIML',
          hodName: 'Dr. Vikram Seth'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.department.code).toBe('AIML');
      createdDeptId = res.body.data.department._id;
    });

    it('should reject creating a department with duplicate code in same college', async () => {
      const res = await request(app)
        .post('/api/v1/admin/departments')
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({
          name: 'Another AIML Dept',
          code: 'AIML'
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/already exists/i);
    });

    it('should list departments with aggregated user counts', async () => {
      const res = await request(app)
        .get('/api/v1/admin/departments')
        .set('Authorization', `Bearer ${c1AdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.departments)).toBe(true);
      const cse = res.body.data.departments.find((d) => d.code === 'CSE');
      expect(cse).toBeDefined();
      expect(cse.userCounts.students).toBeGreaterThanOrEqual(1);
    });

    it('should prevent deleting a department if active users are assigned to it', async () => {
      // Find CSE department which has student Rahul
      const departments = await Department.find({ collegeId: seedData.college1._id });
      const cseDept = departments.find((d) => d.code === 'CSE');

      const res = await request(app)
        .delete(`/api/v1/admin/departments/${cseDept._id}`)
        .set('Authorization', `Bearer ${c1AdminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Cannot delete department/i);
    });

    it('should allow deleting an empty department with no assigned users', async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/departments/${createdDeptId}`)
        .set('Authorization', `Bearer ${c1AdminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('3. User Management: Faculty, Students & Bulk CSV Import', () => {
    let testFacultyId;
    let testStudentId;

    it('should create a new faculty guide with designation and supervision capacity', async () => {
      const departments = await Department.find({ collegeId: seedData.college1._id });
      const itDept = departments.find((d) => d.code === 'IT');

      const res = await request(app)
        .post('/api/v1/admin/users/faculty')
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({
          name: 'Prof. Ananya Sen',
          email: 'ananya.sen@ait.edu',
          departmentId: itDept._id.toString(),
          designation: 'Associate Professor',
          maxSupervisionCapacity: 6
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.faculty.globalRole).toBe('FACULTY');
      expect(res.body.data.faculty.maxSupervisionCapacity).toBe(6);
      testFacultyId = res.body.data.faculty._id;
    });

    it('should create a single student from College Admin console', async () => {
      const departments = await Department.find({ collegeId: seedData.college1._id });
      const cseDept = departments.find((d) => d.code === 'CSE');

      const res = await request(app)
        .post('/api/v1/admin/users/students')
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({
          name: 'Karan Mehra',
          email: 'karan.mehra@ait.edu',
          departmentId: cseDept._id.toString(),
          rollNumber: 'AIT-CSE-050',
          academicYear: '4th',
          section: 'B'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.student.rollNumber).toBe('AIT-CSE-050');
      testStudentId = res.body.data.student._id;
    });

    it('should perform bulk student import and report created vs skipped rows', async () => {
      const bulkData = [
        {
          name: 'Bulk Student One',
          email: 'bulk1@ait.edu',
          rollNumber: 'AIT-CSE-081',
          departmentCode: 'CSE',
          academicYear: '4th',
          section: 'A'
        },
        {
          name: 'Bulk Student Two',
          email: 'bulk2@ait.edu',
          rollNumber: 'AIT-IT-082',
          departmentCode: 'IT',
          academicYear: '3rd',
          section: 'B'
        },
        // Duplicate email with row 1
        {
          name: 'Duplicate Email Student',
          email: 'bulk1@ait.edu',
          rollNumber: 'AIT-CSE-083',
          departmentCode: 'CSE'
        },
        // Unknown department code
        {
          name: 'Unknown Dept Student',
          email: 'unknown.dept@ait.edu',
          rollNumber: 'AIT-UNKNOWN-001',
          departmentCode: 'NON_EXISTENT_DEPT'
        }
      ];

      const res = await request(app)
        .post('/api/v1/admin/users/students/bulk-import')
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({ students: bulkData });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.createdCount).toBe(2);
      expect(res.body.data.skippedCount).toBe(2);
      expect(res.body.data.skippedRows.length).toBe(2);
    });

    it('should deactivate a user account and block subsequent logins', async () => {
      // 1. Verify student Karan can initially log in
      const initialLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'karan.mehra@ait.edu',
        password: 'Password@123'
      });
      expect(initialLogin.status).toBe(200);

      // 2. Deactivate Karan
      const deactivateRes = await request(app)
        .patch(`/api/v1/admin/users/${testStudentId}/status`)
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({ isActive: false });

      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.data.isActive).toBe(false);

      // 3. Attempt login with valid password -> must be BLOCKED with 403 Forbidden
      const blockedLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'karan.mehra@ait.edu',
        password: 'Password@123'
      });

      expect(blockedLogin.status).toBe(403);
      expect(blockedLogin.body.success).toBe(false);
      expect(blockedLogin.body.message).toMatch(/deactivated/i);

      // 4. Reactivate user and verify login succeeds again
      await request(app)
        .patch(`/api/v1/admin/users/${testStudentId}/status`)
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({ isActive: true });

      const reactivatedLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'karan.mehra@ait.edu',
        password: 'Password@123'
      });
      expect(reactivatedLogin.status).toBe(200);
    });

    it('should enforce multi-tenant isolation: College 1 Admin cannot manage College 2 users', async () => {
      // Find College 2 student (student.emily@sce.edu)
      const c2Student = await User.findOne({ email: 'student.emily@sce.edu' });

      // College 1 Admin attempts to deactivate College 2 Student
      const res = await request(app)
        .patch(`/api/v1/admin/users/${c2Student._id}/status`)
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({ isActive: false });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/not found in your college/i);
    });
  });

  describe('4. User Self-Service Profile & Password Change', () => {
    it('should allow authenticated user to update their skills and bio', async () => {
      const res = await request(app)
        .patch('/api/v1/auth/me')
        .set('Authorization', `Bearer ${c1StudentToken}`)
        .send({
          bio: 'Passionate about autonomous drones and distributed systems.',
          skills: ['Python', 'ROS2', 'React', 'MongoDB']
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.bio).toBe('Passionate about autonomous drones and distributed systems.');
      expect(res.body.data.user.skills).toContain('ROS2');
    });

    it('should allow student to change their password and log in with new password while old password fails', async () => {
      // 1. Change student password
      const changeRes = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${c1StudentToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'NewSecurePassword@2026'
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);
      expect(changeRes.body.message).toMatch(/password changed successfully/i);

      // 2. Old password must fail
      const oldLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'student.rahul@ait.edu',
        password: 'Password@123'
      });
      expect(oldLogin.status).toBe(401);
      expect(oldLogin.body.success).toBe(false);

      // 3. New password must succeed
      const newLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'student.rahul@ait.edu',
        password: 'NewSecurePassword@2026'
      });
      expect(newLogin.status).toBe(200);
      expect(newLogin.body.success).toBe(true);

      // Restore password back to Password@123
      await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${newLogin.body.data.accessToken}`)
        .send({
          currentPassword: 'NewSecurePassword@2026',
          newPassword: 'Password@123'
        });
    }, 20000);

    it('should allow faculty to change their password and log in with new password while old password fails', async () => {
      // 1. Faculty logs in first
      const facLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'faculty.sharma@ait.edu',
        password: 'Password@123'
      });
      expect(facLogin.status).toBe(200);
      const facToken = facLogin.body.data.accessToken;

      // 2. Change faculty password
      const changeRes = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${facToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'FacultyNewSecure@2026'
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // 3. Old password must immediately fail
      const oldLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'faculty.sharma@ait.edu',
        password: 'Password@123'
      });
      expect(oldLogin.status).toBe(401);

      // 4. New password must succeed
      const newLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'faculty.sharma@ait.edu',
        password: 'FacultyNewSecure@2026'
      });
      expect(newLogin.status).toBe(200);

      // Restore password back to Password@123
      await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${newLogin.body.data.accessToken}`)
        .send({
          currentPassword: 'FacultyNewSecure@2026',
          newPassword: 'Password@123'
        });
    }, 20000);

    it('should allow college admin to change their password and log in with new password while old password fails', async () => {
      // 1. College Admin changes password
      const changeRes = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${c1AdminToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'AdminNewSecure@2026'
        });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.success).toBe(true);

      // 2. Old password must fail
      const oldLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@ait.edu',
        password: 'Password@123'
      });
      expect(oldLogin.status).toBe(401);

      // 3. New password must succeed
      const newLogin = await request(app).post('/api/v1/auth/login').send({
        email: 'admin@ait.edu',
        password: 'AdminNewSecure@2026'
      });
      expect(newLogin.status).toBe(200);

      // Restore password back to Password@123
      await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${newLogin.body.data.accessToken}`)
        .send({
          currentPassword: 'AdminNewSecure@2026',
          newPassword: 'Password@123'
        });
    }, 20000);

    it('should reject password change when current password is incorrect', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${c1StudentToken}`)
        .send({
          currentPassword: 'WrongPassword@999',
          newPassword: 'ValidNewPassword@2026'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/current password is incorrect/i);
    });

    it('should reject password change when new password is weak or invalid', async () => {
      const res = await request(app)
        .post('/api/v1/users/change-password')
        .set('Authorization', `Bearer ${c1StudentToken}`)
        .send({
          currentPassword: 'Password@123',
          newPassword: 'weak'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });
});

