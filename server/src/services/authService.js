import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { College } from '../models/College.js';
import { Department } from '../models/Department.js';
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  generateOpaqueToken
} from '../utils/token.js';
import { logger } from '../utils/logger.js';

export class AuthService {
  /**
   * Register a new Student.
   */
  static async registerStudent(data) {
    const {
      name,
      email,
      password,
      collegeId,
      departmentId,
      rollNumber,
      academicYear,
      section
    } = data;

    // 1. Verify College existence and active status
    const college = await College.findById(collegeId);
    if (!college) {
      const err = new Error('Selected college not found');
      err.statusCode = 404;
      throw err;
    }

    if (college.status === 'SUSPENDED') {
      const err = new Error('Registrations for this college are currently suspended');
      err.statusCode = 403;
      throw err;
    }

    // 2. Enforce email domain if specified by the college
    if (college.emailDomain) {
      const requiredDomain = college.emailDomain.toLowerCase();
      const emailDomain = email.split('@')[1]?.toLowerCase();
      if (emailDomain !== requiredDomain) {
        const err = new Error(`Email must belong to the college domain: @${college.emailDomain}`);
        err.statusCode = 400;
        throw err;
      }
    }

    // 3. Check for existing email across all users
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const err = new Error('An account with this email address already exists');
      err.statusCode = 409;
      throw err;
    }

    // 4. Check roll number uniqueness within this college
    if (rollNumber) {
      const existingRoll = await User.findOne({
        collegeId,
        rollNumber: rollNumber.toUpperCase()
      });
      if (existingRoll) {
        const err = new Error(`Roll number ${rollNumber} is already registered in this college`);
        err.statusCode = 409;
        throw err;
      }
    }

    // 5. Verify department belongs to this college
    if (departmentId) {
      const department = await Department.findOne({ _id: departmentId, collegeId });
      if (!department) {
        const err = new Error('Selected department does not belong to this college');
        err.statusCode = 400;
        throw err;
      }
    }

    // 6. Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // 7. Generate email verification token
    const { rawToken, hashedToken, expiresAt } = generateOpaqueToken(24 * 60 * 60 * 1000); // 24 hours

    // 8. Create user
    const newUser = new User({
      name,
      email,
      passwordHash,
      collegeId,
      departmentId: departmentId || null,
      globalRole: 'STUDENT',
      rollNumber: rollNumber ? rollNumber.toUpperCase() : null,
      academicYear: academicYear || null,
      section: section || null,
      isEmailVerified: false,
      isActive: true,
      emailVerifyToken: hashedToken,
      emailVerifyExpires: expiresAt
    });

    await newUser.save();

    // Log verification link (in production this would be sent via Nodemailer)
    logger.info(`[EMAIL SIMULATION] Verification email sent to ${email}. Verification token: ${rawToken}`);

    // Return sanitized user object
    const userJson = newUser.toObject();
    delete userJson.passwordHash;
    delete userJson.emailVerifyToken;
    delete userJson.emailVerifyExpires;

