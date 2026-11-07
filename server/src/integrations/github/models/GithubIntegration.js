import mongoose from 'mongoose';

const githubIntegrationSchema = new mongoose.Schema(
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
      unique: true,
      index: true
    },
    repoFullName: {
      type: String,
      required: [true, 'Repository full name (e.g. owner/repo) is required'],
      trim: true
    },
    repoUrl: {
      type: String,
      trim: true
    },
    installationId: {
      type: String,
      default: ''
    },
    accessTokenEncrypted: {
      type: String,
      default: ''
    },
    webhookSecret: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['CONNECTED', 'DISCONNECTED', 'FAILED'],
      default: 'CONNECTED'
    },
    connectedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    connectedAt: {
      type: Date,
      default: Date.now
    },
    lastSyncAt: {
      type: Date,
      default: null
    },
    stats: {
      commitsCount: { type: Number, default: 0 },
      pullRequestsCount: { type: Number, default: 0 },
      linkedTasksCount: { type: Number, default: 0 }
    }
  },
  {
    timestamps: true
  }
);

githubIntegrationSchema.index({ collegeId: 1, projectId: 1 });

export const GithubIntegration = mongoose.model(
  'GithubIntegration',
  githubIntegrationSchema
);

