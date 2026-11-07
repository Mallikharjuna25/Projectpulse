import mongoose from 'mongoose';

const announcementSchema = new mongoose.Schema(
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
      default: null,
      index: true // null indicates college-wide announcement
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Author user ID is required']
    },
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    body: {
      type: String,
      required: [true, 'Announcement body is required'],
      trim: true
    },
    pinned: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

announcementSchema.index({ collegeId: 1, projectId: 1, createdAt: -1 });
announcementSchema.index({ collegeId: 1, pinned: -1, createdAt: -1 });

export const Announcement = mongoose.model('Announcement', announcementSchema);

