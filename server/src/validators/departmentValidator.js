import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Department name must be at least 2 characters').max(100),
    code: z.string().trim().min(2, 'Department code must be at least 2 characters').max(20).toUpperCase(),
    hodName: z.string().trim().max(100).optional().default('')
  })
});

export const updateDepartmentSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    code: z.string().trim().min(2).max(20).toUpperCase().optional(),
    hodName: z.string().trim().max(100).optional()
  })
});

