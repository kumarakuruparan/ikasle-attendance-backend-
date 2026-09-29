const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '../../frontend');
const authCompDir = path.join(frontendRoot, 'components', 'auth');

if (!fs.existsSync(authCompDir)) {
  fs.mkdirSync(authCompDir, { recursive: true });
}

// 1. UnauthorizedState.tsx
fs.writeFileSync(
  path.join(authCompDir, 'UnauthorizedState.tsx'),
`'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Home, Lock } from 'lucide-react';
import { useAuthRole } from '@/lib/auth/useAuthRole';
import { UserRole } from '@/types/auth';

interface UnauthorizedStateProps {
  title?: string;
  message?: string;
  requiredRole?: UserRole | UserRole[];
  returnPath?: string;
}

export default function UnauthorizedState({
  title = 'Access Restricted (403)',
  message,
  requiredRole,
  returnPath,
}: UnauthorizedStateProps) {
  const { role, defaultPath, switchRoleForDemo } = useAuthRole();
  const targetPath = returnPath || defaultPath;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
      <div className="relative mb-6">
        <div className="absolute -inset-4 rounded-full bg-rose-500/20 blur-xl dark:bg-rose-500/10" />
        <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-rose-500 to-amber-500 text-white shadow-xl shadow-rose-500/20">
          <ShieldAlert className="h-10 w-10" />
        </div>
      </div>

      <div className="inline-flex items-center gap-2 rounded-full border border-rose-200/80 bg-rose-50/80 px-3 py-1 text-xs font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-400 mb-4">
        <Lock className="h-3.5 w-3.5" />
        <span>Authorization Barrier</span>
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-2">
        {title}
      </h1>

      <p className="max-w-md text-sm text-slate-600 dark:text-slate-400 mb-6">
        {message || (
          <>
            Your current assigned role (
            <span className="font-semibold text-slate-900 dark:text-white capitalize">
              {role}
            </span>
            ) does not have privileges to view or perform actions in this portal.
          </>
        )}
      </p>

      {requiredRole && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400 max-w-sm">
          <span>Required Role: </span>
          <span className="font-bold text-slate-900 dark:text-white capitalize">
            {Array.isArray(requiredRole) ? requiredRole.join(' or ') : requiredRole}
          </span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        <Link
          href={targetPath}
          className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-blue-500/20 hover:from-blue-700 hover:to-indigo-700 transition-all"
        >
          <Home className="h-4 w-4" />
          <span>Return to My Dashboard</span>
        </Link>

        {/* Demo Switcher Quick Helper */}
        {requiredRole && (
          <button
            type="button"
            onClick={() => {
              const targetRole = Array.isArray(requiredRole) ? requiredRole[0] : requiredRole;
              switchRoleForDemo(targetRole);
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-all"
          >
            <span>Preview as {Array.isArray(requiredRole) ? requiredRole[0].toUpperCase() : requiredRole.toUpperCase()}</span>
          </button>
        )}
      </div>
    </div>
  );
}
`,
  'utf8'
);
console.log('Created UnauthorizedState.tsx');

// 2. RoleGuard.tsx
fs.writeFileSync(
  path.join(authCompDir, 'RoleGuard.tsx'),
`'use client';

import React from 'react';
import { useAuthRole } from '@/lib/auth/useAuthRole';
import { UserRole } from '@/types/auth';
import UnauthorizedState from './UnauthorizedState';

interface RoleGuardProps {
  allowedRoles: UserRole | UserRole[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function RoleGuard({
  allowedRoles,
  children,
  fallback,
}: RoleGuardProps) {
  const { hasRole, isLoaded } = useAuthRole();

  if (!isLoaded) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  const authorized = hasRole(allowedRoles);

  if (!authorized) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <UnauthorizedState requiredRole={allowedRoles} />
    );
  }

  return <>{children}</>;
}
`,
  'utf8'
);
console.log('Created RoleGuard.tsx');

// 3. PermissionGuard.tsx
fs.writeFileSync(
  path.join(authCompDir, 'PermissionGuard.tsx'),
`'use client';

import React from 'react';
import { useAuthRole } from '@/lib/auth/useAuthRole';
import { Permission } from '@/types/auth';
import UnauthorizedState from './UnauthorizedState';

interface PermissionGuardProps {
  permissions: Permission | Permission[];
  requireAll?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function PermissionGuard({
  permissions,
  requireAll = false,
  children,
  fallback,
}: PermissionGuardProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isLoaded } = useAuthRole();

  if (!isLoaded) {
    return null;
  }

  const permsArray = Array.isArray(permissions) ? permissions : [permissions];

  const authorized = requireAll
    ? hasAllPermissions(permsArray)
    : hasAnyPermission(permsArray);

  if (!authorized) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      <UnauthorizedState message="You do not possess the required permissions to perform this operation." />
    );
  }

  return <>{children}</>;
}
`,
  'utf8'
);
console.log('Created PermissionGuard.tsx');

// 4. Authorized.tsx
fs.writeFileSync(
  path.join(authCompDir, 'Authorized.tsx'),
`'use client';

import React from 'react';
import { useAuthRole } from '@/lib/auth/useAuthRole';
import { UserRole, Permission } from '@/types/auth';

interface AuthorizedProps {
  roles?: UserRole | UserRole[];
  permissions?: Permission | Permission[];
  requireAllPermissions?: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * Inline authorization wrapper for conditionally rendering buttons, tabs, sections
 */
export default function Authorized({
  roles,
  permissions,
  requireAllPermissions = false,
  children,
  fallback = null,
}: AuthorizedProps) {
  const { hasRole, hasAnyPermission, hasAllPermissions } = useAuthRole();

  let roleAllowed = true;
  if (roles) {
    roleAllowed = hasRole(roles);
  }

  let permAllowed = true;
  if (permissions) {
    const permsArray = Array.isArray(permissions) ? permissions : [permissions];
    permAllowed = requireAllPermissions
      ? hasAllPermissions(permsArray)
      : hasAnyPermission(permsArray);
  }

  if (roleAllowed && permAllowed) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
`,
  'utf8'
);
console.log('Created Authorized.tsx');

// 5. Barrel export
fs.writeFileSync(
  path.join(authCompDir, 'index.ts'),
`export { default as UnauthorizedState } from './UnauthorizedState';
export { default as RoleGuard } from './RoleGuard';
export { default as PermissionGuard } from './PermissionGuard';
export { default as Authorized } from './Authorized';
`,
  'utf8'
);
console.log('Created components/auth/index.ts');
