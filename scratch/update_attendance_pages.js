const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. employee/attendance/page.tsx
const empAttendancePath = path.join(frontendDir, 'app/(dashboard)/employee/attendance/page.tsx');
const empAttendanceContent = `"use client";

import React, { useState } from "react";
import { CheckCircle2, RotateCw, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardLayout";
import AttendanceCard from "@/components/attendance/AttendanceCard";
import BreakCard from "@/components/attendance/BreakCard";
import AttendanceHistory from "@/components/attendance/AttendanceHistory";
import { WorkingHoursCard } from "@/components/attendance/WorkingHoursCard";
import {
  useTodayAttendance,
  useCheckIn,
  useCheckOut,
  useStartBreak,
  useEndBreak,
} from "@/hooks/useAttendance";
import { BreakType } from "@/services/attendance.service";

export default function EmployeeAttendancePage() {
  const { data, isLoading, isError, error, refetch } = useTodayAttendance();
  const checkInMutation = useCheckIn();
  const checkOutMutation = useCheckOut();
  const startBreakMutation = useStartBreak();
  const endBreakMutation = useEndBreak();

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCheckIn = async (coords: { latitude: number; longitude: number; accuracy: number }) => {
    const record = await checkInMutation.mutateAsync(coords);
    showNotification(
      \`Checked in successfully at \${new Date(record.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}. Office geofence verified.\`
    );
    return record;
  };

  const handleCheckOut = async (coords: { latitude: number; longitude: number; accuracy: number }) => {
    const record = await checkOutMutation.mutateAsync(coords);
    const hrs = (record.totalWorkingMinutes / 60).toFixed(1);
    showNotification(
      \`Checked out successfully. Total working time: \${hrs} hours. Have a great evening!\`
    );
    return record;
  };

  const handleStartBreak = async (type: BreakType) => {
    const res = await startBreakMutation.mutateAsync(type);
    showNotification(\`\${type} break session started.\`);
    return res;
  };

  const handleEndBreak = async () => {
    const res = await endBreakMutation.mutateAsync();
    showNotification(\`Break ended. Duration: \${res.break.durationMinutes} minutes.\`);
    return res;
  };

  const attendance = data?.attendance || null;
  const activeBreak = data?.activeBreak || null;
  const officeSettings = data?.officeSettings || {
    officeStartTime: "09:30",
    officeEndTime: "19:00",
    officeRadiusMeters: 300,
    maxAccuracyThresholdMeters: 150,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance & Time Tracking"
        subtitle="Manage daily GPS clock-ins, break compliance, office geofence verification, and work logs."
        badge="Self-Service"
      />

      {/* Action Notification */}
      {notification && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
          <div className="lg:col-span-7 h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="lg:col-span-5 h-80 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800 dark:border-rose-900/40 dark:bg-rose-950/40 dark:text-rose-300 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-rose-600" />
            <span>{error instanceof Error ? error.message : "Failed to load today's attendance state."}</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="font-semibold underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Interactive Attendance & Break Panels */}
      {!isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 space-y-6">
            <AttendanceCard
              attendance={attendance}
              activeBreak={activeBreak}
              officeSettings={officeSettings}
              onCheckIn={handleCheckIn}
              onCheckOut={handleCheckOut}
              isCheckingIn={checkInMutation.isPending}
              isCheckingOut={checkOutMutation.isPending}
            />

            <WorkingHoursCard attendance={attendance} />
          </div>

          <div className="lg:col-span-5">
            <BreakCard
              attendance={attendance}
              activeBreak={activeBreak}
              onStartBreak={handleStartBreak}
              onEndBreak={handleEndBreak}
              isStarting={startBreakMutation.isPending}
              isEnding={endBreakMutation.isPending}
            />
          </div>
        </div>
      )}

      {/* Historical Logs */}
      <AttendanceHistory />
    </div>
  );
}
`;
fs.writeFileSync(empAttendancePath, empAttendanceContent, 'utf8');
console.log('1. Updated employee/attendance/page.tsx');

