import mongoose from 'mongoose';

const facultyRequestSchema = new mongoose.Schema(
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
    facultyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    source: {
      type: String,
      enum: ['STUDENT_REQUEST', 'ADMIN_ASSIGNMENT'],
      default: 'STUDENT_REQUEST'
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'REASSIGN_REQUESTED'],
      default: 'PENDING',
      index: true
    },
    message: {
      type: String,
      trim: true,
      default: ''
    },
    responseNote: {
      type: String,
      trim: true,
      default: ''
    },
    respondedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Indexes
facultyRequestSchema.index({ collegeId: 1, facultyId: 1, status: 1 });
facultyRequestSchema.index({ projectId: 1, createdAt: -1 });

export const FacultyRequest = mongoose.model('FacultyRequest', facultyRequestSchema);

