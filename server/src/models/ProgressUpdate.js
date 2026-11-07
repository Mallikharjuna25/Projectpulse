import mongoose from 'mongoose';

const progressUpdateSchema = new mongoose.Schema(
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
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    type: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'MEETING_NOTE'],
      default: 'WEEKLY'
    },
    content: {
      type: String,
      required: [true, 'Update content is required'],
      trim: true
    },
    blockers: {
      type: String,
      trim: true,
      default: ''
    },
    nextSteps: {
      type: String,
      trim: true,
      default: ''
    },
    weekNumber: {
      type: Number,
      min: 1,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

// Indexes
progressUpdateSchema.index({ collegeId: 1, projectId: 1, createdAt: -1 });

export const ProgressUpdate = mongoose.model('ProgressUpdate', progressUpdateSchema);

