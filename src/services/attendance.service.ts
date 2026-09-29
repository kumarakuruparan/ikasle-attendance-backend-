import { Prisma, AttendanceStatus, BreakType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { BadRequestError, ConflictError, ForbiddenError } from '../utils/errors';
import { calculateDistanceInMeters } from '../utils/geo';
import { logAuditEvent } from './audit.service';

export function getNormalizedTodayDate(d = new Date()): Date {
  const dateOnlyStr = d.toISOString().split('T')[0];
  return new Date(`${dateOnlyStr}T00:00:00.000Z`);
}

export interface GPSLocationPayload {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export interface AttendanceHistoryFilters {
  startDate?: string;
  endDate?: string;
  status?: AttendanceStatus;
  page?: string | number;
  limit?: string | number;
}

export interface AllAttendanceFilters {
  date?: string;
  employeeId?: string;
  departmentId?: string;
  status?: AttendanceStatus;
  search?: string;
  page?: string | number;
  limit?: string | number;
}

/**
 * Retrieves or initializes default company attendance settings
 */
export async function getCompanySettings() {
  let settings = await prisma.companySettings.findUnique({
    where: { id: 'default' },
  });

  if (!settings) {
    settings = await prisma.companySettings.create({
      data: {
        id: 'default',
        officeLatitude: 12.9716, // Default Bangalore HQ coordinates
        officeLongitude: 77.5946,
        officeRadiusMeters: 300.0,
        officeStartTime: '09:30',
        officeEndTime: '19:00',
        maxAccuracyThresholdMeters: 150.0,
      },
    });
  }

  return settings;
}

/**
 * Updates company attendance settings (HR / Settings admin only)
 */
export async function updateCompanySettings(data: {
  officeLatitude?: number;
  officeLongitude?: number;
  officeRadiusMeters?: number;
  officeStartTime?: string;
  officeEndTime?: string;
  maxAccuracyThresholdMeters?: number;
}) {
  const current = await getCompanySettings();
  const updated = await prisma.companySettings.update({
    where: { id: current.id },
    data,
  });
  return updated;
}

/**
 * Check-in employee using verified GPS position
 */
export async function checkIn(
  userId: string,
  location: GPSLocationPayload,
  actor?: { id: string; role: string }
) {
  // 1. Verify user exists and is active
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, employeeId: true, firstName: true, lastName: true, isActive: true, employmentStatus: true },
  });

  if (!user || !user.isActive || user.employmentStatus !== 'ACTIVE') {
    throw new ForbiddenError('Only active employees are permitted to record attendance.');
  }

  const today = getNormalizedTodayDate();

  // 2. Check if today's attendance already exists
  const existing = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  if (existing) {
    throw new ConflictError('You have already checked in for today.');
  }

  // 3. Retrieve company attendance settings
  const settings = await getCompanySettings();

  // 4. Validate GPS accuracy
  if (location.accuracy > settings.maxAccuracyThresholdMeters) {
    logAuditEvent({
      action: 'FAILED_LOCATION_VALIDATION',
      entity: 'Attendance',
      entityId: userId,
      actorId: actor?.id || userId,
      actorRole: actor?.role || 'EMPLOYEE',
      metadata: { reason: 'ACCURACY_TOO_LOW', accuracy: location.accuracy, maxAllowed: settings.maxAccuracyThresholdMeters },
    });
    throw new BadRequestError(
      'Location accuracy is too low. Please move to an area with a better GPS signal and try again.'
    );
  }

  // 5. Calculate distance from office using Haversine formula
  const distance = calculateDistanceInMeters(
    location.latitude,
    location.longitude,
    settings.officeLatitude,
    settings.officeLongitude
  );

  // 6. Verify distance is within allowed radius
  if (distance > settings.officeRadiusMeters) {
    logAuditEvent({
      action: 'FAILED_LOCATION_VALIDATION',
      entity: 'Attendance',
      entityId: userId,
      actorId: actor?.id || userId,
      actorRole: actor?.role || 'EMPLOYEE',
      metadata: { reason: 'OUTSIDE_OFFICE_RADIUS', distanceMeters: distance, allowedRadius: settings.officeRadiusMeters },
    });
    throw new BadRequestError(
      `You are outside the permitted office attendance area (${Math.round(distance)}m away; allowed: ${settings.officeRadiusMeters}m). You must be within office premises to check in.`
    );
  }

  const checkInTime = new Date();

  // 7. Create attendance record
  const attendance = await prisma.attendance.create({
    data: {
      userId,
      date: today,
      checkInAt: checkInTime,
      checkInLatitude: location.latitude,
      checkInLongitude: location.longitude,
      checkInAccuracy: location.accuracy,
      status: AttendanceStatus.PRESENT,
    },
    include: {
      breaks: true,
      user: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  logAuditEvent({
    action: 'ATTENDANCE_CHECK_IN',
    entity: 'Attendance',
    entityId: attendance.id,
    actorId: actor?.id || userId,
    actorRole: actor?.role || 'EMPLOYEE',
    newState: {
      attendanceId: attendance.id,
      checkInAt: checkInTime.toISOString(),
      distanceMeters: distance,
    },
  });

  return {
    ...attendance,
    distanceFromOfficeMeters: distance,
  };
}

/**
 * Check-out employee using verified GPS position
 */
export async function checkOut(
  userId: string,
  location: GPSLocationPayload,
  actor?: { id: string; role: string }
) {
  const today = getNormalizedTodayDate();

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    include: {
      breaks: true,
      user: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!attendance) {
    throw new BadRequestError('No active check-in record found for today. Please check in first.');
  }

  if (attendance.checkOutAt) {
    throw new BadRequestError('You have already checked out for today.');
  }

  // Verify no open break is active
  const openBreak = attendance.breaks.find((b) => b.endedAt === null);
  if (openBreak) {
    throw new BadRequestError('You currently have an active break. Please end your break before checking out.');
  }

  // Validate GPS accuracy
  const settings = await getCompanySettings();
  if (location.accuracy > settings.maxAccuracyThresholdMeters) {
    throw new BadRequestError(
      'Location accuracy is too low. Please move to an area with a better GPS signal and try again.'
    );
  }

  const distance = calculateDistanceInMeters(
    location.latitude,
    location.longitude,
    settings.officeLatitude,
    settings.officeLongitude
  );

  if (distance > settings.officeRadiusMeters) {
    throw new BadRequestError(
      `You are outside the permitted office attendance area (${Math.round(distance)}m away; allowed: ${settings.officeRadiusMeters}m). You must be within office premises to check out.`
    );
  }

  const checkOutTime = new Date();
  const totalPresenceMinutes = Math.max(
    0,
    Math.round((checkOutTime.getTime() - attendance.checkInAt.getTime()) / 60000)
  );
  const totalWorkingMinutes = Math.max(0, totalPresenceMinutes - attendance.totalBreakMinutes);

  const updated = await prisma.attendance.update({
    where: { id: attendance.id },
    data: {
      checkOutAt: checkOutTime,
      checkOutLatitude: location.latitude,
      checkOutLongitude: location.longitude,
      checkOutAccuracy: location.accuracy,
      totalWorkingMinutes,
      status: AttendanceStatus.COMPLETED,
    },
    include: {
      breaks: true,
      user: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          department: { select: { id: true, name: true } },
        },
      },
    },
  });

  logAuditEvent({
    action: 'ATTENDANCE_CHECK_OUT',
    entity: 'Attendance',
    entityId: updated.id,
    actorId: actor?.id || userId,
    actorRole: actor?.role || 'EMPLOYEE',
    newState: {
      checkOutAt: checkOutTime.toISOString(),
      totalPresenceMinutes,
      totalWorkingMinutes,
      totalBreakMinutes: updated.totalBreakMinutes,
    },
  });

  return {
    ...updated,
    distanceFromOfficeMeters: distance,
  };
}

