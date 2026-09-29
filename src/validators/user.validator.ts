import { z } from 'zod';
import { Role, EmploymentStatus } from '@prisma/client';

export const createUserSchema = z.object({
  body: z.object({
    clerkUserId: z.string().min(1).optional(),
    employeeId: z.string().min(1).optional(),
    firstName: z.string().min(1, 'First name is required').trim(),
    lastName: z.string().min(1, 'Last name is required').trim(),
    email: z.string().email('Invalid email address').trim().toLowerCase(),
    phone: z.string().optional().nullable(),
    profileImage: z.string().optional().nullable(),
    role: z.nativeEnum(Role).optional().default(Role.EMPLOYEE),
    jobTitle: z.string().optional().nullable(),
    departmentId: z.string().min(1).optional().nullable(),
    joiningDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    employmentStatus: z.nativeEnum(EmploymentStatus).optional().default(EmploymentStatus.ACTIVE),
    isActive: z.boolean().optional().default(true),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    firstName: z.string().min(1).trim().optional(),
    lastName: z.string().min(1).trim().optional(),
    phone: z.string().optional().nullable(),
    profileImage: z.string().optional().nullable(),
    role: z.nativeEnum(Role).optional(),
    jobTitle: z.string().optional().nullable(),
    departmentId: z.string().min(1).optional().nullable(),
    joiningDate: z.string().datetime({ offset: true }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)).optional(),
    employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
    isActive: z.boolean().optional(),
  }),
});

export const updateUserStatusSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
  body: z.object({
    isActive: z.boolean().optional(),
    employmentStatus: z.nativeEnum(EmploymentStatus).optional(),
  }).refine((data) => data.isActive !== undefined || data.employmentStatus !== undefined, {
    message: 'Either isActive or employmentStatus must be provided',
  }),
});

export const updateProfileSchema = z.object({
  body: z.object({
    firstName: z.string().min(1, 'First name cannot be empty').trim().optional(),
    lastName: z.string().min(1, 'Last name cannot be empty').trim().optional(),
    phone: z.string().optional().nullable(),
    profileImage: z.string().optional().nullable(),
  }),
});

export const getUserByIdSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'User ID is required'),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    departmentId: z.string().optional(),
    role: z.nativeEnum(Role).optional(),
    status: z.nativeEnum(EmploymentStatus).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }).optional(),
});
