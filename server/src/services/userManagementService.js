import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import { Project } from '../models/Project.js';
import { generateOpaqueToken } from '../utils/token.js';
import { logger } from '../utils/logger.js';

export class UserManagementService {
  /**
   * List users in the college with filtering and pagination.
   */
  static async listUsers(collegeId, options = {}) {
    const {
      role,
      departmentId,
      isActive,
      search,
      page = 1,
      limit = 20
    } = options;

    const query = { collegeId };

    if (role) {
      query.globalRole = role;
    }

    if (departmentId) {
      query.departmentId = departmentId;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true' || isActive === true;
    }

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { rollNumber: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [users, total] = await Promise.all([
      User.find(query)
        .populate('departmentId', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        total,
        page: parseInt(page, 10),
        limit: take,
        pages: Math.ceil(total / take)
      }
    };
  }

  /**
   * Create / Invite a Faculty Guide.
   */
  static async createFaculty(collegeId, data) {
    const { name, email, departmentId, designation, maxSupervisionCapacity } = data;

    const college = await College.findById(collegeId);
    if (!college) throw new Error('College not found');

    if (college.emailDomain) {
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (emailDomain !== college.emailDomain.toLowerCase()) {
        const err = new Error(`Email must belong to college domain: @${college.emailDomain}`);
        err.statusCode = 400;
        throw err;
      }
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    const department = await Department.findOne({ _id: departmentId, collegeId });
    if (!department) {
      const err = new Error('Selected department does not exist in this college');
      err.statusCode = 400;
      throw err;
    }

    // Default password for invited faculty
    const defaultPassword = 'Password@123';
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const faculty = await User.create({
      name,
      email,
      passwordHash,
      collegeId,
      departmentId,
      globalRole: 'FACULTY',
      designation: designation || 'Assistant Professor',
      maxSupervisionCapacity: maxSupervisionCapacity || 5,
      isEmailVerified: true,
      isActive: true
    });

    const sanitized = faculty.toObject();
    delete sanitized.passwordHash;
    return sanitized;
  }

  /**
   * Create a Project Reviewer.
   */
  static async createReviewer(collegeId, data) {
    const { name, email, departmentId, designation } = data;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    const defaultPassword = 'Password@123';
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const reviewer = await User.create({
      name,
      email,
      passwordHash,
      collegeId,
      departmentId: departmentId || null,
      globalRole: 'REVIEWER',
      designation: designation || 'Project Reviewer',
      isEmailVerified: true,
      isActive: true
    });

    const sanitized = reviewer.toObject();
    delete sanitized.passwordHash;
    return sanitized;
  }

  /**
   * Create a single Student from College Admin console.
   */
  static async createStudent(collegeId, data) {
    const { name, email, departmentId, rollNumber, academicYear, section } = data;

    const college = await College.findById(collegeId);
    if (!college) throw new Error('College not found');

    if (college.emailDomain) {
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (emailDomain !== college.emailDomain.toLowerCase()) {
        const err = new Error(`Email must belong to college domain: @${college.emailDomain}`);
        err.statusCode = 400;
        throw err;
      }
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      const err = new Error('An account with this email already exists');
      err.statusCode = 409;
      throw err;
    }

    const existingRoll = await User.findOne({
      collegeId,
      rollNumber: rollNumber.toUpperCase()
    });
    if (existingRoll) {
      const err = new Error(`Roll number "${rollNumber}" is already registered in this college`);
      err.statusCode = 409;
      throw err;
    }

    const department = await Department.findOne({ _id: departmentId, collegeId });
    if (!department) {
      const err = new Error('Department not found in this college');
      err.statusCode = 400;
      throw err;
    }

    const defaultPassword = 'Password@123';
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    const student = await User.create({
      name,
      email,
      passwordHash,
      collegeId,
      departmentId,
      globalRole: 'STUDENT',
      rollNumber: rollNumber.toUpperCase(),
      academicYear: academicYear || '4th',
      section: section || 'A',
      isEmailVerified: true,
      isActive: true
    });

    const sanitized = student.toObject();
    delete sanitized.passwordHash;
    return sanitized;
  }

  /**
   * Bulk import students from parsed CSV data.
   */
  static async bulkImportStudents(collegeId, studentRows) {
    const college = await College.findById(collegeId);
    if (!college) throw new Error('College not found');

    // 1. Fetch all departments in this college for code lookup
    const departments = await Department.find({ collegeId });
    const deptMap = {};
    departments.forEach((d) => {
      deptMap[d.code.toUpperCase()] = d._id;
    });

    // 2. Fetch existing emails and roll numbers in this college to detect duplicates fast
    const existingUsers = await User.find({ collegeId }).select('email rollNumber');
    const existingEmails = new Set(existingUsers.map((u) => u.email.toLowerCase()));
    const existingRolls = new Set(
      existingUsers.map((u) => u.rollNumber?.toUpperCase()).filter(Boolean)
    );

    const validRecords = [];
    const skippedRows = [];
    const batchEmails = new Set();
    const batchRolls = new Set();

    const defaultPassword = 'Password@123';
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);

    for (let i = 0; i < studentRows.length; i++) {
      const row = studentRows[i];
      const rowNum = i + 1;

      const name = row.name?.trim();
      const email = row.email?.trim().toLowerCase();
      const rollNumber = row.rollNumber?.trim().toUpperCase();
      const deptCode = row.departmentCode?.trim().toUpperCase();
      const academicYear = row.academicYear?.trim() || '4th';
      const section = row.section?.trim() || 'A';

      // Basic validations
      if (!name || !email || !rollNumber) {
        skippedRows.push({
          row: rowNum,
          email,
          rollNumber,
          reason: 'Missing required field (name, email, or rollNumber)'
        });
        continue;
      }

      // Check college domain if configured
      if (college.emailDomain) {
        const domain = email.split('@')[1];
        if (domain !== college.emailDomain.toLowerCase()) {
          skippedRows.push({
            row: rowNum,
            email,
            rollNumber,
            reason: `Email domain does not match college required domain: @${college.emailDomain}`
          });
          continue;
        }
      }

      // Check duplicate email
      if (existingEmails.has(email) || batchEmails.has(email)) {
        skippedRows.push({
          row: rowNum,
          email,
          rollNumber,
          reason: 'Email already exists in database or earlier in import file'
        });
        continue;
      }

      // Check duplicate roll number
      if (existingRolls.has(rollNumber) || batchRolls.has(rollNumber)) {
        skippedRows.push({
          row: rowNum,
          email,
          rollNumber,
          reason: `Roll number "${rollNumber}" already exists in college or earlier in import file`
        });
        continue;
      }

      // Check department mapping
      let departmentId = null;
      if (deptCode) {
        departmentId = deptMap[deptCode] || null;
        if (!departmentId) {
          skippedRows.push({
            row: rowNum,
            email,
            rollNumber,
            reason: `Unknown department code "${deptCode}". Department does not exist in college.`
          });
          continue;
        }
      }

      batchEmails.add(email);
      batchRolls.add(rollNumber);

      validRecords.push({
        name,
        email,
        passwordHash,
        collegeId,
        departmentId,
        globalRole: 'STUDENT',
        rollNumber,
        academicYear,
        section,
        isEmailVerified: true,
        isActive: true
      });
    }

    let createdCount = 0;
    if (validRecords.length > 0) {
      const inserted = await User.insertMany(validRecords, { ordered: false });
      createdCount = inserted.length;
    }

    return {
      totalProcessed: studentRows.length,
      createdCount,
      skippedCount: skippedRows.length,
      skippedRows
    };
  }

  /**
   * Activate or Deactivate user account.
   */
  static async toggleUserStatus(collegeId, userId, isActive) {
    const user = await User.findOne({ _id: userId, collegeId });
    if (!user) {
      const err = new Error('User not found in your college');
      err.statusCode = 404;
      throw err;
    }

    if (user.globalRole === 'COLLEGE_ADMIN' || user.globalRole === 'SUPER_ADMIN') {
      const err = new Error('Cannot change status of administrative accounts here');
      err.statusCode = 400;
      throw err;
    }

    user.isActive = isActive;
    // Invalidate refresh tokens if deactivated
    if (!isActive) {
      user.refreshTokenHash = null;
    }
    await user.save();

    return {
      userId: user._id,
      name: user.name,
      isActive: user.isActive,
      message: `User account has been ${isActive ? 'activated' : 'deactivated'}`
    };
  }

  /**
   * Reset user password from Admin console (generates reset token).
   */
  static async adminResetPassword(collegeId, userId) {
    const user = await User.findOne({ _id: userId, collegeId });
    if (!user) {
      const err = new Error('User not found in your college');
      err.statusCode = 404;
      throw err;
    }

    const { rawToken, hashedToken, expiresAt } = generateOpaqueToken(24 * 60 * 60 * 1000);
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    user.refreshTokenHash = null; // revoke sessions
    await user.save();

    logger.info(`[ADMIN PASSWORD RESET] Reset link generated for ${user.email}. Token: ${rawToken}`);

    return {
      message: `Password reset link generated for ${user.email}`,
      resetToken: rawToken
    };
  }

  /**
   * User self password change.
   */
  static async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      const err = new Error('Current password is incorrect');
      err.statusCode = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    // Invalidate all active sessions & reset any brute-force tracking
    user.refreshTokenHash = null;
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    await user.save();

    return { message: 'Password changed successfully' };
  }

  /**
   * Get real-time administrative statistics for college dashboard.
   */
  static async getCollegeStats(collegeId) {
    const [
      studentsCount,
      facultyCount,
      departmentsCount,
      totalProjectsCount,
      noGuideProjects,
      delayedProjectsCount
    ] = await Promise.all([
      User.countDocuments({ collegeId, globalRole: 'STUDENT', isActive: true }),
      User.countDocuments({ collegeId, globalRole: 'FACULTY', isActive: true }),
      Department.countDocuments({ collegeId }),
      Project.countDocuments({ collegeId, isDeleted: false }),
      Project.find({ collegeId, isDeleted: false, facultyGuideId: null })
        .populate('createdBy', 'name email')
        .populate('departmentId', 'name code')
        .sort({ createdAt: -1 })
        .limit(10),
      Project.countDocuments({ collegeId, isDeleted: false, health: 'DELAYED' })
    ]);

    return {
      studentsCount,
      facultyCount,
      departmentsCount,
      totalProjectsCount,
      noGuideCount: noGuideProjects.length,
      delayedCount: delayedProjectsCount,
      unassignedProjects: noGuideProjects
    };
  }
}