/**
 * Starts a break session for today's active attendance
 */
export async function startBreak(
  userId: string,
  type: BreakType = BreakType.OTHER,
  actor?: { id: string; role: string }
) {
  const today = getNormalizedTodayDate();

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    include: { breaks: true },
  });

  if (!attendance) {
    throw new BadRequestError('Cannot start a break without checking in first.');
  }

  if (attendance.checkOutAt) {
    throw new BadRequestError('Cannot start a break after checkout.');
  }

  // Ensure no existing break is running
  const ongoingBreak = attendance.breaks.find((b) => b.endedAt === null);
  if (ongoingBreak) {
    throw new ConflictError('You already have an active break in progress.');
  }

  const breakRecord = await prisma.break.create({
    data: {
      attendanceId: attendance.id,
      type,
      startedAt: new Date(),
    },
  });

  logAuditEvent({
    action: 'BREAK_STARTED',
    entity: 'Break',
    entityId: breakRecord.id,
    actorId: actor?.id || userId,
    actorRole: actor?.role || 'EMPLOYEE',
    newState: { type: breakRecord.type, startedAt: breakRecord.startedAt.toISOString() },
  });

  return breakRecord;
}

/**
 * Ends the ongoing break session and calculates actual duration
 */
export async function endBreak(userId: string, actor?: { id: string; role: string }) {
  const today = getNormalizedTodayDate();

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    include: { breaks: true },
  });

  if (!attendance) {
    throw new BadRequestError('No active attendance found for today.');
  }

  const ongoingBreak = attendance.breaks.find((b) => b.endedAt === null);
  if (!ongoingBreak) {
    throw new BadRequestError('No active break found to end.');
  }

  const endedAt = new Date();
  const durationMinutes = Math.max(
    1,
    Math.round((endedAt.getTime() - ongoingBreak.startedAt.getTime()) / 60000)
  );

  const updatedBreak = await prisma.break.update({
    where: { id: ongoingBreak.id },
    data: {
      endedAt,
      durationMinutes,
    },
  });

  // Calculate new total break duration for this attendance
  const allBreaks = await prisma.break.findMany({
    where: { attendanceId: attendance.id },
  });
  const totalBreakMinutes = allBreaks.reduce((sum, b) => sum + (b.durationMinutes || 0), 0);

  const updatedAttendance = await prisma.attendance.update({
    where: { id: attendance.id },
    data: { totalBreakMinutes },
    include: { breaks: true },
  });

  logAuditEvent({
    action: 'BREAK_ENDED',
    entity: 'Break',
    entityId: updatedBreak.id,
    actorId: actor?.id || userId,
    actorRole: actor?.role || 'EMPLOYEE',
    newState: {
      endedAt: endedAt.toISOString(),
      durationMinutes,
      totalBreakMinutes,
    },
  });

  return {
    break: updatedBreak,
    attendance: updatedAttendance,
  };
}

