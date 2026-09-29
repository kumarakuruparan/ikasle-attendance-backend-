const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '../../frontend');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// 1. types/auth.ts
const typesAuthPath = path.join(frontendRoot, 'types', 'auth.ts');
ensureDir(path.dirname(typesAuthPath));
fs.writeFileSync(
  typesAuthPath,
`/**
 * Centralized Role-Based Access Control (RBAC) Types
 */

import React from 'react';

export type UserRole = 'employee' | 'hr' | 'ceo';

export type Role = UserRole;

export type Permission =
  // Attendance
  | 'attendance.view.own'
  | 'attendance.view.all'
  | 'attendance.manage'
  | 'attendance.checkin'
  // Employees
  | 'employees.view'
  | 'employees.manage'
  // Projects
  | 'projects.view'
  | 'projects.manage'
  | 'projects.assign'
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
  | 'auditLogs.view'
  | 'productivity.view';

export interface RoleMetadata {
  id: UserRole;
  label: string;
  badge: string;
  defaultPath: string;
  description: string;
}

export interface NavigationItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  badge?: string;
}
`,
  'utf8'
);
console.log('Created types/auth.ts');

// 2. Update types/index.ts to re-export auth types
const typesIndexPath = path.join(frontendRoot, 'types', 'index.ts');
let typesIndexContent = fs.readFileSync(typesIndexPath, 'utf8');
if (!typesIndexContent.includes("export * from './auth';")) {
  typesIndexContent = `export * from './auth';\n` + typesIndexContent;
  fs.writeFileSync(typesIndexPath, typesIndexContent, 'utf8');
  console.log('Updated types/index.ts');
}

// 3. lib/auth/roles.ts
const rolesPath = path.join(frontendRoot, 'lib', 'auth', 'roles.ts');
ensureDir(path.dirname(rolesPath));
fs.writeFileSync(
  rolesPath,
`import { UserRole, RoleMetadata } from '@/types/auth';

export const ROLES = {
  EMPLOYEE: 'employee',
  HR: 'hr',
  CEO: 'ceo',
} as const satisfies Record<string, UserRole>;

export const ROLE_METADATA: Record<UserRole, RoleMetadata> = {
  employee: {
    id: 'employee',
    label: 'Employee Portal',
    badge: 'Employee',
    defaultPath: '/employee/dashboard',
    description: 'Manage personal attendance, daily work reports, tasks, and requests',
  },
  hr: {
    id: 'hr',
    label: 'HR Operations',
    badge: 'HR Manager',
    defaultPath: '/hr/dashboard',
    description: 'Workforce management, approvals, attendance tracking, and company settings',
  },
  ceo: {
    id: 'ceo',
    label: 'CEO Cockpit',
    badge: 'Executive',
    defaultPath: '/ceo/dashboard',
    description: 'High-level business intelligence, attendance summaries, and company analytics',
  },
};

export const ALL_ROLES: UserRole[] = ['employee', 'hr', 'ceo'];
`,
  'utf8'
);
console.log('Created lib/auth/roles.ts');

