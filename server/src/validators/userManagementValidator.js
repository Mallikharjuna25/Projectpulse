import { z } from 'zod';

export const createFacultySchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
    designation: z.string().trim().max(60).optional().default('Assistant Professor'),
    maxSupervisionCapacity: z.number().int().min(1).max(20).optional().default(5)
  })
});

export const createReviewerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
    designation: z.string().trim().max(60).optional().default('Project Reviewer')
  })
});

export const createStudentByAdminSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format'),
    rollNumber: z.string().trim().min(1, 'Roll number is required').max(30),
    academicYear: z.enum(['1st', '2nd', '3rd', '4th', 'PG']).optional().default('4th'),
    section: z.string().trim().max(10).optional().default('A')
  })
});

export const toggleUserStatusSchema = z.object({
  body: z.object({
    isActive: z.boolean()
  })
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
  })
});