/**
 * Returns today's attendance record and current break state for a specific user
 */
export async function getTodayAttendance(userId: string) {
  const today = getNormalizedTodayDate();
  const settings = await getCompanySettings();

  const attendance = await prisma.attendance.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    include: {
      breaks: {
        orderBy: { startedAt: 'asc' },
      },
    },
  });

  const activeBreak = attendance?.breaks.find((b) => b.endedAt === null) || null;

  return {
    attendance: attendance || null,
    activeBreak,
    officeSettings: {
      officeStartTime: settings.officeStartTime,
      officeEndTime: settings.officeEndTime,
      officeRadiusMeters: settings.officeRadiusMeters,
      maxAccuracyThresholdMeters: settings.maxAccuracyThresholdMeters,
      officeCoordinates: {
        latitude: settings.officeLatitude,
        longitude: settings.officeLongitude,
      },
    },
  };
}

/**
 * Returns paginated attendance history for a single user
 */
export async function getAttendanceHistory(userId: string, filters: AttendanceHistoryFilters = {}) {
  const { startDate, endDate, status, page = 1, limit = 20 } = filters;
  const take = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (Math.max(Number(page), 1) - 1) * take;

  const where: Prisma.AttendanceWhereInput = { userId };

  if (status) {
    where.status = status;
  }

  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(`${startDate}T00:00:00.000Z`);
    if (endDate) where.date.lte = new Date(`${endDate}T23:59:59.999Z`);
  }

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: {
        breaks: {
          orderBy: { startedAt: 'asc' },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take,
    }),
  ]);

  return {
    records,
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

/**
 * Returns paginated attendance across all employees (HR & CEO)
 */
export async function getAllAttendance(filters: AllAttendanceFilters = {}) {
  const { date, employeeId, departmentId, status, search, page = 1, limit = 20 } = filters;
  const take = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (Math.max(Number(page), 1) - 1) * take;

  const where: Prisma.AttendanceWhereInput = {};

  if (date) {
    where.date = getNormalizedTodayDate(new Date(date));
  }

  if (status) {
    where.status = status;
  }

  if (employeeId || departmentId || search) {
    where.user = {};
    if (employeeId) where.user.employeeId = employeeId;
    if (departmentId && departmentId !== 'all') where.user.departmentId = departmentId;
    if (search && search.trim() !== '') {
      const term = search.trim();
      where.user.OR = [
        { firstName: { contains: term, mode: 'insensitive' } },
        { lastName: { contains: term, mode: 'insensitive' } },
        { employeeId: { contains: term, mode: 'insensitive' } },
        { email: { contains: term, mode: 'insensitive' } },
      ];
    }
  }

  const [total, records] = await Promise.all([
    prisma.attendance.count({ where }),
    prisma.attendance.findMany({
      where,
      include: {
        breaks: true,
        user: {
          select: {
            id: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            jobTitle: true,
            role: true,
            department: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: [{ date: 'desc' }, { checkInAt: 'desc' }],
      skip,
      take,
    }),
  ]);

  return {
    records: records.map((rec) => ({
      ...rec,
      user: {
        ...rec.user,
        fullName: `${rec.user.firstName} ${rec.user.lastName}`.trim(),
        departmentName: rec.user.department?.name || 'Unassigned',
      },
    })),
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take) || 1,
    },
  };
}

/**
 * Returns executive overview statistics for attendance (CEO / HR)
 */
export async function getAttendanceStats(dateStr?: string) {
  const targetDate = dateStr ? getNormalizedTodayDate(new Date(dateStr)) : getNormalizedTodayDate();

  const [totalEmployees, attendances] = await Promise.all([
    prisma.user.count({
      where: { isActive: true, employmentStatus: 'ACTIVE' },
    }),
    prisma.attendance.findMany({
      where: { date: targetDate },
      select: {
        id: true,
        status: true,
        totalWorkingMinutes: true,
      },
    }),
  ]);

  const presentCount = attendances.length;
  const completedCount = attendances.filter((a) => a.status === AttendanceStatus.COMPLETED).length;
  const activeCount = attendances.filter((a) => a.status === AttendanceStatus.PRESENT).length;
  const absentCount = Math.max(0, totalEmployees - presentCount);

  const completedRecords = attendances.filter((a) => a.status === AttendanceStatus.COMPLETED);
  const avgWorkingMinutes =
    completedRecords.length > 0
      ? Math.round(
          completedRecords.reduce((sum, a) => sum + a.totalWorkingMinutes, 0) / completedRecords.length
        )
      : 0;

  return {
    date: targetDate.toISOString().split('T')[0],
    totalEmployees,
    presentCount,
    completedCount,
    activeCount,
    absentCount,
    avgWorkingMinutes,
    avgWorkingHours: (avgWorkingMinutes / 60).toFixed(1),
  };
}
