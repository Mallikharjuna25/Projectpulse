import { Department } from '../models/Department.js';
import { User } from '../models/User.js';

export class DepartmentService {
  /**
   * List departments in a college with user count aggregation.
   */
  static async listDepartments(collegeId) {
    const departments = await Department.find({ collegeId }).sort({ name: 1 });

    // Aggregate user counts per department
    const userCounts = await User.aggregate([
      { $match: { collegeId } },
      {
        $group: {
          _id: '$departmentId',
          totalUsers: { $sum: 1 },
          students: {
            $sum: { $cond: [{ $eq: ['$globalRole', 'STUDENT'] }, 1, 0] }
          },
          faculty: {
            $sum: { $cond: [{ $eq: ['$globalRole', 'FACULTY'] }, 1, 0] }
          }
        }
      }
    ]);

    const countMap = {};
    userCounts.forEach((c) => {
      if (c._id) {
        countMap[c._id.toString()] = c;
      }
    });

    const enriched = departments.map((dept) => {
      const counts = countMap[dept._id.toString()] || {
        totalUsers: 0,
        students: 0,
        faculty: 0
      };
      return {
        ...dept.toObject(),
        userCounts: counts
      };
    });

    return enriched;
  }

  /**
   * Create a new department within a college.
   */
  static async createDepartment(collegeId, data) {
    const { name, code, hodName } = data;

    // Check duplicate code in this college
    const existing = await Department.findOne({
      collegeId,
      code: code.toUpperCase()
    });

    if (existing) {
      const err = new Error(`Department with code ${code.toUpperCase()} already exists in this college`);
      err.statusCode = 409;
      throw err;
    }

    const department = await Department.create({
      collegeId,
      name,
      code: code.toUpperCase(),
      hodName: hodName || ''
    });

    return department;
  }

  /**
   * Update department details.
   */
  static async updateDepartment(collegeId, departmentId, data) {
    const department = await Department.findOne({ _id: departmentId, collegeId });
    if (!department) {
      const err = new Error('Department not found in your college');
      err.statusCode = 404;
      throw err;
    }

    if (data.code && data.code.toUpperCase() !== department.code) {
      const existing = await Department.findOne({
        collegeId,
        code: data.code.toUpperCase()
      });
      if (existing) {
        const err = new Error(`Department code ${data.code.toUpperCase()} is already in use`);
        err.statusCode = 409;
        throw err;
      }
      department.code = data.code.toUpperCase();
    }

    if (data.name) department.name = data.name;
    if (data.hodName !== undefined) department.hodName = data.hodName;

    await department.save();
    return department;
  }

  /**
   * Delete a department if no users are currently assigned to it.
   */
  static async deleteDepartment(collegeId, departmentId) {
    const department = await Department.findOne({ _id: departmentId, collegeId });
    if (!department) {
      const err = new Error('Department not found in your college');
      err.statusCode = 404;
      throw err;
    }

    // Check if any users belong to this department
    const assignedUsersCount = await User.countDocuments({
      collegeId,
      departmentId
    });

    if (assignedUsersCount > 0) {
      const err = new Error(
        `Cannot delete department "${department.name}". ${assignedUsersCount} user(s) are currently assigned to it.`
      );
      err.statusCode = 400;
      err.errors = { assignedUsersCount };
      throw err;
    }

    await Department.findByIdAndDelete(departmentId);
    return { message: `Department "${department.name}" deleted successfully` };
  }
}

