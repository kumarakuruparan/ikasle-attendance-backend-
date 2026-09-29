import { Role } from '@prisma/client';
import { Permission } from '../types/auth';

export const PERMISSIONS = {
  // Attendance
  ATTENDANCE_VIEW_OWN: 'attendance.view.own',
  ATTENDANCE_VIEW_ALL: 'attendance.view.all',
  ATTENDANCE_MANAGE: 'attendance.manage',

  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_MANAGE: 'employees.manage',

  // Projects
  PROJECTS_VIEW: 'projects.view',
  PROJECTS_MANAGE: 'projects.manage',

  // Tasks
  TASKS_VIEW: 'tasks.view',
  TASKS_MANAGE: 'tasks.manage',

  // Work Reports
  WORK_REPORTS_VIEW_OWN: 'workReports.view.own',
  WORK_REPORTS_VIEW_ALL: 'workReports.view.all',
  WORK_REPORTS_MANAGE: 'workReports.manage',

  // Leave & Permission
  LEAVE_APPLY: 'leave.apply',
  LEAVE_MANAGE: 'leave.manage',
  PERMISSION_APPLY: 'permission.apply',
  PERMISSION_MANAGE: 'permission.manage',

  // Reports
  REPORTS_VIEW_OWN: 'reports.view.own',
  REPORTS_VIEW_ALL: 'reports.view.all',

  // Settings & System
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_LOGS_VIEW: 'auditLogs.view',
} as const satisfies Record<string, Permission>;

/**
 * Exact Centralized Role-to-Permissions Mapping
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  EMPLOYEE: [
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.WORK_REPORTS_VIEW_OWN,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.PERMISSION_APPLY,
    PERMISSIONS.REPORTS_VIEW_OWN,
  ],
  HR: [
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_MANAGE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.TASKS_MANAGE,
    PERMISSIONS.WORK_REPORTS_VIEW_OWN,
    PERMISSIONS.WORK_REPORTS_VIEW_ALL,
    PERMISSIONS.WORK_REPORTS_MANAGE,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.LEAVE_MANAGE,
    PERMISSIONS.PERMISSION_APPLY,
    PERMISSIONS.PERMISSION_MANAGE,
    PERMISSIONS.REPORTS_VIEW_OWN,
    PERMISSIONS.REPORTS_VIEW_ALL,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ],
  CEO: [
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.WORK_REPORTS_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW_ALL,
    PERMISSIONS.AUDIT_LOGS_VIEW,
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function hasAllPermissions(role: Role, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(role, p));
}

export function hasAnyPermission(role: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(role, p));
}
