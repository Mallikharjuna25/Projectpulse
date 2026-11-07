import { z } from 'zod';

export const requestFacultyGuideSchema = z.object({
  body: z.object({
    facultyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid faculty ID format'),
    message: z.string().trim().max(1000).optional().default('')
  })
});

export const respondFacultyRequestSchema = z.object({
  body: z.object({
    decision: z.enum(['ACCEPTED', 'REJECTED']),
    responseNote: z.string().trim().max(1000).optional().default('')
  })
});

export const assignFacultyGuideSchema = z.object({
  body: z.object({
    facultyId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid faculty ID format'),
    message: z.string().trim().max(1000).optional().default('')
  })
});

export const createProgressUpdateSchema = z.object({
  body: z.object({
    type: z.enum(['DAILY', 'WEEKLY', 'MEETING_NOTE']).optional().default('WEEKLY'),
    content: z.string().trim().min(5, 'Update content must be at least 5 characters').max(3000),
    blockers: z.string().trim().max(1000).optional().default(''),
    nextSteps: z.string().trim().max(1000).optional().default(''),
    weekNumber: z.number().int().min(1).optional().default(1)
  })
});

export const submitFeedbackSchema = z.object({
  body: z.object({
    entityType: z.enum(['PROJECT', 'MILESTONE', 'DOCUMENT', 'TASK', 'PROGRESS_UPDATE']).optional().default('PROJECT'),
    entityId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid entity ID format').optional().nullable(),
    comment: z.string().trim().min(3, 'Feedback comment must be at least 3 characters').max(2000),
    decision: z.enum(['COMMENT', 'APPROVED', 'CHANGES_REQUESTED']).optional().default('COMMENT')
  })
});