// 4. lib/auth/permissions.ts
const permissionsPath = path.join(frontendRoot, 'lib', 'auth', 'permissions.ts');
fs.writeFileSync(
  permissionsPath,
`import { Permission, UserRole } from '@/types/auth';

export const PERMISSIONS = {
  // Attendance
  ATTENDANCE_VIEW_OWN: 'attendance.view.own',
  ATTENDANCE_VIEW_ALL: 'attendance.view.all',
  ATTENDANCE_MANAGE: 'attendance.manage',
  ATTENDANCE_CHECKIN: 'attendance.checkin',

  // Employees
  EMPLOYEES_VIEW: 'employees.view',
  EMPLOYEES_MANAGE: 'employees.manage',

  // Projects
  PROJECTS_VIEW: 'projects.view',
  PROJECTS_MANAGE: 'projects.manage',
  PROJECTS_ASSIGN: 'projects.assign',

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
  REPORTS_EXECUTIVE: 'reports.executive',

  // Settings & System
  SETTINGS_MANAGE: 'settings.manage',
  AUDIT_LOGS_VIEW: 'auditLogs.view',
  PRODUCTIVITY_VIEW: 'productivity.view',
} as const satisfies Record<string, Permission>;

/**
 * Exact role-to-permissions mapping matrix
 */
export const ROLE_PERMISSIONS: Record<UserRole, readonly Permission[]> = {
  employee: [
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_CHECKIN,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.WORK_REPORTS_VIEW_OWN,
    PERMISSIONS.LEAVE_APPLY,
    PERMISSIONS.PERMISSION_APPLY,
    PERMISSIONS.REPORTS_VIEW_OWN,
  ],
  hr: [
    PERMISSIONS.ATTENDANCE_VIEW_OWN,
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.ATTENDANCE_MANAGE,
    PERMISSIONS.ATTENDANCE_CHECKIN,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.EMPLOYEES_MANAGE,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.PROJECTS_MANAGE,
    PERMISSIONS.PROJECTS_ASSIGN,
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
    PERMISSIONS.PRODUCTIVITY_VIEW,
  ],
  ceo: [
    PERMISSIONS.ATTENDANCE_VIEW_ALL,
    PERMISSIONS.EMPLOYEES_VIEW,
    PERMISSIONS.PROJECTS_VIEW,
    PERMISSIONS.TASKS_VIEW,
    PERMISSIONS.WORK_REPORTS_VIEW_ALL,
    PERMISSIONS.REPORTS_VIEW_ALL,
    PERMISSIONS.REPORTS_EXECUTIVE,
    PERMISSIONS.AUDIT_LOGS_VIEW,
    PERMISSIONS.PRODUCTIVITY_VIEW,
  ],
};
`,
  'utf8'
);
console.log('Created lib/auth/permissions.ts');

// 5. lib/auth/access.ts
const accessPath = path.join(frontendRoot, 'lib', 'auth', 'access.ts');
fs.writeFileSync(
  accessPath,
`import { Permission, UserRole } from '@/types/auth';
import { ROLE_PERMISSIONS } from './permissions';
import { ROLE_METADATA } from './roles';

/**
 * Check if a role possesses a specific permission
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed.includes(permission);
}

/**
 * Check if a role possesses any of the specified permissions
 */
export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  if (permissions.length === 0) return true;
  return permissions.some((perm) => hasPermission(role, perm));
}

/**
 * Check if a role possesses all of the specified permissions
 */
export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  if (permissions.length === 0) return true;
  return permissions.every((perm) => hasPermission(role, perm));
}

/**
 * Check if user has an allowed role
 */
export function hasRole(currentRole: UserRole, allowedRoles: UserRole | UserRole[]): boolean {
  if (Array.isArray(allowedRoles)) {
    return allowedRoles.includes(currentRole);
  }
  return currentRole === allowedRoles;
}

/**
 * Get default starting path for a role
 */
export function getRoleDefaultPath(role: UserRole): string {
  return ROLE_METADATA[role]?.defaultPath || '/employee/dashboard';
}

/**
 * Route protection validator
 * Determines if a role is permitted to access a given URL pathname
 */
export function isRouteAllowed(role: UserRole, pathname: string): boolean {
  // Public or general routes
  if (pathname === '/' || pathname.startsWith('/sign-in') || pathname.startsWith('/sign-up')) {
    return true;
  }

  // Segment-based portal protection
  if (pathname.startsWith('/employee')) {
    // Both employee and HR have employee-level view capabilities
    return role === 'employee' || role === 'hr';
  }

  if (pathname.startsWith('/hr')) {
    // Only HR can access /hr routes
    return role === 'hr';
  }

  if (pathname.startsWith('/ceo')) {
    // Only CEO can access /ceo routes
    return role === 'ceo';
  }

  return true;
}
`,
  'utf8'
);
console.log('Created lib/auth/access.ts');

console.log('RBAC Core libraries initialized successfully.');
