import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      minlength: [1, 'Full name cannot be empty'],
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      default: null,
      index: true
    },
    departmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
      index: true
    },
    globalRole: {
      type: String,
      enum: ['SUPER_ADMIN', 'COLLEGE_ADMIN', 'FACULTY', 'STUDENT', 'REVIEWER'],
      default: 'STUDENT',
      index: true
    },
    rollNumber: {
      type: String,
      trim: true,
      uppercase: true,
      default: null
    },
    academicYear: {
      type: String,
      default: null
    },
    section: {
      type: String,
      trim: true,
      default: null
    },
    designation: {
      type: String,
      trim: true,
      default: ''
    },
    maxSupervisionCapacity: {
      type: Number,
      default: 5,
      min: [1, 'Capacity must be at least 1']
    },
    skills: {
      type: [String],
      default: []
    },
    avatar: {
      type: String,
      default: ''
    },
    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    },
    lastLoginAt: {
      type: Date,
      default: null
    },
    failedLoginAttempts: {
      type: Number,
      default: 0
    },
    lockUntil: {
      type: Date,
      default: null
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false
    },
    passwordResetToken: {
      type: String,
      default: null,
      select: false
    },
    passwordResetExpires: {
      type: Date,
      default: null,
      select: false
    },
    emailVerifyToken: {
      type: String,
      default: null,
      select: false
    },
    emailVerifyExpires: {
      type: Date,
      default: null,
      select: false
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
userSchema.index(
  { collegeId: 1, rollNumber: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { rollNumber: { $type: 'string' } }
  }
);
userSchema.index({ collegeId: 1, globalRole: 1 });

/**
 * Compare plain text candidate password with hashed password.
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

export const User = mongoose.model('User', userSchema);

