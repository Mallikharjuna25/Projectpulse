import mongoose from 'mongoose';

const githubEventSchema = new mongoose.Schema(
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
    eventType: {
      type: String,
      enum: ['push', 'pull_request', 'issues', 'ping', 'other'],
      default: 'push',
      required: true
    },
    action: {
      type: String,
      default: ''
    },
    sha: {
      type: String,
      default: ''
    },
    branch: {
      type: String,
      default: ''
    },
    author: {
      name: { type: String, default: '' },
      email: { type: String, default: '' },
      username: { type: String, default: '' },
      avatarUrl: { type: String, default: '' }
    },
    message: {
      type: String,
      default: ''
    },
    files: {
      type: [String],
      default: []
    },
    url: {
      type: String,
      default: ''
    },
    payload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    linkedTasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task'
      }
    ],
    receivedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

githubEventSchema.index({ collegeId: 1, projectId: 1 });
githubEventSchema.index({ projectId: 1, receivedAt: -1 });
githubEventSchema.index({ projectId: 1, eventType: 1 });

export const GithubEvent = mongoose.model('GithubEvent', githubEventSchema);