    return {
      user: userJson,
      verificationToken: rawToken // returned in dev/demo for easy testing
    };
  }

  /**
   * User login with brute-force protection, college status check, and refresh token issuance.
   */
  static async login(email, password, rememberMe = false) {
    const user = await User.findOne({ email }).select(
      '+passwordHash +refreshTokenHash'
    );

    // 1. Generic 401 to prevent email enumeration
    if (!user) {
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // 2. Check brute-force lock
    if (user.lockUntil && user.lockUntil > Date.now()) {
      const waitMinutes = Math.ceil((user.lockUntil - Date.now()) / (60 * 1000));
      const err = new Error(`Account temporarily locked due to consecutive failed attempts. Try again in ${waitMinutes} minute(s).`);
      err.statusCode = 429;
      throw err;
    }

    // 3. Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
      }
      await user.save();
      const err = new Error('Invalid email or password');
      err.statusCode = 401;
      throw err;
    }

    // 4. Check account active status
    if (!user.isActive) {
      const err = new Error('Account has been deactivated. Please contact your college administrator.');
      err.statusCode = 403;
      throw err;
    }

    // 5. Check college status (if not Super Admin)
    if (user.globalRole !== 'SUPER_ADMIN' && user.collegeId) {
      const college = await College.findById(user.collegeId);
      if (!college || college.status === 'SUSPENDED') {
        const err = new Error('Your college access has been suspended.');
        err.statusCode = 403;
        throw err;
      }
    }

    // 6. Reset failed login attempts on successful login
    user.failedLoginAttempts = 0;
    user.lockUntil = null;
    user.lastLoginAt = new Date();

    // 7. Generate tokens
    const accessToken = generateAccessToken({
      userId: user._id,
      collegeId: user.collegeId,
      globalRole: user.globalRole
    });

    const refreshToken = generateRefreshToken();
    user.refreshTokenHash = hashToken(refreshToken);
    await user.save();

    // 8. Sanitize user data
    const userJson = user.toObject();
    delete userJson.passwordHash;
    delete userJson.refreshTokenHash;

    return {
      user: userJson,
      accessToken,
      refreshToken
    };
  }

  /**
   * Rotate refresh token and issue a fresh access token.
   */
  static async refreshSession(incomingRefreshToken) {
    if (!incomingRefreshToken) {
      const err = new Error('Refresh token is required');
      err.statusCode = 401;
      throw err;
    }

    const hashedIncoming = hashToken(incomingRefreshToken);
    const user = await User.findOne({ refreshTokenHash: hashedIncoming }).select('+refreshTokenHash');

    if (!user) {
      const err = new Error('Invalid or revoked refresh token');
      err.statusCode = 401;
      throw err;
    }

    if (!user.isActive) {
      const err = new Error('User account is deactivated');
      err.statusCode = 403;
      throw err;
    }

    // Check college status
    if (user.globalRole !== 'SUPER_ADMIN' && user.collegeId) {
      const college = await College.findById(user.collegeId);
      if (!college || college.status === 'SUSPENDED') {
        const err = new Error('College access is suspended');
        err.statusCode = 403;
        throw err;
      }
    }

    // Token rotation: generate fresh pair
    const newAccessToken = generateAccessToken({
      userId: user._id,
      collegeId: user.collegeId,
      globalRole: user.globalRole
    });

    const newRefreshToken = generateRefreshToken();
    user.refreshTokenHash = hashToken(newRefreshToken);
    await user.save();

    const userJson = user.toObject();
    delete userJson.passwordHash;
    delete userJson.refreshTokenHash;

    return {
      user: userJson,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  /**
   * Log out user and revoke refresh token.
   */
  static async logout(userId) {
    if (userId) {
      await User.findByIdAndUpdate(userId, { refreshTokenHash: null });
    }
  }

  /**
   * Verify email address using opaque token.
   */
  static async verifyEmail(token) {
    const hashed = hashToken(token);
    const user = await User.findOne({
      emailVerifyToken: hashed,
      emailVerifyExpires: { $gt: new Date() }
    }).select('+emailVerifyToken +emailVerifyExpires');

    if (!user) {
      const err = new Error('Verification link is invalid or has expired');
      err.statusCode = 400;
      throw err;
    }

    user.isEmailVerified = true;
    user.emailVerifyToken = null;
    user.emailVerifyExpires = null;
    await user.save();

    return { message: 'Email verified successfully. You can now log in.' };
  }

  /**
   * Initiate forgot password flow.
   */
  static async forgotPassword(email) {
    const user = await User.findOne({ email }).select('+passwordResetToken +passwordResetExpires');

    // Never disclose if email exists
    if (!user) {
      return { message: 'If an account with that email exists, password reset instructions have been sent.' };
    }

    const { rawToken, hashedToken, expiresAt } = generateOpaqueToken(30 * 60 * 1000); // 30 minutes
    user.passwordResetToken = hashedToken;
    user.passwordResetExpires = expiresAt;
    await user.save();

    logger.info(`[PASSWORD RESET SIMULATION] Reset link generated for ${email}. Token: ${rawToken}`);

    return {
      message: 'If an account with that email exists, password reset instructions have been sent.',
      resetToken: rawToken // Exposed in dev/demo
    };
  }

  /**
   * Reset password using token.
   */
  static async resetPassword(token, newPassword) {
    const hashed = hashToken(token);
    const user = await User.findOne({
      passwordResetToken: hashed,
      passwordResetExpires: { $gt: new Date() }
    }).select('+passwordResetToken +passwordResetExpires +refreshTokenHash');

    if (!user) {
      const err = new Error('Password reset link is invalid or has expired');
      err.statusCode = 400;
      throw err;
    }

    const salt = await bcrypt.genSalt(12);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    // Invalidate all active sessions across devices
    user.refreshTokenHash = null;
    await user.save();

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  }

  /**
   * Get user profile details populated with college and department.
   */
  static async getMe(userId) {
    const user = await User.findById(userId)
      .populate('collegeId', 'collegeName collegeCode emailDomain logo status')
      .populate('departmentId', 'name code hodName');

    if (!user) {
      const err = new Error('User not found');
      err.statusCode = 404;
      throw err;
    }

    return user;
  }

  /**
   * Update user profile fields (name, bio, skills, avatar).
   */
  static async updateProfile(userId, updateData) {
    const allowed = ['name', 'bio', 'skills', 'avatar'];
    const filtered = {};
    for (const key of allowed) {
      if (updateData[key] !== undefined) {
        filtered[key] = updateData[key];
      }
    }

    const user = await User.findByIdAndUpdate(userId, filtered, { new: true, runValidators: true })
      .populate('collegeId', 'collegeName collegeCode emailDomain logo status')
      .populate('departmentId', 'name code hodName');

    return user;
  }
}

