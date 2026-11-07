import bcrypt from 'bcryptjs';
import { College } from '../models/College.js';
import { User } from '../models/User.js';
import { Department } from '../models/Department.js';
import { Project } from '../models/Project.js';
import { generateOpaqueToken } from '../utils/token.js';
import { logger } from '../utils/logger.js';

export class SuperAdminService {
  /**
   * List all colleges with enriched user count statistics.
   */
  static async listCollegesWithStats() {
    const colleges = await College.find().sort({ createdAt: -1 });

    const userStats = await User.aggregate([
      { $match: { collegeId: { $ne: null } } },
      {
        $group: {
          _id: '$collegeId',
          totalUsers: { $sum: 1 },
          students: {
            $sum: { $cond: [{ $eq: ['$globalRole', 'STUDENT'] }, 1, 0] }
          },
          faculty: {
            $sum: { $cond: [{ $eq: ['$globalRole', 'FACULTY'] }, 1, 0] }
          },
          admins: {
            $sum: { $cond: [{ $eq: ['$globalRole', 'COLLEGE_ADMIN'] }, 1, 0] }
          }
        }
      }
    ]);

    const statsMap = {};
    userStats.forEach((s) => {
      statsMap[s._id.toString()] = s;
    });

    return colleges.map((c) => ({
      ...c.toObject(),
      stats: statsMap[c._id.toString()] || {
        totalUsers: 0,
        students: 0,
        faculty: 0,
        admins: 0
      }
    }));
  }

  /**
   * Create new College and its initial College Admin.
   */
  static async createCollegeWithAdmin(collegeData, adminData) {
    const collegeName = (collegeData.collegeName || '').trim();
    const collegeCode = (collegeData.collegeCode || '').trim().toUpperCase();
    const address = (collegeData.address || '').trim();
    const logo = (collegeData.logo || '').trim();
    const adminName = (adminData.adminName || '').trim();
    const adminEmail = (adminData.adminEmail || '').trim().toLowerCase();

    let emailDomain = null;
    if (collegeData.emailDomain && collegeData.emailDomain.trim()) {
      emailDomain = collegeData.emailDomain.trim().toLowerCase().replace(/^@/, '');
    }

    if (!collegeName) {
      const err = new Error('College name is required');
      err.statusCode = 400;
      throw err;
    }

    if (!collegeCode) {
      const err = new Error('College code is required');
      err.statusCode = 400;
      throw err;
    }

    if (!adminName) {
      const err = new Error('Initial administrator name is required');
      err.statusCode = 400;
      throw err;
    }

    if (!adminEmail || !adminEmail.includes('@')) {
      const err = new Error('A valid administrator email address is required');
      err.statusCode = 400;
      throw err;
    }

    // Check collegeCode uniqueness
    const existingCode = await College.findOne({ collegeCode });
    if (existingCode) {
      const err = new Error(`College code "${collegeCode}" is already in use`);
      err.statusCode = 409;
      throw err;
    }

    const existingName = await College.findOne({ collegeName });
    if (existingName) {
      const err = new Error(`College with name "${collegeName}" already exists`);
      err.statusCode = 409;
      throw err;
    }

    // Check adminEmail uniqueness across entire platform
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
      const err = new Error(`An account with email "${adminEmail}" already exists`);
      err.statusCode = 409;
      throw err;
    }

    // Create college
    const college = await College.create({
      collegeName,
      collegeCode,
      emailDomain,
      address,
      logo,
      status: 'ACTIVE'
    });

    // Create initial admin
    const defaultPassword = 'Password@123';
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    const { rawToken, hashedToken, expiresAt } = generateOpaqueToken(48 * 60 * 60 * 1000); // 48h

    const admin = await User.create({
      name: adminName,
      email: adminEmail,
      passwordHash,
      collegeId: college._id,
      globalRole: 'COLLEGE_ADMIN',
      isEmailVerified: true,
      isActive: true,
      passwordResetToken: hashedToken,
      passwordResetExpires: expiresAt
    });

    logger.info(`[COLLEGE ONBOARDED] ${college.collegeName} (${college.collegeCode}). Initial Admin: ${admin.email}`);

    return {
      college,
      admin: {
        _id: admin._id,
        name: admin.name,
        email: admin.email,
        globalRole: admin.globalRole,
        initialPasswordLinkToken: rawToken
      }
    };
  }

  /**
   * Platform-wide totals and health overview.
   */
  static async getPlatformStats() {
    const [
      totalColleges,
      activeColleges,
      totalUsers,
      totalStudents,
      totalFaculty,
      totalProjects
    ] = await Promise.all([
      College.countDocuments(),
      College.countDocuments({ status: 'ACTIVE' }),
      User.countDocuments(),
      User.countDocuments({ globalRole: 'STUDENT' }),
      User.countDocuments({ globalRole: 'FACULTY' }),
      Project.countDocuments({ isDeleted: false })
    ]);

    return {
      totalColleges,
      activeColleges,
      totalUsers,
      totalStudents,
      totalFaculty,
      totalProjects
    };
  }
}

