import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
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
    entityType: {
      type: String,
      enum: ['PROJECT', 'MILESTONE', 'DOCUMENT', 'TASK', 'PROGRESS_UPDATE'],
      default: 'PROJECT'
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    comment: {
      type: String,
      required: [true, 'Feedback comment is required'],
      trim: true
    },
    decision: {
      type: String,
      enum: ['COMMENT', 'APPROVED', 'CHANGES_REQUESTED'],
      default: 'COMMENT'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
feedbackSchema.index({ collegeId: 1, projectId: 1, createdAt: -1 });

export const Feedback = mongoose.model('Feedback', feedbackSchema);

