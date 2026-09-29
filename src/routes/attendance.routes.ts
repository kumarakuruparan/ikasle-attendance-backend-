import { Router } from 'express';
import * as attendanceController from '../controllers/attendance.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission, requireRole } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  checkInSchema,
  checkOutSchema,
  startBreakSchema,
  attendanceHistoryFilterSchema,
  allAttendanceFilterSchema,
  updateCompanySettingsSchema,
} from '../validators/attendance.validator';
import { PERMISSIONS } from '../utils/permissions';
import { Role } from '@prisma/client';

const router = Router();

// All attendance routes require valid authentication
router.use(requireAuth);

/**
 * @route   POST /api/attendance/check-in
 * @desc    Check-in employee with verified GPS position
 * @access  Private (EMPLOYEE, HR, CEO)
 */
router.post('/check-in', validate(checkInSchema), attendanceController.checkIn);

/**
 * @route   POST /api/attendance/check-out
 * @desc    Check-out employee with verified GPS position and duration calculation
 * @access  Private (EMPLOYEE, HR, CEO)
 */
router.post('/check-out', validate(checkOutSchema), attendanceController.checkOut);

/**
 * @route   POST /api/attendance/break/start
 * @desc    Start an active break session (Morning, Lunch, Evening, Other)
 * @access  Private (EMPLOYEE, HR, CEO)
 */
router.post('/break/start', validate(startBreakSchema), attendanceController.startBreak);

/**
 * @route   POST /api/attendance/break/end
 * @desc    End the ongoing break session and compute actual duration
 * @access  Private (EMPLOYEE, HR, CEO)
 */
router.post('/break/end', attendanceController.endBreak);

/**
 * @route   GET /api/attendance/today
 * @desc    Get today's attendance record, ongoing break, and office schedule
 * @access  Private (Self)
 */
router.get('/today', attendanceController.getTodayAttendance);

/**
 * @route   GET /api/attendance/history
 * @desc    Get personal attendance history with date filters and pagination
 * @access  Private (Self)
 */
router.get(
  '/history',
  validate(attendanceHistoryFilterSchema),
  attendanceController.getAttendanceHistory
);

/**
 * @route   GET /api/attendance/all
 * @desc    Get paginated attendance across all employees (HR and CEO)
 * @access  Private (HR, CEO)
 */
router.get(
  '/all',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW_ALL),
  validate(allAttendanceFilterSchema),
  attendanceController.getAllAttendance
);

/**
 * @route   GET /api/attendance/stats
 * @desc    Get executive aggregate attendance overview (Total, Present, Absent, Avg Hours)
 * @access  Private (HR, CEO)
 */
router.get(
  '/stats',
  requirePermission(PERMISSIONS.ATTENDANCE_VIEW_ALL),
  attendanceController.getAttendanceStats
);

/**
 * @route   GET /api/attendance/settings
 * @desc    Get company office hours, allowed radius, and accuracy requirements
 * @access  Private (Authenticated users)
 */
router.get('/settings', attendanceController.getCompanySettings);

/**
 * @route   PATCH /api/attendance/settings
 * @desc    Update company office location coordinates, radius, or schedule
 * @access  Private (HR only)
 */
router.patch(
  '/settings',
  requireRole(Role.HR),
  validate(updateCompanySettingsSchema),
  attendanceController.updateCompanySettings
);

export default router;
