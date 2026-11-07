import { z } from 'zod';

export const createTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(150, 'Title cannot exceed 150 characters'),
    description: z.string().trim().max(3000).optional().default(''),
    acceptanceCriteria: z
      .array(
        z.union([
          z.string().trim().min(1),
          z.object({
            text: z.string().trim().min(1),
            isCompleted: z.boolean().optional().default(false)
          })
        ])
      )
      .optional()
      .default([]),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional().default('MEDIUM'),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']).optional().default('TODO'),
    assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')).optional().default([]),
    milestoneId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid milestone ID format').optional().nullable(),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable()
  })
});

export const updateTaskSchema = z.object({
  body: z.object({
    title: z.string().trim().min(3).max(150).optional(),
    description: z.string().trim().max(3000).optional(),
    acceptanceCriteria: z
      .array(
        z.union([
          z.string().trim().min(1),
          z.object({
            text: z.string().trim().min(1),
            isCompleted: z.boolean().optional().default(false)
          })
        ])
      )
      .optional(),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']).optional(),
    assignees: z.array(z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid user ID format')).optional(),
    milestoneId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid milestone ID format').optional().nullable(),
    startDate: z.string().optional().nullable(),
    dueDate: z.string().optional().nullable()
  })
});

export const moveTaskSchema = z.object({
  body: z.object({
    status: z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED']),
    order: z.number().int().min(0)
  })
});

export const toggleCriteriaSchema = z.object({
  body: z.object({
    index: z.number().int().min(0)
  })
});