// 2. hr/attendance/page.tsx
const hrAttendancePath = path.join(frontendDir, 'app/(dashboard)/hr/attendance/page.tsx');
const hrAttendanceContent = `"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarCheck,
  Search,
  Download,
  Users,
  CheckCircle2,
  Clock,
  RotateCw,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAllAttendance, useAttendanceStats } from "@/hooks/useAttendance";
import { useDepartments } from "@/hooks/useDepartments";
import { AttendanceStatus } from "@/services/attendance.service";

export default function HRAttendancePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [page, setPage] = useState(1);

  // Queries
  const { data: deptData } = useDepartments();
  const departments = deptData || [];

  const { data: statsData, isLoading: isLoadingStats } = useAttendanceStats(selectedDate || undefined);

  const {
    data: attendanceData,
    isLoading,
    isError,
    error,
    refetch,
  } = useAllAttendance({
    search: searchTerm || undefined,
    departmentId: selectedDept !== "all" ? selectedDept : undefined,
    status: selectedStatus !== "all" ? (selectedStatus as AttendanceStatus) : undefined,
    date: selectedDate || undefined,
    page,
    limit: 15,
  });

  const records = attendanceData?.records || [];
  const pagination = attendanceData?.pagination;

  const handleExportCSV = () => {
    if (records.length === 0) {
      alert("No attendance records to export.");
      return;
    }

    const headers = ["Employee ID", "Full Name", "Department", "Date", "Clock In", "Clock Out", "Break Minutes", "Working Minutes", "Status"];
    const rows = records.map((r) => [
      r.user?.employeeId || "",
      r.user?.fullName || "",
      r.user?.departmentName || "Unassigned",
      new Date(r.date).toISOString().split("T")[0],
      new Date(r.checkInAt).toLocaleTimeString(),
      r.checkOutAt ? new Date(r.checkOutAt).toLocaleTimeString() : "Active",
      r.totalBreakMinutes,
      r.totalWorkingMinutes,
      r.status,
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.map((cell) => \`"\${cell}"\`).join(","))].join("\\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", \`ikasle_attendance_\${selectedDate || "today"}.csv\`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Attendance Oversight"
        subtitle="Real-time attendance roster across all corporate divisions, clock-in compliance, and working hour summaries."
        action={
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1.5" />
            Export CSV
          </Button>
        }
      />

      {/* Attendance KPI Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total Headcount</span>
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {isLoadingStats ? "..." : statsData?.totalEmployees ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Registered active workforce</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Present Today</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {isLoadingStats ? "..." : statsData?.presentCount ?? 0}
          </div>
          <span className="text-[11px] text-emerald-600/80 font-medium">
            {statsData?.activeCount ?? 0} actively on premises
          </span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Absent / Unaccounted</span>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {isLoadingStats ? "..." : statsData?.absentCount ?? 0}
          </div>
          <span className="text-[11px] text-slate-400">Not recorded on geofence</span>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Avg Shift Duration</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-purple-600 mt-1">
            {isLoadingStats ? "..." : \`\${statsData?.avgWorkingHours ?? "0.0"} hrs\`}
          </div>
          <span className="text-[11px] text-slate-400">Completed shifts today</span>
        </Card>
      </div>

      {/* Filter Controls Bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name, ID, email..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDept}
                onChange={(e) => {
                  setSelectedDept(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              >
                <option value="all">All Statuses</option>
                <option value="PRESENT">PRESENT (Active)</option>
                <option value="COMPLETED">COMPLETED (Shift Ended)</option>
                <option value="INCOMPLETE">INCOMPLETE</option>
                <option value="ABSENT">ABSENT</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setPage(1);
                }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 px-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Attendance Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Attendance Records</CardTitle>
            <span className="text-xs text-slate-400 font-mono">
              Total matched: {pagination?.total ?? 0}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="py-16 text-center text-xs text-slate-400 animate-pulse">
              Loading employee attendance data from server...
            </div>
          )}

          {isError && (
            <div className="py-12 text-center text-xs text-rose-500">
              {error instanceof Error ? error.message : "Unable to load attendance records."}
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RotateCw className="h-3.5 w-3.5 mr-1" />
                  Retry
                </Button>
              </div>
            </div>
          )}

          {!isLoading && !isError && records.length === 0 && (
            <div className="py-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <CalendarCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                No attendance records found
              </h3>
              <p className="mt-1 text-xs text-slate-500">
                {searchTerm || selectedDept !== "all" || selectedStatus !== "all" || selectedDate
                  ? "Try adjusting your filters or date range."
                  : "No check-ins have been recorded yet."}
              </p>
            </div>
          )}

          {!isLoading && !isError && records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Employee</th>
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold">Clock In</th>
                    <th className="pb-3 font-semibold">Clock Out</th>
                    <th className="pb-3 font-semibold">Break Duration</th>
                    <th className="pb-3 font-semibold">Effective Hours</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((rec) => (
                    <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors">
                      <td className="py-3">
                        <Link
                          href={\`/hr/employees/\${rec.user?.id || rec.userId}\`}
                          className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                        >
                          {rec.user?.fullName || "Employee"}
                        </Link>
                        <p className="text-[11px] text-slate-400">{rec.user?.email}</p>
                      </td>
                      <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {rec.user?.employeeId || "---"}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {rec.user?.departmentName || "Unassigned"}
                      </td>
                      <td className="py-3 text-slate-500">
                        {new Date(rec.date).toLocaleDateString([], {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {new Date(rec.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 font-mono text-slate-700 dark:text-slate-300 font-medium">
                        {rec.checkOutAt
                          ? new Date(rec.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Active"}
                      </td>
                      <td className="py-3 font-mono text-slate-500">
                        {rec.totalBreakMinutes} min
                      </td>
                      <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {(rec.totalWorkingMinutes / 60).toFixed(1)} hrs
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant={
                            rec.status === "COMPLETED"
                              ? "success"
                              : rec.status === "PRESENT"
                              ? "info"
                              : "destructive"
                          }
                        >
                          {rec.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <span className="text-slate-400">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= pagination.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;
fs.writeFileSync(hrAttendancePath, hrAttendanceContent, 'utf8');
console.log('2. Updated hr/attendance/page.tsx');

// 3. ceo/attendance/page.tsx
const ceoAttendancePath = path.join(frontendDir, 'app/(dashboard)/ceo/attendance/page.tsx');
const ceoAttendanceContent = `"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAttendanceStats, useAllAttendance } from "@/hooks/useAttendance";

