import mongoose from 'mongoose';

const deadlineChangeSchema = new mongoose.Schema(
  {
    oldDate: { type: Date, required: true },
    newDate: { type: Date, required: true },
    reason: { type: String, required: true, trim: true },
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    changedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const milestoneSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Milestone title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters']
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    deliverables: {
      type: [String],
      default: []
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    dueDate: {
      type: Date,
      required: [true, 'Milestone target due date is required']
    },
    status: {
      type: String,
      enum: ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'],
      default: 'PENDING',
      index: true
    },
    completionPercent: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    deadlineHistory: {
      type: [deadlineChangeSchema],
      default: []
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes
milestoneSchema.index({ collegeId: 1, projectId: 1 });
milestoneSchema.index({ projectId: 1, status: 1 });

export const Milestone = mongoose.model('Milestone', milestoneSchema);

