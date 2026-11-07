import mongoose from 'mongoose';

const changeHistorySchema = new mongoose.Schema(
  {
    field: { type: String, required: true },
    oldValue: { type: mongoose.Schema.Types.Mixed },
    newValue: { type: mongoose.Schema.Types.Mixed },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now },
    reason: { type: String, default: '' }
  },
  { _id: false }
);

const projectSchema = new mongoose.Schema(
  {
    projectCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
      index: true
    },
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [5, 'Title must be at least 5 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    abstract: {
      type: String,
      maxlength: [500, 'Abstract cannot exceed 500 characters'],
      default: ''
    },
    description: {
      type: String,
      default: ''
    },
    objectives: {
      type: [String],
      default: []
    },
    domain: {
      type: String,
      trim: true,
      default: 'General'
    },
    techStack: {
      type: [String],
      default: []
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null
    },
    facultyGuideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'],
      default: 'PLANNING',
      index: true
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    deadline: {
      type: Date,
      required: [true, 'Project deadline is required']
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    health: {
      type: String,
      enum: ['ON_TRACK', 'AT_RISK', 'DELAYED', 'INACTIVE'],
      default: 'ON_TRACK',
      index: true
    },
    visibility: {
      type: String,
      enum: ['PRIVATE', 'COLLEGE'],
      default: 'COLLEGE'
    },
    lastActivityAt: {
      type: Date,
      default: Date.now
    },
    changeHistory: {
      type: [changeHistorySchema],
      default: []
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for high-frequency queries
projectSchema.index({ collegeId: 1, status: 1 });
projectSchema.index({ collegeId: 1, isDeleted: 1, createdAt: -1 });

export const Project = mongoose.model('Project', projectSchema);

