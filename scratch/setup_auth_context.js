const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '../../frontend');
const authContextPath = path.join(frontendRoot, 'lib', 'auth', 'useAuthRole.tsx');

fs.writeFileSync(
  authContextPath,
`'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserRole, Permission } from '@/types/auth';
import { ROLE_PERMISSIONS } from './permissions';
import {
  hasPermission as checkPermission,
  hasAnyPermission as checkAnyPermission,
  hasAllPermissions as checkAllPermissions,
  hasRole as checkRole,
  isRouteAllowed,
  getRoleDefaultPath,
} from './access';

interface AuthRoleContextType {
  role: UserRole;
  permissions: readonly Permission[];
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (allowedRoles: UserRole | UserRole[]) => boolean;
  canAccessRoute: (pathname: string) => boolean;
  switchRoleForDemo: (newRole: UserRole) => void;
  defaultPath: string;
  isLoaded: boolean;
  isSignedIn: boolean;
}

const AuthRoleContext = createContext<AuthRoleContextType | undefined>(undefined);

const DEMO_ROLE_KEY = 'ikasle_active_role';

export function AuthRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded, isSignedIn } = useUser();
  const [activeRole, setActiveRole] = useState<UserRole>('employee');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // 1. Check if user selected a demo role override in session
    const savedRole = localStorage.getItem(DEMO_ROLE_KEY) as UserRole | null;
    if (savedRole && (savedRole === 'employee' || savedRole === 'hr' || savedRole === 'ceo')) {
      setActiveRole(savedRole);
      return;
    }

    // 2. Otherwise read from Clerk user metadata
    if (user) {
      const clerkRole = (user.publicMetadata?.role || user.unsafeMetadata?.role) as UserRole | undefined;
      if (clerkRole && (clerkRole === 'employee' || clerkRole === 'hr' || clerkRole === 'ceo')) {
        setActiveRole(clerkRole);
      }
    }
  }, [user]);

  const switchRoleForDemo = (newRole: UserRole) => {
    setActiveRole(newRole);
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEMO_ROLE_KEY, newRole);
    }
  };

  const permissions = useMemo(() => {
    return ROLE_PERMISSIONS[activeRole] || [];
  }, [activeRole]);

  const value: AuthRoleContextType = {
    role: activeRole,
    permissions,
    hasPermission: (permission: Permission) => checkPermission(activeRole, permission),
    hasAnyPermission: (perms: Permission[]) => checkAnyPermission(activeRole, perms),
    hasAllPermissions: (perms: Permission[]) => checkAllPermissions(activeRole, perms),
    hasRole: (allowedRoles: UserRole | UserRole[]) => checkRole(activeRole, allowedRoles),
    canAccessRoute: (pathname: string) => isRouteAllowed(activeRole, pathname),
    switchRoleForDemo,
    defaultPath: getRoleDefaultPath(activeRole),
    isLoaded: isLoaded && mounted,
    isSignedIn: Boolean(isSignedIn),
  };

  return <AuthRoleContext.Provider value={value}>{children}</AuthRoleContext.Provider>;
}

export function useAuthRole(): AuthRoleContextType {
  const context = useContext(AuthRoleContext);
  if (!context) {
    throw new Error('useAuthRole must be used within an AuthRoleProvider');
  }
  return context;
}
`,
  'utf8'
);

console.log('Created lib/auth/useAuthRole.tsx');
