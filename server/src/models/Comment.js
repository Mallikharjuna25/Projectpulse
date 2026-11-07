import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required for multi-tenant isolation'],
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },
    entityType: {
      type: String,
      enum: ['TASK', 'PROJECT', 'DISCUSSION', 'ANNOUNCEMENT'],
      default: 'DISCUSSION',
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: [true, 'Entity ID is required'],
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user ID is required']
    },
    body: {
      type: String,
      required: [true, 'Comment content cannot be empty'],
      trim: true,
      maxlength: [3000, 'Comment cannot exceed 3000 characters']
    },
    mentions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
      default: null,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for fast comment retrieval and tenant protection
commentSchema.index({ collegeId: 1, projectId: 1 });
commentSchema.index({ entityType: 1, entityId: 1, createdAt: 1 });

export const Comment = mongoose.model('Comment', commentSchema);

