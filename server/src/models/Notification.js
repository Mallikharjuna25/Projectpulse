import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required for multi-tenant isolation'],
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Target User ID is required'],
      index: true
    },
    type: {
      type: String,
      enum: [
        'TASK_ASSIGNED',
        'TASK_STATUS',
        'MILESTONE_DUE',
        'DOCUMENT_REVIEW',
        'FACULTY_REQUEST',
        'COMMENT_MENTION',
        'ANNOUNCEMENT',
        'GENERAL'
      ],
      default: 'GENERAL',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true
    },
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true
    },
    link: {
      type: String,
      default: ''
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for rapid notification polling and unread badge retrieval
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ collegeId: 1, userId: 1 });

export const Notification = mongoose.model('Notification', notificationSchema);

