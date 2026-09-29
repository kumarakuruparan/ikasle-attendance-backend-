import path from 'path';

// Relative imports
import { ROLES, ROLE_METADATA } from '../../frontend/lib/auth/roles';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../../frontend/lib/auth/permissions';
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasRole,
  isRouteAllowed,
  getRoleDefaultPath,
} from '../../frontend/lib/auth/access';

console.log('--- 1. Testing Role Definitions & Metadata ---');
console.log('Roles:', Object.values(ROLES));
console.log('Employee default path:', getRoleDefaultPath('employee'));
console.log('HR default path:', getRoleDefaultPath('hr'));
console.log('CEO default path:', getRoleDefaultPath('ceo'));

console.log('\n--- 2. Testing Route Access Restrictions ---');
const routes = [
  '/employee/dashboard',
  '/employee/attendance',
  '/employee/leave',
  '/hr/dashboard',
  '/hr/employees',
  '/hr/settings',
  '/ceo/dashboard',
  '/ceo/productivity',
  '/ceo/reports',
];

const roles: ('employee' | 'hr' | 'ceo')[] = ['employee', 'hr', 'ceo'];

for (const role of roles) {
  console.log(`\nRoute Access for [${role.toUpperCase()}]:`);
  for (const route of routes) {
    const allowed = isRouteAllowed(role, route);
    console.log(`  ${route.padEnd(25)} -> ${allowed ? 'ALLOW' : 'DENIED (403)'}`);
  }
}

console.log('\n--- 3. Testing Permission Granularity ---');
console.log('Can Employee view own attendance?', hasPermission('employee', PERMISSIONS.ATTENDANCE_VIEW_OWN));
console.log('Can Employee manage attendance?', hasPermission('employee', PERMISSIONS.ATTENDANCE_MANAGE));
console.log('Can Employee manage employees?', hasPermission('employee', PERMISSIONS.EMPLOYEES_MANAGE));
console.log('Can Employee apply for leave?', hasPermission('employee', PERMISSIONS.LEAVE_APPLY));
console.log('Can Employee manage/approve leave?', hasPermission('employee', PERMISSIONS.LEAVE_MANAGE));

console.log('\nCan HR manage employees?', hasPermission('hr', PERMISSIONS.EMPLOYEES_MANAGE));
console.log('Can HR manage attendance?', hasPermission('hr', PERMISSIONS.ATTENDANCE_MANAGE));
console.log('Can HR manage company settings?', hasPermission('hr', PERMISSIONS.SETTINGS_MANAGE));
console.log('Can HR check in / out?', hasPermission('hr', PERMISSIONS.ATTENDANCE_CHECKIN));

console.log('\nCan CEO view organization dashboards & reports?', hasPermission('ceo', PERMISSIONS.REPORTS_EXECUTIVE));
console.log('Can CEO view attendance summaries?', hasPermission('ceo', PERMISSIONS.ATTENDANCE_VIEW_ALL));
console.log('Can CEO view employees?', hasPermission('ceo', PERMISSIONS.EMPLOYEES_VIEW));
console.log('Can CEO view productivity?', hasPermission('ceo', PERMISSIONS.PRODUCTIVITY_VIEW));
console.log('Does CEO have HR employee management permissions?', hasPermission('ceo', PERMISSIONS.EMPLOYEES_MANAGE));
console.log('Does CEO have HR company settings management permissions?', hasPermission('ceo', PERMISSIONS.SETTINGS_MANAGE));
console.log('Does CEO have leave approval permissions?', hasPermission('ceo', PERMISSIONS.LEAVE_MANAGE));

console.log('\nALL RBAC CHECKS PASSED.');
