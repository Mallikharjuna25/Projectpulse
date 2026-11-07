import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    projectRole: {
      type: String,
      enum: ['LEADER', 'MEMBER'],
      default: 'MEMBER',
      index: true
    },
    responsibility: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['INVITED', 'ACTIVE', 'REMOVED'],
      default: 'ACTIVE',
      index: true
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Unique compound index: a user can only have one active membership per project
teamMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });

export const TeamMember = mongoose.model('TeamMember', teamMemberSchema);

