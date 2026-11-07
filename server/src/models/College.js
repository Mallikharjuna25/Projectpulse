import mongoose from 'mongoose';

const collegeSchema = new mongoose.Schema(
  {
    collegeName: {
      type: String,
      required: [true, 'College name is required'],
      trim: true,
      unique: true,
      minlength: [1, 'College name cannot be empty'],
      maxlength: [150, 'College name cannot exceed 150 characters']
    },
    collegeCode: {
      type: String,
      required: [true, 'College code is required'],
      trim: true,
      uppercase: true,
      unique: true,
      minlength: [1, 'College code cannot be empty'],
      maxlength: [10, 'College code cannot exceed 10 characters']
    },
    emailDomain: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    address: {
      type: String,
      trim: true,
      default: ''
    },
    logo: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED'],
      default: 'ACTIVE'
    }
  },
  {
    timestamps: true
  }
);

// Indexes
collegeSchema.index({ status: 1 });

export const College = mongoose.model('College', collegeSchema);

