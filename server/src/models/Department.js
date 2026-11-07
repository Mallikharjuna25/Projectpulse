import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema(
  {
    collegeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'College',
      required: [true, 'College ID is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters']
    },
    code: {
      type: String,
      required: [true, 'Department code is required'],
      trim: true,
      uppercase: true,
      maxlength: [20, 'Department code cannot exceed 20 characters']
    },
    hodName: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

// Compound unique index for collegeId and department code
departmentSchema.index({ collegeId: 1, code: 1 }, { unique: true });

export const Department = mongoose.model('Department', departmentSchema);

