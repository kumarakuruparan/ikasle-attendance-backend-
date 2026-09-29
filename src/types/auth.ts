import { Role, EmploymentStatus, User, Department } from '@prisma/client';

export { Role, EmploymentStatus };

export type Permission =
  // Attendance
  | 'attendance.view.own'
  | 'attendance.view.all'
  | 'attendance.manage'
  // Employees
  | 'employees.view'
  | 'employees.manage'
  // Projects
  | 'projects.view'
  | 'projects.manage'
  // Tasks
  | 'tasks.view'
  | 'tasks.manage'
  // Work Reports
  | 'workReports.view.own'
  | 'workReports.view.all'
  | 'workReports.manage'
  // Leave & Permission
  | 'leave.apply'
  | 'leave.manage'
  | 'permission.apply'
  | 'permission.manage'
  // Reports
  | 'reports.view.own'
  | 'reports.view.all'
  | 'reports.executive'
  // Settings & System
  | 'settings.manage'
  | 'auditLogs.view';

export type UserWithDepartment = User & {
  department: Department | null;
};

export type SafeUser = Omit<User, 'joiningDate' | 'createdAt' | 'updatedAt'> & {
  fullName: string;
  departmentName?: string | null;
  joiningDate: string;
  createdAt: string;
  updatedAt: string;
};
