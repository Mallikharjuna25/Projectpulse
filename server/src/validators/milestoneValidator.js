import { z } from 'zod';

export const createMilestoneSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(120, 'Title cannot exceed 120 characters'),
    description: z.string().trim().max(2000).optional().default(''),
    deliverables: z.array(z.string().trim().min(1)).optional().default([]),
    startDate: z.string().optional().nullable(),
    dueDate: z.string({ required_error: 'Milestone target due date is required' }).min(1),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']).optional().default('PENDING')
  })
});

export const updateMilestoneSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(120).optional(),
    description: z.string().trim().max(2000).optional(),
    deliverables: z.array(z.string().trim().min(1)).optional(),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable(),
    status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED']).optional(),
    deadlineChangeReason: z.string().trim().optional()
  })
});

export const calendarQuerySchema = z.object({
  query: z.object({
    start: z.string().optional(),
    end: z.string().optional(),
    projectId: z.string().regex(/^[0-9a-fA-F]{24}$/).optional()
  })
});