export default function CEOAttendancePage() {
  const [selectedDate, setSelectedDate] = useState("");
  const { data: stats, isLoading: isLoadingStats } = useAttendanceStats(selectedDate || undefined);
  const { data: attendanceData, isLoading: isLoadingList } = useAllAttendance({
    date: selectedDate || undefined,
    limit: 10,
  });

  const records = attendanceData?.records || [];

  const totalEmployees = stats?.totalEmployees ?? 0;
  const presentCount = stats?.presentCount ?? 0;
  const attendanceRate = totalEmployees > 0 ? Math.round((presentCount / totalEmployees) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Attendance Overview"
        subtitle="Corporate workforce presence, geofence compliance rate, and executive working hour aggregates."
        badge="Executive View"
      />

      {/* Date selector */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">
          Viewing Attendance for: {selectedDate ? new Date(selectedDate).toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" }) : "Today (Live)"}
        </span>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white py-1 px-2.5 text-xs dark:border-slate-700 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
        />
      </div>

      {/* High-Level Executive KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Attendance Rate */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Corporate Attendance Rate</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-3xl font-black text-blue-600 mt-2 font-mono">
            {isLoadingStats ? "..." : \`\${attendanceRate}%\`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {presentCount} Present / {totalEmployees} Total
          </p>
        </Card>

        {/* Present Today */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Active on Premises</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2 font-mono">
            {isLoadingStats ? "..." : stats?.activeCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.completedCount ?? 0} shifts completed
          </p>
        </Card>

        {/* Absent */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Unrecorded / Absent</span>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600 mt-2 font-mono">
            {isLoadingStats ? "..." : stats?.absentCount ?? 0}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Did not clock in via geofence
          </p>
        </Card>

        {/* Average Working Hours */}
        <Card className="p-5">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Average Working Time</span>
            <Clock className="h-4 w-4 text-purple-600" />
          </div>
          <div className="text-3xl font-black text-purple-600 mt-2 font-mono">
            {isLoadingStats ? "..." : \`\${stats?.avgWorkingHours ?? "0.0"} hrs\`}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Per completed shift</p>
        </Card>
      </div>

      {/* Live Presence Table for Executive */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Presence Snapshot</CardTitle>
              <CardDescription>Verified employee attendance records from corporate geofence</CardDescription>
            </div>
            <Link
              href="/hr/attendance"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View Full HR Log</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingList && (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading executive presence feed...
            </div>
          )}

          {!isLoadingList && records.length === 0 && (
            <div className="py-12 text-center text-xs text-slate-400">
              No presence records logged for this date.
            </div>
          )}

          {!isLoadingList && records.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Employee</th>
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">Department</th>
                    <th className="pb-3 font-semibold">Clock In</th>
                    <th className="pb-3 font-semibold">Clock Out</th>
                    <th className="pb-3 font-semibold">Effective Time</th>
                    <th className="pb-3 font-semibold text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-3 font-bold text-slate-900 dark:text-white">
                        {r.user?.fullName || "Employee"}
                      </td>
                      <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {r.user?.employeeId || "---"}
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-300">
                        {r.user?.departmentName || "Unassigned"}
                      </td>
                      <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                        {new Date(r.checkInAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className="py-3 font-mono text-slate-700 dark:text-slate-300">
                        {r.checkOutAt
                          ? new Date(r.checkOutAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                          : "Active"}
                      </td>
                      <td className="py-3 font-mono font-bold text-blue-600">
                        {(r.totalWorkingMinutes / 60).toFixed(1)} hrs
                      </td>
                      <td className="py-3 text-right">
                        <Badge
                          variant={
                            r.status === "COMPLETED"
                              ? "success"
                              : r.status === "PRESENT"
                              ? "info"
                              : "destructive"
                          }
                        >
                          {r.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
`;
fs.writeFileSync(ceoAttendancePath, ceoAttendanceContent, 'utf8');
console.log('3. Updated ceo/attendance/page.tsx');
