import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, disconnectDB } from '../config/db.js';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

export const seedDatabase = async () => {
  try {
    logger.info('--- Seeding ProjectPulse Database ---');
    await connectDB();

    // Clear existing collections
    await User.deleteMany({});
    await Department.deleteMany({});
    await College.deleteMany({});

    const defaultPassword = 'Password@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    // 1. Create Super Admin
    const superAdmin = await User.create({
      name: 'Platform Super Admin',
      email: 'superadmin@projectpulse.edu',
      passwordHash,
      globalRole: 'SUPER_ADMIN',
      isEmailVerified: true,
      isActive: true
    });
    logger.info(`Created Super Admin: ${superAdmin.email}`);

    // 2. Create College 1: Apex Institute of Technology (AIT)
    const college1 = await College.create({
      collegeName: 'Apex Institute of Technology',
      collegeCode: 'AIT',
      emailDomain: 'ait.edu',
      address: '12 Tech Park Avenue, Silicon Valley',
      status: 'ACTIVE'
    });

    const c1Dept1 = await Department.create({
      collegeId: college1._id,
      name: 'Computer Science & Engineering',
      code: 'CSE',
      hodName: 'Dr. Ramesh Kumar'
    });

    const c1Dept2 = await Department.create({
      collegeId: college1._id,
      name: 'Information Technology',
      code: 'IT',
      hodName: 'Dr. Anita Roy'
    });

    const c1Admin = await User.create({
      name: 'AIT Admin',
      email: 'admin@ait.edu',
      passwordHash,
      collegeId: college1._id,
      departmentId: c1Dept1._id,
      globalRole: 'COLLEGE_ADMIN',
      isEmailVerified: true,
      isActive: true
    });

    const c1Faculty = await User.create({
      name: 'Dr. Rajesh Sharma',
      email: 'faculty.sharma@ait.edu',
      passwordHash,
      collegeId: college1._id,
      departmentId: c1Dept1._id,
      globalRole: 'FACULTY',
      isEmailVerified: true,
      isActive: true
    });

    const c1Student = await User.create({
      name: 'Rahul Verma',
      email: 'student.rahul@ait.edu',
      passwordHash,
      collegeId: college1._id,
      departmentId: c1Dept1._id,
      globalRole: 'STUDENT',
      rollNumber: 'AIT-CSE-001',
      academicYear: '4th',
      section: 'A',
      skills: ['React', 'Node.js', 'MongoDB', 'Docker'],
      isEmailVerified: true,
      isActive: true
    });

    const c1Reviewer = await User.create({
      name: 'Dr. Meera Patel',
      email: 'reviewer.meera@ait.edu',
      passwordHash,
      collegeId: college1._id,
      departmentId: c1Dept1._id,
      globalRole: 'REVIEWER',
      isEmailVerified: true,
      isActive: true
    });

    logger.info(`Seeded College 1: ${college1.collegeName} with Admin, Faculty, Reviewer, and Student`);

    // 3. Create College 2: Stanford College of Engineering (SCE)
    const college2 = await College.create({
      collegeName: 'Stanford College of Engineering',
      collegeCode: 'SCE',
      emailDomain: 'sce.edu',
      address: '450 Serra Mall, Stanford, CA',
      status: 'ACTIVE'
    });

    const c2Dept1 = await Department.create({
      collegeId: college2._id,
      name: 'Software Engineering',
      code: 'SE',
      hodName: 'Dr. Sarah Connor'
    });

    const c2Dept2 = await Department.create({
      collegeId: college2._id,
      name: 'Data Science',
      code: 'DS',
      hodName: 'Dr. Bruce Wayne'
    });

    const c2Admin = await User.create({
      name: 'SCE Admin',
      email: 'admin@sce.edu',
      passwordHash,
      collegeId: college2._id,
      departmentId: c2Dept1._id,
      globalRole: 'COLLEGE_ADMIN',
      isEmailVerified: true,
      isActive: true
    });

    const c2Faculty = await User.create({
      name: 'Prof. David Johnson',
      email: 'faculty.johnson@sce.edu',
      passwordHash,
      collegeId: college2._id,
      departmentId: c2Dept1._id,
      globalRole: 'FACULTY',
      isEmailVerified: true,
      isActive: true
    });

    const c2Student = await User.create({
      name: 'Emily Davis',
      email: 'student.emily@sce.edu',
      passwordHash,
      collegeId: college2._id,
      departmentId: c2Dept1._id,
      globalRole: 'STUDENT',
      rollNumber: 'SCE-SE-001',
      academicYear: '3rd',
      section: 'B',
      skills: ['Python', 'Express', 'Tailwind', 'PostgreSQL'],
      isEmailVerified: true,
      isActive: true
    });

    const c2Reviewer = await User.create({
      name: 'Dr. Robert Lang',
      email: 'reviewer.robert@sce.edu',
      passwordHash,
      collegeId: college2._id,
      departmentId: c2Dept1._id,
      globalRole: 'REVIEWER',
      isEmailVerified: true,
      isActive: true
    });

    logger.info(`Seeded College 2: ${college2.collegeName} with Admin, Faculty, Reviewer, and Student`);

    console.log('\n======================================================');
    console.log('       PROJECTPULSE SEED CREDENTIALS SUMMARY');
    console.log('======================================================');
    console.log('Common Password for all accounts: Password@123\n');
    console.log('1. Super Admin:');
    console.log('   - Email: superadmin@projectpulse.edu');
    console.log('\n2. College 1: Apex Institute of Technology (AIT)');
    console.log('   - College Admin: admin@ait.edu');
    console.log('   - Faculty Guide: faculty.sharma@ait.edu');
    console.log('   - External Reviewer: reviewer.meera@ait.edu');
    console.log('   - Student Leader: student.rahul@ait.edu (Roll: AIT-CSE-001)');
    console.log('\n3. College 2: Stanford College of Engineering (SCE)');
    console.log('   - College Admin: admin@sce.edu');
    console.log('   - Faculty Guide: faculty.johnson@sce.edu');
    console.log('   - External Reviewer: reviewer.robert@sce.edu');
    console.log('   - Student Member: student.emily@sce.edu (Roll: SCE-SE-001)');
    console.log('======================================================\n');

    return {
      superAdmin,
      college1,
      college2,
      c1Admin,
      c2Admin,
      c1Faculty,
      c2Faculty,
      c1Reviewer,
      c2Reviewer,
      c1Student,
      c2Student
    };
  } catch (err) {
    logger.error('Error seeding database:', err);
    throw err;
  }
};

// Auto-run if executed directly
if (process.argv[1]?.endsWith('index.js') || process.argv[1]?.includes('seed')) {
  seedDatabase()
    .then(async () => {
      logger.info('Database seeding completed successfully.');
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error('Seeding process failed.', err);
      await disconnectDB();
      process.exit(1);
    });
}

