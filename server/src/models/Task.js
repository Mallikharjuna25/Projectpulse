import mongoose from 'mongoose';

const acceptanceCriteriaSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    isCompleted: { type: Boolean, default: false }
  },
  { _id: true }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'],
      required: true
    },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const attachmentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    size: { type: Number, default: 0 },
    uploadedAt: { type: Date, default: Date.now }
  },
  { _id: true }
);

const taskSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    taskCode: {
      type: String,
      required: true,
      trim: true,
      uppercase: true
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [150, 'Title cannot exceed 150 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    acceptanceCriteria: {
      type: [acceptanceCriteriaSchema],
      default: []
    },
    priority: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
      default: 'MEDIUM'
    },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED'],
      default: 'TODO',
      index: true
    },
    assignees: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
      }
    ],
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Milestone',
      default: null,
      index: true
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      default: null
    },
    completedAt: {
      type: Date,
      default: null
    },
    order: {
      type: Number,
      default: 0
    },
    attachments: {
      type: [attachmentSchema],
      default: []
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: []
    },
    githubLinks: [
      {
        type: { type: String, enum: ['COMMIT', 'PULL_REQUEST', 'ISSUE'] },
        url: { type: String },
        title: { type: String }
      }
    ]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for overdue detection
taskSchema.virtual('isOverdue').get(function () {
  if (this.status === 'COMPLETED' || !this.dueDate) return false;
  return new Date() > new Date(this.dueDate);
});

// Compound Indexes for fast querying
taskSchema.index({ projectId: 1, taskCode: 1 }, { unique: true });
taskSchema.index({ collegeId: 1, projectId: 1 });
taskSchema.index({ projectId: 1, status: 1, order: 1 });
taskSchema.index({ assignees: 1, dueDate: 1 });

export const Task = mongoose.model('Task', taskSchema);

