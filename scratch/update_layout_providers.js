const fs = require('fs');
const path = require('path');

const frontendRoot = path.resolve(__dirname, '../../frontend');

// 1. Update app/layout.tsx to include AuthRoleProvider
const rootLayoutPath = path.join(frontendRoot, 'app', 'layout.tsx');
let rootLayoutContent = fs.readFileSync(rootLayoutPath, 'utf8');

if (!rootLayoutContent.includes('AuthRoleProvider')) {
  rootLayoutContent = `import { AuthRoleProvider } from "@/lib/auth/useAuthRole";\n` + rootLayoutContent;
  rootLayoutContent = rootLayoutContent.replace(
    '<QueryProvider>{children}</QueryProvider>',
    '<QueryProvider><AuthRoleProvider>{children}</AuthRoleProvider></QueryProvider>'
  );
  fs.writeFileSync(rootLayoutPath, rootLayoutContent, 'utf8');
  console.log('Updated app/layout.tsx with AuthRoleProvider');
}

// 2. Update app/(dashboard)/layout.tsx to enforce route protection
const dashLayoutPath = path.join(frontendRoot, 'app', '(dashboard)', 'layout.tsx');
fs.writeFileSync(
  dashLayoutPath,
`'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthRole } from '@/lib/auth/useAuthRole';
import { isRouteAllowed } from '@/lib/auth/access';
import UnauthorizedState from '@/components/auth/UnauthorizedState';
import { UserRole } from '@/types/auth';

export default function AppDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, isLoaded } = useAuthRole();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verifying Permissions...</p>
        </div>
      </div>
    );
  }

  // Determine required role based on URL segment
  let requiredRole: UserRole | undefined;
  if (pathname.startsWith('/hr')) {
    requiredRole = 'hr';
  } else if (pathname.startsWith('/ceo')) {
    requiredRole = 'ceo';
  } else if (pathname.startsWith('/employee')) {
    requiredRole = 'employee';
  }

  const allowed = isRouteAllowed(role, pathname);

  return (
    <DashboardLayout role={role}>
      {!allowed ? (
        <UnauthorizedState
          title="Restricted Portal Route (403)"
          message="You do not have the required role privileges to access this area of the enterprise management suite."
          requiredRole={requiredRole}
        />
      ) : (
        children
      )}
    </DashboardLayout>
  );
}
`,
  'utf8'
);
console.log('Updated app/(dashboard)/layout.tsx with route protection');

// 3. Update components/layout/TopNavbar.tsx
const topNavbarPath = path.join(frontendRoot, 'components', 'layout', 'TopNavbar.tsx');
fs.writeFileSync(
  topNavbarPath,
`'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Bell, Shield, User, Briefcase, Crown, Check } from 'lucide-react';
import { UserButton } from '@clerk/nextjs';
import { cn } from '@/lib/utils';
import { useAuthRole } from '@/lib/auth/useAuthRole';
import { ROLE_METADATA } from '@/lib/auth/roles';
import { UserRole } from '@/types/auth';

interface TopNavbarProps {
  currentRole: UserRole;
  onToggleMobileMenu: () => void;
}

export default function TopNavbar({ currentRole, onToggleMobileMenu }: TopNavbarProps) {
  const router = useRouter();
  const { role, switchRoleForDemo } = useAuthRole();

  const roleConfigs = [
    { id: 'employee' as UserRole, label: 'Employee', icon: User, path: '/employee/dashboard' },
    { id: 'hr' as UserRole, label: 'HR Manager', icon: Briefcase, path: '/hr/dashboard' },
    { id: 'ceo' as UserRole, label: 'CEO Cockpit', icon: Crown, path: '/ceo/dashboard' },
  ];

  const handleRoleSwitch = (targetRole: UserRole, targetPath: string) => {
    switchRoleForDemo(targetRole);
    router.push(targetPath);
  };

  const currentMeta = ROLE_METADATA[role] || ROLE_METADATA.employee;

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 sm:px-6 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/80">
      <div className="flex items-center gap-3">
        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="inline-flex items-center justify-center rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden dark:text-slate-300 dark:hover:bg-slate-800"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Active Role Indicator & Live Role Switcher */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 flex items-center gap-1">
              <Shield className="h-3 w-3 text-blue-500" />
              Role:
            </span>
            {roleConfigs.map((r) => {
              const isActive = role === r.id;
              const Icon = r.icon;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleRoleSwitch(r.id, r.path)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer',
                    isActive
                      ? 'bg-white text-blue-600 shadow-sm dark:bg-slate-800 dark:text-blue-400'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  <span>{r.label}</span>
                  {isActive && <Check className="h-3 w-3 text-blue-600 dark:text-blue-400" />}
                </button>
              );
            })}
          </div>

          {/* Role badge on smaller devices */}
          <span className="sm:hidden rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300 capitalize">
            {role}
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <button
          type="button"
          onClick={() => alert(\`Role: \${currentMeta.badge} - Notifications operational\`)}
          className="relative rounded-xl border border-slate-200/80 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white dark:ring-slate-950" />
        </button>

        {/* Clerk User Button */}
        <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-800">
          <UserButton
            appearance={{
              elements: {
                userButtonAvatarBox: 'h-9 w-9 ring-2 ring-blue-500/20',
              },
            }}
          />
        </div>
      </div>
    </header>
  );
}
`,
  'utf8'
);
console.log('Updated components/layout/TopNavbar.tsx');

