import mongoose from 'mongoose';

const versionItemSchema = new mongoose.Schema(
  {
    version: {
      type: Number,
      required: true
    },
    fileUrl: {
      type: String,
      required: true
    },
    fileName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    notes: {
      type: String,
      default: ''
    }
  },
  { _id: true }
);

const documentSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['PROPOSAL', 'REQUIREMENTS', 'DESIGN', 'REPORT', 'PRESENTATION', 'FINAL_SUBMISSION', 'OTHER'],
      default: 'OTHER',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Document title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    fileName: {
      type: String,
      required: true
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required']
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    version: {
      type: Number,
      default: 1
    },
    versions: [versionItemSchema],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    status: {
      type: String,
      enum: ['DRAFT', 'SUBMITTED', 'APPROVED', 'CHANGES_REQUESTED'],
      default: 'DRAFT'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reviewedAt: {
      type: Date,
      default: null
    },
    reviewNotes: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound indexes for rapid lookup and tenant isolation
documentSchema.index({ collegeId: 1, projectId: 1 });
documentSchema.index({ projectId: 1, category: 1 });
documentSchema.index({ projectId: 1, status: 1 });

export const Document = mongoose.model('Document', documentSchema);

