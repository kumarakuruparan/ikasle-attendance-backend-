const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. Update hr/dashboard/page.tsx
const hrDashboardPath = path.join(frontendDir, 'app/(dashboard)/hr/dashboard/page.tsx');
const hrDashboardContent = `"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  UserCheck,
  UserX,
  CalendarCheck,
  Clock,
  HeartPulse,
  TrendingUp,
  FolderKanban,
  FileSpreadsheet,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import AttendanceChart from "@/components/reports/AttendanceChart";
import ProductivityChart from "@/components/reports/ProductivityChart";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { useEmployees } from "@/hooks/useEmployees";

export default function HRDashboard() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();
  const { data: empData, isLoading: isLoadingEmps } = useEmployees({ limit: 5 });
  const recentEmployees = empData?.data || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="People & HR Operations Dashboard"
        subtitle="Workforce headcount, active presence, departmental structure, and operational oversight."
        badge="HR Management"
      />

      {/* Headcount, Department & Employee State KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <Link href="/hr/employees">
          <Card className="p-5 hover:border-blue-400 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Total Employees</span>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-3xl font-black text-slate-900 dark:text-white mt-1.5">
              {isLoadingStats ? "..." : (stats?.totalEmployees ?? 0)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-blue-600 font-medium">
              <span>View Directory</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* Active Employees */}
        <Link href="/hr/employees">
          <Card className="p-5 hover:border-emerald-400 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Active Employees</span>
              <UserCheck className="h-4 w-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-1.5">
              {isLoadingStats ? "..." : (stats?.activeEmployees ?? 0)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-emerald-600 font-medium">
              <span>Authorized Access</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* Inactive Employees */}
        <Link href="/hr/employees">
          <Card className="p-5 hover:border-red-400 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Inactive Accounts</span>
              <UserX className="h-4 w-4 text-rose-500" />
            </div>
            <div className="text-3xl font-black text-rose-600 mt-1.5">
              {isLoadingStats ? "..." : (stats?.inactiveEmployees ?? 0)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-rose-600 font-medium">
              <span>Deactivated / Offboarded</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>

        {/* Department Count */}
        <Link href="/hr/departments">
          <Card className="p-5 hover:border-purple-400 transition-colors">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              <span>Departments</span>
              <Building2 className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-3xl font-black text-purple-600 mt-1.5">
              {isLoadingStats ? "..." : (stats?.departmentCount ?? 0)}
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-purple-600 font-medium">
              <span>Manage Departments</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </Card>
        </Link>
      </div>

      {/* Analytics Visualizations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <ProductivityChart />
      </div>

      {/* Department Breakdown Overview */}
      {stats && stats.departmentOverview.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Department Headcount Distribution</CardTitle>
                <CardDescription>Live headcount and allocation by operational business unit</CardDescription>
              </div>
              <Link
                href="/hr/departments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>All Departments</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {stats.departmentOverview.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span className="truncate">{dept.name}</span>
                    <span className="text-blue-600 dark:text-blue-400">{dept.employeeCount}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 mt-2.5">
                    <div
                      className="h-full rounded-full bg-blue-600"
                      style={{
                        width: stats.totalEmployees > 0 ? \`\${(dept.employeeCount / stats.totalEmployees) * 100}%\` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    {stats.totalEmployees > 0
                      ? \`\${Math.round((dept.employeeCount / stats.totalEmployees) * 100)}% of total team\`
                      : "0%"}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Employee Roster Snapshot */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Workforce Members</CardTitle>
              <CardDescription>Live employee records from company database</CardDescription>
            </div>
            <Link
              href="/hr/employees"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>View Full Directory</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5FAFF] border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Employee</th>
                  <th className="py-2.5 px-3 font-semibold">ID</th>
                  <th className="py-2.5 px-3 font-semibold">Department</th>
                  <th className="py-2.5 px-3 font-semibold">Job Title</th>
                  <th className="py-2.5 px-3 font-semibold">Role</th>
                  <th className="py-2.5 px-3 font-semibold">Status</th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 bg-white dark:bg-slate-900/60">
                {isLoadingEmps ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      Loading employee directory...
                    </td>
                  </tr>
                ) : recentEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      No employees found in the database.
                    </td>
                  </tr>
                ) : (
                  recentEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-[#F5FAFF]/50 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                        <Link href={\`/hr/employees/\${emp.id}\`} className="hover:text-blue-600">
                          {emp.fullName}
                        </Link>
                      </td>
                      <td className="py-3 px-3 font-mono text-blue-600 font-bold">{emp.employeeId}</td>
                      <td className="py-3 px-3 text-slate-500 dark:text-slate-400">{emp.departmentName || "Unassigned"}</td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{emp.jobTitle || "-"}</td>
                      <td className="py-3 px-3 uppercase text-[11px] font-semibold text-slate-500">{emp.role}</td>
                      <td className="py-3 px-3">
                        <Badge variant={emp.isActive ? "success" : "destructive"}>
                          {emp.employmentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <Link
                          href={\`/hr/employees/\${emp.id}\`}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          View Profile
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync(hrDashboardPath, hrDashboardContent, 'utf8');
console.log('1. Updated hr/dashboard/page.tsx');

// 2. Update ceo/dashboard/page.tsx
const ceoDashboardPath = path.join(frontendDir, 'app/(dashboard)/ceo/dashboard/page.tsx');
const ceoDashboardContent = `"use client";

