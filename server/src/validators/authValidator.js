import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name cannot exceed 60 characters'),
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    collegeId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid college ID format'),
    departmentId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid department ID format').optional().nullable(),
    rollNumber: z.string().trim().min(1, 'Roll number is required for students').optional().nullable(),
    academicYear: z.enum(['1st', '2nd', '3rd', '4th', 'PG']).optional().nullable(),
    section: z.string().trim().max(10).optional().nullable()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false)
  })
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').toLowerCase()
  })
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
  })
});

export const verifyEmailSchema = z.object({
  query: z.object({
    token: z.string().min(1, 'Verification token is required')
  })
});

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(60).optional(),
    bio: z.string().trim().max(500).optional(),
    skills: z.array(z.string().trim()).optional(),
    avatar: z.string().url().optional().or(z.literal(''))
  })
});

