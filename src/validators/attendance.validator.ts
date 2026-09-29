import { z } from 'zod';
import { BreakType, AttendanceStatus } from '@prisma/client';

export const checkInSchema = z.object({
  body: z.object({
    latitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90'),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180'),
    accuracy: z.number().nonnegative('Accuracy must be a positive number'),
  }),
});

export const checkOutSchema = checkInSchema;

export const startBreakSchema = z.object({
  body: z.object({
    type: z.nativeEnum(BreakType).optional().default(BreakType.OTHER),
  }),
});

export const attendanceHistoryFilterSchema = z.object({
  query: z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    status: z.nativeEnum(AttendanceStatus).optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
  }),
});

export const allAttendanceFilterSchema = z.object({
  query: z.object({
    date: z.string().optional(),
    employeeId: z.string().optional(),
    departmentId: z.string().optional(),
    status: z.nativeEnum(AttendanceStatus).optional(),
    search: z.string().optional(),
    page: z.string().optional().default('1'),
    limit: z.string().optional().default('20'),
  }),
});

export const updateCompanySettingsSchema = z.object({
  body: z.object({
    officeLatitude: z.number().min(-90).max(90).optional(),
    officeLongitude: z.number().min(-180).max(180).optional(),
    officeRadiusMeters: z.number().positive().optional(),
    officeStartTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:MM').optional(),
    officeEndTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format HH:MM').optional(),
    maxAccuracyThresholdMeters: z.number().positive().optional(),
  }),
});