import React from "react";
import Link from "next/link";
import {
  Users,
  Building2,
  TrendingUp,
  FolderKanban,
  CheckCircle,
  AlertTriangle,
  Clock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import AttendanceChart from "@/components/reports/AttendanceChart";
import ProductivityChart from "@/components/reports/ProductivityChart";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export default function CEODashboard() {
  const { data: stats, isLoading: isLoadingStats } = useDashboardStats();

  return (
    <div className="space-y-6">
      <PageHeader
        title="CEO Strategic Cockpit"
        subtitle="Executive business intelligence: real-time headcount, departmental composition, and operational efficiency."
        badge="Executive Overview"
      />

      {/* Strategic KPI Grid: Real employee data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Employees */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Total Workforce</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white">
            {isLoadingStats ? "..." : (stats?.totalEmployees ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Total registered corporate headcount</p>
        </Card>

        {/* Active Employees */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Active Team Members</span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600">
            {isLoadingStats ? "..." : (stats?.activeEmployees ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Authorized & actively participating</p>
        </Card>

        {/* Department Count */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Operational Departments</span>
            <Building2 className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600">
            {isLoadingStats ? "..." : (stats?.departmentCount ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Active functional divisions</p>
        </Card>

        {/* Inactive Headcount */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium mb-1">
            <span>Inactive / On Leave</span>
            <Clock className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-500">
            {isLoadingStats ? "..." : (stats?.inactiveEmployees ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Deactivated accounts</p>
        </Card>
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart />
        <ProductivityChart />
      </div>

      {/* Real Department Headcount Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Department Overview & Capacity</CardTitle>
              <CardDescription>Live workforce distribution across company divisions</CardDescription>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Live Database
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {!stats || stats.departmentOverview.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No department data available.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.departmentOverview.map((dept) => (
                <div
                  key={dept.id}
                  className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                    <span className="truncate">{dept.name}</span>
                    <span className="font-mono text-blue-600 dark:text-blue-400">
                      {dept.employeeCount} {dept.employeeCount === 1 ? "member" : "members"}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800 mt-2.5">
                    <div
                      className="h-full rounded-full bg-indigo-600"
                      style={{
                        width: stats.totalEmployees > 0 ? \`\${(dept.employeeCount / stats.totalEmployees) * 100}%\` : "0%",
                      }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1.5 block">
                    {stats.totalEmployees > 0
                      ? \`\${Math.round((dept.employeeCount / stats.totalEmployees) * 100)}% of total company headcount\`
                      : "0%"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;

fs.writeFileSync(ceoDashboardPath, ceoDashboardContent, 'utf8');
console.log('2. Updated ceo/dashboard/page.tsx');

// 3. Update employee/dashboard/page.tsx
const empDashboardPath = path.join(frontendDir, 'app/(dashboard)/employee/dashboard/page.tsx');
let empContent = fs.readFileSync(empDashboardPath, 'utf8');

// Replace mock fallback with useSelfProfile
empContent = empContent.replace(
  'import { employeeService, Employee } from "@/services/employee.service";',
  'import { useSelfProfile } from "@/hooks/useSelfProfile";'
);

const oldProfileFetch = `  const [profile, setProfile] = useState<Employee | null>(null);

  useEffect(() => {
    employeeService
      .getSelfProfile()
      .then(setProfile)
      .catch((err) => console.error("Could not load self profile on dashboard:", err));
  }, []);`;

const newProfileHook = `  const { data: profile } = useSelfProfile();`;

if (empContent.includes(oldProfileFetch)) {
  empContent = empContent.replace(oldProfileFetch, newProfileHook);
}

const oldFallback = `  const fallbackUser = MOCK_USERS.employee;
  const displayName = profile ? profile.fullName : fallbackUser.name;
  const firstName = profile ? profile.firstName : fallbackUser.name.split(" ")[0];
  const employeeId = profile ? profile.employeeId : fallbackUser.employeeId;
  const departmentName = profile ? (profile.departmentName || "Unassigned") : fallbackUser.department;
  const jobTitle = profile ? (profile.jobTitle || "Team Member") : fallbackUser.designation;
  const status = profile ? profile.employmentStatus : "ACTIVE";`;

const newFallback = `  const displayName = profile ? profile.fullName : "Team Member";
  const firstName = profile ? profile.firstName : "Member";
  const employeeId = profile ? profile.employeeId : "---";
  const departmentName = profile ? (profile.departmentName || "Unassigned") : "Unassigned";
  const jobTitle = profile ? (profile.jobTitle || "Employee") : "Employee";
  const status = profile ? profile.employmentStatus : "ACTIVE";`;

if (empContent.includes(oldFallback)) {
  empContent = empContent.replace(oldFallback, newFallback);
}

fs.writeFileSync(empDashboardPath, empContent, 'utf8');
console.log('3. Updated employee/dashboard/page.tsx');
