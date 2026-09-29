import { Request, Response, NextFunction } from 'express';
import * as attendanceService from '../services/attendance.service';
import { sendSuccess } from '../utils/response';
import { UnauthorizedError } from '../utils/errors';

export async function checkIn(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const actor = { id: req.currentUser.id, role: req.currentUser.role };
    const attendance = await attendanceService.checkIn(req.currentUser.id, req.body, actor);

    return sendSuccess(res, {
      data: attendance,
      message: 'Checked in successfully. Welcome to work!',
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

export async function checkOut(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const actor = { id: req.currentUser.id, role: req.currentUser.role };
    const attendance = await attendanceService.checkOut(req.currentUser.id, req.body, actor);

    return sendSuccess(res, {
      data: attendance,
      message: 'Checked out successfully. Have a great evening!',
    });
  } catch (error) {
    next(error);
  }
}

export async function startBreak(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const actor = { id: req.currentUser.id, role: req.currentUser.role };
    const breakRecord = await attendanceService.startBreak(req.currentUser.id, req.body.type, actor);

    return sendSuccess(res, {
      data: breakRecord,
      message: 'Break session started.',
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

export async function endBreak(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const actor = { id: req.currentUser.id, role: req.currentUser.role };
    const result = await attendanceService.endBreak(req.currentUser.id, actor);

    return sendSuccess(res, {
      data: result,
      message: `Break ended. Duration: ${result.break.durationMinutes} minutes.`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getTodayAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const result = await attendanceService.getTodayAttendance(req.currentUser.id);

    return sendSuccess(res, {
      data: result,
      message: "Today's attendance retrieved successfully",
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceHistory(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.currentUser) throw new UnauthorizedError();
    const result = await attendanceService.getAttendanceHistory(req.currentUser.id, req.query);

    return sendSuccess(res, {
      data: result.records,
      meta: result.pagination,
      message: 'Attendance history retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getAllAttendance(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await attendanceService.getAllAttendance(req.query);

    return sendSuccess(res, {
      data: result.records,
      meta: result.pagination,
      message: 'All attendance records retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getAttendanceStats(req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await attendanceService.getAttendanceStats(req.query.date as string | undefined);

    return sendSuccess(res, {
      data: stats,
      message: 'Attendance statistics retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getCompanySettings(req: Request, res: Response, next: NextFunction) {
  try {
    const settings = await attendanceService.getCompanySettings();

    return sendSuccess(res, {
      data: {
        officeStartTime: settings.officeStartTime,
        officeEndTime: settings.officeEndTime,
        officeRadiusMeters: settings.officeRadiusMeters,
        maxAccuracyThresholdMeters: settings.maxAccuracyThresholdMeters,
      },
      message: 'Company attendance settings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateCompanySettings(req: Request, res: Response, next: NextFunction) {
  try {
    const updated = await attendanceService.updateCompanySettings(req.body);

    return sendSuccess(res, {
      data: updated,
      message: 'Company attendance settings updated successfully',
    });
  } catch (error) {
    next(error);
  }
}
