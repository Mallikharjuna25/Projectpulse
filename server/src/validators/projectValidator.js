import { z } from 'zod';

export const createProjectSchema = z.object({
  body: z.object({
    title: z.string().trim().min(5, 'Title must be at least 5 characters').max(120, 'Title cannot exceed 120 characters'),
    abstract: z.string().trim().max(500, 'Abstract cannot exceed 500 characters').optional().nullable(),
    description: z.string().trim().max(5000).optional().nullable(),
    objectives: z.array(z.string().trim()).optional().default([]),
    domain: z.string().trim().max(60).optional().nullable(),
    techStack: z.array(z.string().trim()).optional().default([]),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
    startDate: z.string().optional().nullable(),
    deadline: z.string({ required_error: 'Project deadline is required' }).min(1, 'Project deadline is required'),
    visibility: z.enum(['PRIVATE', 'COLLEGE']).optional().default('PRIVATE'),
    invitedEmails: z.array(z.string().trim().email().toLowerCase()).optional().default([])
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120).optional(),
    abstract: z.string().trim().max(500).optional().nullable(),
    description: z.string().trim().max(5000).optional().nullable(),
    objectives: z.array(z.string().trim()).optional(),
    domain: z.string().trim().max(60).optional().nullable(),
    techStack: z.array(z.string().trim()).optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED']).optional(),
    visibility: z.enum(['PRIVATE', 'COLLEGE']).optional(),
    startDate: z.string().optional().nullable(),
    deadline: z.string().optional().nullable(),
    deadlineChangeReason: z.string().trim().optional()
  })
});

export const joinByCodeSchema = z.object({
  body: z.object({
    joinCode: z.string().trim().min(4, 'Join code must be at least 4 characters').max(12)
  })
});

export const respondJoinRequestSchema = z.object({
  body: z.object({
    decision: z.enum(['ACCEPTED', 'REJECTED'])
  })
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address').toLowerCase(),
    responsibility: z.string().trim().max(120).optional().default('')
  })
});

export const transferLeadershipSchema = z.object({
  body: z.object({
    newLeaderUserId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')
  })
});

export const updateMemberSchema = z.object({
  body: z.object({
    responsibility: z.string().trim().max(120).optional().default('')
  })
});
