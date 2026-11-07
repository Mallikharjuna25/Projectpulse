import mongoose from 'mongoose';

const invitationSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: true,
      index: true
    },
    type: {
      type: String,
      enum: ['EMAIL_INVITE', 'JOIN_CODE_REQUEST'],
      required: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
      index: true
    },
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      required: true
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      default: null
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    token: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    status: {
      type: String,
      enum: ['PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED'],
      default: 'PENDING',
      index: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    responseNote: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

export const Invitation = mongoose.model('Invitation', invitationSchema);

