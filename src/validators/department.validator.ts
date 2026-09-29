import { z } from 'zod';

export const createDepartmentSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters').trim(),
    description: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateDepartmentSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Department ID is required'),
  }),
  body: z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters').trim().optional(),
    description: z.string().trim().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

export const updateDepartmentStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Department ID is required'),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

export const getDepartmentByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Department ID is required'),
  }),
});

export const listDepartmentsSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    isActive: z.enum(['true', 'false']).optional(),
  }).optional(),
});