// 4. Update components/layout/Sidebar.tsx with role-aware and permission-filtered navigation
const sidebarPath = path.join(frontendRoot, 'components', 'layout', 'Sidebar.tsx');
fs.writeFileSync(
  sidebarPath,
`'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  FolderKanban,
  CheckSquare,
  FileSpreadsheet,
  CalendarDays,
  Clock,
  UserCheck,
  Users,
  Settings,
  TrendingUp,
  BarChart4,
  Layers,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthRole } from '@/lib/auth/useAuthRole';
import { ROLE_METADATA } from '@/lib/auth/roles';
import { NavigationItem, UserRole } from '@/types/auth';

interface SidebarProps {
  role?: UserRole;
  isOpen: boolean;
  onCloseMobile: () => void;
}

export default function Sidebar({ isOpen, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { role, hasPermission, hasRole } = useAuthRole();

  // Centralized Navigation Catalog with permission & role requirements
  const allNavItems: (NavigationItem & { portal: UserRole })[] = [
    // Employee Portal Links
    {
      portal: 'employee',
      label: 'Dashboard',
      href: '/employee/dashboard',
      icon: LayoutDashboard,
      requiredRoles: ['employee', 'hr'],
    },
    {
      portal: 'employee',
      label: 'Attendance',
      href: '/employee/attendance',
      icon: CalendarCheck,
      requiredRoles: ['employee', 'hr'],
      requiredPermissions: ['attendance.view.own'],
    },
    {
      portal: 'employee',
      label: 'Projects',
      href: '/employee/projects',
      icon: FolderKanban,
      requiredRoles: ['employee', 'hr'],
      requiredPermissions: ['projects.view'],
    },
    {
      portal: 'employee',
      label: 'Tasks',
      href: '/employee/tasks',
      icon: CheckSquare,
      requiredRoles: ['employee', 'hr'],
      requiredPermissions: ['tasks.view'],
    },
    {
      portal: 'employee',
      label: 'Daily Reports',
      href: '/employee/work-reports',
      icon: FileSpreadsheet,
      requiredRoles: ['employee', 'hr'],
      requiredPermissions: ['workReports.view.own'],
    },
    {
      portal: 'employee',
      label: 'Leave',
      href: '/employee/leave',
      icon: CalendarDays,
      requiredRoles: ['employee', 'hr'],
      requiredPermissions: ['leave.apply'],
    },
    {
      portal: 'employee',
      label: 'Permission',
      href: '/employee/permission',
      icon: Clock,
      requiredRoles: ['employee', 'hr'],
      requiredPermissions: ['permission.apply'],
    },
    {
      portal: 'employee',
      label: 'My Profile',
      href: '/employee/profile',
      icon: UserCheck,
      requiredRoles: ['employee', 'hr'],
    },

    // HR Portal Links
    {
      portal: 'hr',
      label: 'HR Dashboard',
      href: '/hr/dashboard',
      icon: LayoutDashboard,
      requiredRoles: ['hr'],
    },
    {
      portal: 'hr',
      label: 'Employees',
      href: '/hr/employees',
      icon: Users,
      requiredRoles: ['hr'],
      requiredPermissions: ['employees.view'],
    },
    {
      portal: 'hr',
      label: 'Attendance',
      href: '/hr/attendance',
      icon: CalendarCheck,
      requiredRoles: ['hr'],
      requiredPermissions: ['attendance.manage'],
    },
    {
      portal: 'hr',
      label: 'Projects',
      href: '/hr/projects',
      icon: FolderKanban,
      requiredRoles: ['hr'],
      requiredPermissions: ['projects.manage'],
    },
    {
      portal: 'hr',
      label: 'Tasks',
      href: '/hr/tasks',
      icon: CheckSquare,
      requiredRoles: ['hr'],
      requiredPermissions: ['tasks.manage'],
    },
    {
      portal: 'hr',
      label: 'Work Reports',
      href: '/hr/work-reports',
      icon: FileSpreadsheet,
      requiredRoles: ['hr'],
      requiredPermissions: ['workReports.manage'],
    },
    {
      portal: 'hr',
      label: 'Leave Approvals',
      href: '/hr/leave',
      icon: CalendarDays,
      requiredRoles: ['hr'],
      requiredPermissions: ['leave.manage'],
    },
    {
      portal: 'hr',
      label: 'Permissions',
      href: '/hr/permissions',
      icon: Clock,
      requiredRoles: ['hr'],
      requiredPermissions: ['permission.manage'],
    },
    {
      portal: 'hr',
      label: 'Analytics & Reports',
      href: '/hr/reports',
      icon: BarChart4,
      requiredRoles: ['hr'],
      requiredPermissions: ['reports.view.all'],
    },
    {
      portal: 'hr',
      label: 'Settings',
      href: '/hr/settings',
      icon: Settings,
      requiredRoles: ['hr'],
      requiredPermissions: ['settings.manage'],
    },

    // CEO Cockpit Links
    {
      portal: 'ceo',
      label: 'Executive Dashboard',
      href: '/ceo/dashboard',
      icon: LayoutDashboard,
      requiredRoles: ['ceo'],
    },
    {
      portal: 'ceo',
      label: 'Attendance Overview',
      href: '/ceo/attendance',
      icon: CalendarCheck,
      requiredRoles: ['ceo'],
      requiredPermissions: ['attendance.view.all'],
    },
    {
      portal: 'ceo',
      label: 'Projects & Milestones',
      href: '/ceo/projects',
      icon: FolderKanban,
      requiredRoles: ['ceo'],
      requiredPermissions: ['projects.view'],
    },
    {
      portal: 'ceo',
      label: 'Productivity',
      href: '/ceo/productivity',
      icon: TrendingUp,
      requiredRoles: ['ceo'],
      requiredPermissions: ['productivity.view'],
    },
    {
      portal: 'ceo',
      label: 'Executive Reports',
      href: '/ceo/reports',
      icon: BarChart4,
      requiredRoles: ['ceo'],
      requiredPermissions: ['reports.executive'],
    },
  ];

  // Dynamic Filtering:
  // 1. Only show navigation links belonging to the user's current portal role
  // 2. Verify any fine-grained requiredPermissions
  const authorizedNavItems = allNavItems.filter((item) => {
    // Portal role match
    if (item.portal !== role) return false;

    // Check specific requiredRoles if defined
    if (item.requiredRoles && !hasRole(item.requiredRoles)) {
      return false;
    }

    // Check fine-grained permissions if defined
    if (item.requiredPermissions && item.requiredPermissions.length > 0) {
      return item.requiredPermissions.every((perm) => hasPermission(perm));
    }

    return true;
  });

  const roleMeta = ROLE_METADATA[role] || ROLE_METADATA.employee;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={cn(
          'fixed top-0 bottom-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200/80 bg-white/95 backdrop-blur-md transition-transform duration-300 dark:border-slate-800/80 dark:bg-slate-950/95 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center gap-3 border-b border-slate-100 px-6 dark:border-slate-800">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                IKASLE
              </span>
              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Enterprise Workplace</p>
          </div>
        </div>

        {/* Role Tag */}
        <div className="px-6 py-3 border-b border-slate-100/60 dark:border-slate-850">
          <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            <span>Portal</span>
            <span className="rounded-full bg-blue-50 px-2 py-0.5 font-bold text-blue-700 border border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900/50">
              {roleMeta.badge}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 truncate">{roleMeta.description}</p>
        </div>

        {/* Authorized Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
          {authorizedNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onCloseMobile}
                className={cn(
                  'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/80 dark:hover:text-white'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-slate-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Sidebar Footer Link to Public Portal */}
        <div className="border-t border-slate-100 p-4 dark:border-slate-800">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white py-2 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
          >
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <span>IKASLE Public Home</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
`,
  'utf8'
);
console.log('Updated components/layout/Sidebar.tsx with role-filtered navigation');
