const fs = require('fs');
const path = require('path');

const frontendDir = path.resolve(__dirname, '../../frontend');

// 1. Update hr/employees/[id]/page.tsx
const employeeDetailsPath = path.join(frontendDir, 'app/(dashboard)/hr/employees/[id]/page.tsx');
const employeeDetailsContent = `"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Mail,
  Building2,
  Calendar,
  Briefcase,
  Shield,
  Clock,
  FolderKanban,
  CheckSquare,
  FileSpreadsheet,
  CalendarDays,
  Edit,
  Power,
  AlertCircle,
  RotateCw,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Tabs } from "@/components/ui/Tabs";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { EmployeeModal } from "@/components/employees/EmployeeModal";
import {
  useEmployee,
  useUpdateEmployee,
  useUpdateEmployeeStatus,
} from "@/hooks/useEmployee";
import { useDepartments } from "@/hooks/useDepartments";
import { UpdateEmployeeInput } from "@/services/employee.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EmployeeDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  // TanStack Query for server state
  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
  } = useEmployee(resolvedParams.id);

  const { data: deptData } = useDepartments();
  const departments = deptData?.data || [];

  const updateEmployeeMutation = useUpdateEmployee();
  const updateStatusMutation = useUpdateEmployeeStatus();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleEditSubmit = async (data: UpdateEmployeeInput) => {
    if (!employee) throw new Error("Employee not found");
    const updated = await updateEmployeeMutation.mutateAsync({
      id: employee.id,
      data,
    });
    showNotification(\`Employee \${updated.employeeId} updated successfully\`);
    return updated;
  };

  const handleStatusToggle = async () => {
    if (!employee) return;
    try {
      const nextActive = !employee.isActive;
      const updated = await updateStatusMutation.mutateAsync({
        id: employee.id,
        statusData: {
          isActive: nextActive,
          employmentStatus: nextActive ? "ACTIVE" : "INACTIVE",
        },
      });
      showNotification(
        \`Employee \${updated.employeeId} status set to \${updated.employmentStatus}\`
      );
      setIsStatusDialogOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to change status");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError || !employee) {
    const errorMsg =
      error instanceof Error ? error.message : "The requested employee record does not exist.";
    return (
      <div className="py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Employee Not Found
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{errorMsg}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/hr/employees")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Directory
          </Button>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            <RotateCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview & Profile" },
    { id: "attendance", label: "Attendance" },
    { id: "projects", label: "Projects & Tasks" },
    { id: "reports", label: "Work Reports" },
    { id: "leave", label: "Leave & Permissions" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/hr/employees"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Employee Directory
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit Profile
          </Button>
          <Button
            variant={employee.isActive ? "destructive" : "primary"}
            size="sm"
            onClick={() => setIsStatusDialogOpen(true)}
          >
            <Power className="h-3.5 w-3.5 mr-1.5" />
            {employee.isActive ? "Deactivate Account" : "Reactivate Account"}
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Profile Hero Card */}
      <Card className="overflow-hidden border-blue-100 dark:border-slate-800">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-24" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-tr from-blue-700 to-indigo-700 text-2xl font-black text-white shadow-xl dark:border-slate-900">
                {employee.firstName.charAt(0)}
                {employee.lastName.charAt(0)}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {employee.fullName}
                  </h1>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                    {employee.employeeId}
                  </span>
                  <Badge variant={employee.isActive ? "success" : "destructive"}>
                    {employee.employmentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {employee.jobTitle || "Team Member"} • {employee.departmentName || "Unassigned Department"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {employee.role}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs navigation */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab: Overview & Profile */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Employment Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
                Employment Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Employee ID</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{employee.employeeId}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Application Role</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.role}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.departmentName || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Job Title</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.jobTitle || "-"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Employment Status</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.employmentStatus}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Joining Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information & Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Mail className="h-4 w-4 text-blue-500" />
                Contact & Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{employee.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Phone Number</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.phone || "Not provided"}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Clerk Authentication ID</span>
                <span className="font-mono text-[11px] text-slate-500 truncate max-w-[200px]" title={employee.clerkUserId}>
                  {employee.clerkUserId}
                </span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Account Created</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {new Date(employee.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-slate-400">Last Updated</span>
                <span className="text-slate-600 dark:text-slate-400">
                  {new Date(employee.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Attendance (Future Module Placeholder) */}
      {activeTab === "attendance" && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Clock className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Attendance Module</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No attendance records yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Tab: Projects & Tasks (Future Module Placeholder) */}
      {activeTab === "projects" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <FolderKanban className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Assigned Projects</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No projects assigned yet.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <CheckSquare className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Active Tasks</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No active tasks.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tab: Work Reports (Future Module Placeholder) */}
      {activeTab === "reports" && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Daily Work Reports</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No work reports submitted yet.</p>
          </CardContent>
        </Card>
      )}

      {/* Tab: Leave & Permissions (Future Module Placeholder) */}
      {activeTab === "leave" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Leave Requests</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No leave requests yet.</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="py-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">Short Permissions</h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">No permission requests yet.</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Employee Modal */}
      <EmployeeModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {}}
        employeeToEdit={employee}
        departments={departments}
        onSubmitApi={handleEditSubmit}
      />

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onConfirm={handleStatusToggle}
        title={employee.isActive ? "Deactivate Employee" : "Reactivate Employee"}
        message={
          employee.isActive
            ? \`Are you sure you want to deactivate \${employee.fullName} (\${employee.employeeId})? They will immediately lose access to sign in.\`
            : \`Are you sure you want to reactivate \${employee.fullName} (\${employee.employeeId})? This will restore their system access.\`
        }
        confirmText={employee.isActive ? "Deactivate" : "Reactivate"}
        variant={employee.isActive ? "danger" : "primary"}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}
`;

fs.writeFileSync(employeeDetailsPath, employeeDetailsContent, 'utf8');
console.log('1. Updated hr/employees/[id]/page.tsx');

// 2. Update hr/departments/page.tsx
const departmentsPath = path.join(frontendDir, 'app/(dashboard)/hr/departments/page.tsx');
const departmentsContent = `"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Building2,
  Search,
  Plus,
  Edit,
  Power,
  Users,
  CheckCircle,
  AlertCircle,
  RotateCw,
  Eye,
  Briefcase,
  Calendar,
  X,
  UserCheck,
} from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Dialog } from "@/components/ui/Dialog";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { DepartmentModal } from "@/components/departments/DepartmentModal";
import {
  Department,
  CreateDepartmentInput,
  UpdateDepartmentInput,
} from "@/services/department.service";
import {
  useDepartments,
  useCreateDepartment,
  useUpdateDepartment,
  useUpdateDepartmentStatus,
} from "@/hooks/useDepartments";
import { useDepartment } from "@/hooks/useDepartment";

export default function HRDepartmentsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // TanStack Query for departments list
  const {
    data: deptsData,
    isLoading,
    isError,
    error,
    refetch,
  } = useDepartments({ search: searchTerm || undefined });
  const departments = deptsData?.data || [];

  const createDepartmentMutation = useCreateDepartment();
  const updateDepartmentMutation = useUpdateDepartment();
  const updateStatusMutation = useUpdateDepartmentStatus();

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deptToEdit, setDeptToEdit] = useState<Department | null>(null);
  const [statusDialogDept, setStatusDialogDept] = useState<Department | null>(null);

  // Selected Department for Roster Dialog
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null);
  const {
    data: selectedDeptDetail,
    isLoading: isLoadingDetail,
  } = useDepartment(selectedDeptId);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleOpenAdd = () => {
    setDeptToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setDeptToEdit(dept);
    setIsModalOpen(true);
  };

  const handleViewRoster = (dept: Department) => {
    setSelectedDeptId(dept.id);
  };

  const handleModalSubmit = async (data: CreateDepartmentInput | UpdateDepartmentInput) => {
    if (deptToEdit) {
      const updated = await updateDepartmentMutation.mutateAsync({
        id: deptToEdit.id,
        data: data as UpdateDepartmentInput,
      });
      showNotification(\`Department '\${updated.name}' updated successfully\`);
      return updated;
    } else {
      const created = await createDepartmentMutation.mutateAsync(data as CreateDepartmentInput);
      showNotification(\`Department '\${created.name}' created successfully\`);
      return created;
    }
  };

  const handleConfirmStatusToggle = async () => {
    if (!statusDialogDept) return;
    try {
      const nextActive = !statusDialogDept.isActive;
      const updated = await updateStatusMutation.mutateAsync({
        id: statusDialogDept.id,
        isActive: nextActive,
      });
      showNotification(
        \`Department '\${updated.name}' is now \${updated.isActive ? "Active" : "Deactivated"}\`
      );
      setStatusDialogDept(null);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to change department status");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Management"
        subtitle="Organize business units, review headcount allocation, and configure departmental status."
        action={
          <Button variant="primary" onClick={handleOpenAdd}>
            <Plus className="h-4 w-4 mr-1.5" />
            Create Department
          </Button>
        }
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search departments by name, description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-900 dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse p-6">
              <div className="h-6 w-24 rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-4 h-4 w-full rounded bg-slate-200 dark:bg-slate-800" />
              <div className="mt-6 h-8 w-full rounded bg-slate-200 dark:bg-slate-800" />
            </Card>
          ))}
        </div>
      )}

      {/* Error State */}
      {isError && !isLoading && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              Unable to load departments
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {error instanceof Error ? error.message : "Unable to load data. Please try again."}
            </p>
            <div className="mt-4">
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RotateCw className="h-3.5 w-3.5 mr-1" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!isLoading && !isError && departments.length === 0 && (
        <Card>
          <CardContent className="py-16 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
              <Building2 className="h-6 w-6" />
            </div>
            <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
              No departments found
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {searchTerm
                ? "Try searching with a different term."
                : "Create your first department to organize team members."}
            </p>
            {!searchTerm && (
              <div className="mt-4">
                <Button variant="primary" size="sm" onClick={handleOpenAdd}>
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Create First Department
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Departments Grid */}
      {!isLoading && !isError && departments.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map((dept) => (
            <Card
              key={dept.id}
              className="flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-700 transition-colors"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
                        {dept.name}
                      </CardTitle>
                      <span className="text-[11px] text-slate-400 font-mono">
                        ID: {dept.id.slice(0, 8)}...
                      </span>
                    </div>
                  </div>
                  <Badge variant={dept.isActive ? "success" : "destructive"}>
                    {dept.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-xs text-slate-600 dark:text-slate-300 min-h-[32px] line-clamp-2">
                  {dept.description || "No description provided."}
                </p>

                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                      Headcount
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {dept._count?.users ?? 0} {dept._count?.users === 1 ? "Employee" : "Employees"}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1">
                    <Link
                      href={\`/hr/departments/\${dept.id}\`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium px-2 py-1 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      View Details
                    </Link>
                    <button
                      type="button"
                      onClick={() => handleViewRoster(dept)}
                      className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-700 dark:text-slate-400 font-medium px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      Quick Roster
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dept)}
                      title="Edit Department"
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusDialogDept(dept)}
                      title={dept.isActive ? "Deactivate" : "Activate"}
                      className={\`rounded-lg p-1.5 transition-colors \${
                        dept.isActive
                          ? "text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40"
                          : "text-emerald-500 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                      }\`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit Department Modal */}
      <DepartmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {}}
        departmentToEdit={deptToEdit}
        onSubmitApi={handleModalSubmit}
      />

      {/* Quick Roster Dialog */}
      <Dialog
        isOpen={Boolean(selectedDeptId)}
        onClose={() => setSelectedDeptId(null)}
        title={selectedDeptDetail ? \`\${selectedDeptDetail.name} — Employee Roster\` : "Department Roster"}
        maxWidth="max-w-2xl"
      >
        <div className="p-6 space-y-4">
          {isLoadingDetail && (
            <div className="py-12 text-center text-xs text-slate-400 animate-pulse">
              Loading department employees...
            </div>
          )}

          {!isLoadingDetail && selectedDeptDetail && (
            <>
              <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">
                  Total Assigned: <strong className="text-slate-900 dark:text-white font-mono">{selectedDeptDetail.users?.length || 0}</strong>
                </span>
                <Link
                  href={\`/hr/departments/\${selectedDeptDetail.id}\`}
                  className="text-blue-600 hover:underline font-semibold"
                >
                  Open Full Department Page →
                </Link>
              </div>

              {(!selectedDeptDetail.users || selectedDeptDetail.users.length === 0) ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No employees are currently assigned to this department.
                </div>
              ) : (
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedDeptDetail.users.map((emp) => (
                    <div key={emp.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950 font-bold text-xs text-blue-700 dark:text-blue-300">
                          {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                        </div>
                        <div>
                          <Link
                            href={\`/hr/employees/\${emp.id}\`}
                            className="text-xs font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                          >
                            {emp.fullName}
                          </Link>
                          <p className="text-[11px] text-slate-400">
                            {emp.jobTitle || "Team Member"} • <span className="font-mono">{emp.employeeId}</span>
                          </p>
                        </div>
                      </div>
                      <Badge variant={emp.isActive ? "success" : "destructive"}>
                        {emp.employmentStatus}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" size="sm" onClick={() => setSelectedDeptId(null)}>
              Close
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={Boolean(statusDialogDept)}
        onClose={() => setStatusDialogDept(null)}
        onConfirm={handleConfirmStatusToggle}
        title={statusDialogDept?.isActive ? "Deactivate Department" : "Activate Department"}
        message={
          statusDialogDept?.isActive
            ? \`Are you sure you want to deactivate '\${statusDialogDept?.name}'? Note that existing employees will remain assigned.\`
            : \`Are you sure you want to activate '\${statusDialogDept?.name}'?\`
        }
        confirmText={statusDialogDept?.isActive ? "Deactivate" : "Activate"}
        variant={statusDialogDept?.isActive ? "danger" : "primary"}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}
`;

fs.writeFileSync(departmentsPath, departmentsContent, 'utf8');
console.log('2. Updated hr/departments/page.tsx');

// 3. Create hr/departments/[id]/page.tsx
const deptDetailsDir = path.join(frontendDir, 'app/(dashboard)/hr/departments/[id]');
if (!fs.existsSync(deptDetailsDir)) {
  fs.mkdirSync(deptDetailsDir, { recursive: true });
}
const deptDetailsPath = path.join(deptDetailsDir, 'page.tsx');
const deptDetailsContent = `"use client";

import React, { useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  Edit,
  Power,
  AlertCircle,
  RotateCw,
  CheckCircle,
  Briefcase,
  Calendar,
  Mail,
  Phone,
  Shield,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { DepartmentModal } from "@/components/departments/DepartmentModal";
import {
  useDepartment,
  useUpdateDepartment,
  useUpdateDepartmentStatus,
} from "@/hooks/useDepartment";
import { UpdateDepartmentInput } from "@/services/department.service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function DepartmentDetailsPage({ params }: PageProps) {
  const resolvedParams = use(params);
  const router = useRouter();

  // TanStack Query for department details
  const {
    data: department,
    isLoading,
    isError,
    error,
    refetch,
  } = useDepartment(resolvedParams.id);

  const updateDeptMutation = useUpdateDepartment();
  const updateStatusMutation = useUpdateDepartmentStatus();

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleEditSubmit = async (data: UpdateDepartmentInput) => {
    if (!department) throw new Error("Department not found");
    const updated = await updateDeptMutation.mutateAsync({
      id: department.id,
      data,
    });
    showNotification(\`Department '\${updated.name}' updated successfully\`);
    return updated;
  };

  const handleStatusToggle = async () => {
    if (!department) return;
    try {
      const nextActive = !department.isActive;
      const updated = await updateStatusMutation.mutateAsync({
        id: department.id,
        isActive: nextActive,
      });
      showNotification(
        \`Department '\${updated.name}' is now \${updated.isActive ? "Active" : "Deactivated"}\`
      );
      setIsStatusDialogOpen(false);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to change department status");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (isError || !department) {
    const errorMsg =
      error instanceof Error ? error.message : "The requested department record does not exist.";
    return (
      <div className="py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
          Department Not Found
        </h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{errorMsg}</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.push("/hr/departments")}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" />
            Back to Departments
          </Button>
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            <RotateCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const assignedEmployees = department.users || [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <Link
          href="/hr/departments"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Department Directory
        </Link>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsEditModalOpen(true)}>
            <Edit className="h-3.5 w-3.5 mr-1.5" />
            Edit Department
          </Button>
          <Button
            variant={department.isActive ? "destructive" : "primary"}
            size="sm"
            onClick={() => setIsStatusDialogOpen(true)}
          >
            <Power className="h-3.5 w-3.5 mr-1.5" />
            {department.isActive ? "Deactivate Department" : "Activate Department"}
          </Button>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Department Hero Card */}
      <Card className="overflow-hidden border-blue-100 dark:border-slate-800">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-20" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-tr from-blue-700 to-indigo-700 text-2xl font-black text-white shadow-xl dark:border-slate-900">
                <Building2 className="h-10 w-10" />
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {department.name}
                  </h1>
                  <Badge variant={department.isActive ? "success" : "destructive"}>
                    {department.isActive ? "ACTIVE" : "INACTIVE"}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                  {department.description || "No description provided for this business unit."}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                  Total Headcount
                </span>
                <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                  {assignedEmployees.length}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roster of Assigned Employees */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-500" />
              Department Members ({assignedEmployees.length})
            </CardTitle>
            <Link
              href="/hr/employees"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              Assign more in Employees →
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {assignedEmployees.length === 0 ? (
            <div className="py-16 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-800">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900 dark:text-white">
                No employees in this department
              </h3>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                You can assign employees to this department by editing their profiles.
              </p>
              <div className="mt-4">
                <Link href="/hr/employees">
                  <Button variant="outline" size="sm">
                    Go to Employee Directory
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Employee</th>
                    <th className="pb-3 font-semibold">ID</th>
                    <th className="pb-3 font-semibold">Role & Title</th>
                    <th className="pb-3 font-semibold">Contact</th>
                    <th className="pb-3 font-semibold">Status</th>
                    <th className="pb-3 font-semibold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {assignedEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-xs font-bold text-white shadow-sm">
                            {emp.firstName.charAt(0)}{emp.lastName.charAt(0)}
                          </div>
                          <div>
                            <Link
                              href={\`/hr/employees/\${emp.id}\`}
                              className="font-bold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                            >
                              {emp.fullName}
                            </Link>
                            <p className="text-[11px] text-slate-400">{emp.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {emp.employeeId}
                      </td>
                      <td className="py-3">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {emp.jobTitle || "Team Member"}
                        </span>
                        <p className="text-[11px] text-slate-400 uppercase tracking-wider">{emp.role}</p>
                      </td>
                      <td className="py-3 text-slate-500 dark:text-slate-400">
                        {emp.phone || "No phone"}
                      </td>
                      <td className="py-3">
                        <Badge variant={emp.isActive ? "success" : "destructive"}>
                          {emp.employmentStatus}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Link href={\`/hr/employees/\${emp.id}\`}>
                          <Button variant="ghost" size="sm">
                            View Profile
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Department Modal */}
      <DepartmentModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {}}
        departmentToEdit={department}
        onSubmitApi={handleEditSubmit}
      />

      {/* Confirmation Dialog for Status Change */}
      <ConfirmationDialog
        isOpen={isStatusDialogOpen}
        onClose={() => setIsStatusDialogOpen(false)}
        onConfirm={handleStatusToggle}
        title={department.isActive ? "Deactivate Department" : "Activate Department"}
        message={
          department.isActive
            ? \`Are you sure you want to deactivate '\${department.name}'? Existing employees will remain assigned.\`
            : \`Are you sure you want to activate '\${department.name}'?\`
        }
        confirmText={department.isActive ? "Deactivate" : "Activate"}
        variant={department.isActive ? "danger" : "primary"}
        isLoading={updateStatusMutation.isPending}
      />
    </div>
  );
}
`;

fs.writeFileSync(deptDetailsPath, deptDetailsContent, 'utf8');
console.log('3. Created hr/departments/[id]/page.tsx');

// 4. Update employee/profile/page.tsx
const employeeProfilePath = path.join(frontendDir, 'app/(dashboard)/employee/profile/page.tsx');
const employeeProfileContent = `"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  User as UserIcon,
  Mail,
  Phone,
  Building2,
  Calendar,
  Briefcase,
  Shield,
  Lock,
  CheckCircle,
  AlertCircle,
  RotateCw,
  Save,
  Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useSelfProfile, useUpdateSelfProfile } from "@/hooks/useSelfProfile";

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
  phone: z.string().optional(),
  profileImage: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function EmployeeProfilePage() {
  const {
    data: employee,
    isLoading,
    isError,
    error,
    refetch,
  } = useSelfProfile();

  const updateProfileMutation = useUpdateSelfProfile();
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: "",
      lastName: "",
      phone: "",
      profileImage: "",
    },
  });

  useEffect(() => {
    if (employee) {
      reset({
        firstName: employee.firstName,
        lastName: employee.lastName,
        phone: employee.phone || "",
        profileImage: employee.profileImage || "",
      });
    }
  }, [employee, reset]);

  const showNotification = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      const updated = await updateProfileMutation.mutateAsync(data);
      showNotification("Your profile has been successfully updated.");
      reset({
        firstName: updated.firstName,
        lastName: updated.lastName,
        phone: updated.phone || "",
        profileImage: updated.profileImage || "",
      });
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Failed to update profile");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse py-8">
        <div className="h-6 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-32 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
          <div className="h-64 rounded-2xl bg-slate-200 dark:bg-slate-800" />
        </div>
      </div>
    );
  }

  if (isError || !employee) {
    return (
      <div className="py-16 text-center">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/60 dark:text-red-400">
          <AlertCircle className="h-7 w-7" />
        </div>
        <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">Profile Unavailable</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {error instanceof Error ? error.message : "Failed to load employee profile"}
        </p>
        <div className="mt-5">
          <Button variant="primary" size="sm" onClick={() => refetch()}>
            <RotateCw className="h-3.5 w-3.5 mr-1" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="My Profile"
        subtitle="Manage your personal information, view assigned department, and review account permissions."
      />

      {/* Success Notification */}
      {successMessage && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-800 shadow-sm dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-300">
          <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="font-semibold">{successMessage}</span>
        </div>
      )}

      {/* Profile Overview Banner */}
      <Card className="overflow-hidden border-blue-100 dark:border-slate-800">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 h-20" />
        <CardContent className="pt-0 pb-6 px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 -mt-10">
            <div className="flex items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-gradient-to-tr from-blue-700 to-indigo-700 text-2xl font-black text-white shadow-xl dark:border-slate-900">
                {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
              </div>
              <div className="mb-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {employee.fullName}
                  </h1>
                  <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md dark:bg-blue-950 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                    {employee.employeeId}
                  </span>
                  <Badge variant={employee.isActive ? "success" : "destructive"}>
                    {employee.employmentStatus}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {employee.jobTitle || "Team Member"} • {employee.departmentName || "Unassigned"}
                </p>
              </div>
            </div>

            <span className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold uppercase text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {employee.role}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Editable Personal Information */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <UserIcon className="h-4 w-4 text-blue-500" />
                Personal Details
              </CardTitle>
              <CardDescription className="text-xs">
                You can update your personal display name, contact phone, and profile avatar.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="First Name *"
                    placeholder="e.g. Jane"
                    {...register("firstName")}
                    error={errors.firstName?.message}
                  />
                  <Input
                    label="Last Name *"
                    placeholder="e.g. Doe"
                    {...register("lastName")}
                    error={errors.lastName?.message}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Phone Number"
                    placeholder="e.g. +1 (555) 000-0000"
                    {...register("phone")}
                    error={errors.phone?.message}
                  />
                  <Input
                    label="Profile Image URL"
                    placeholder="https://..."
                    {...register("profileImage")}
                    error={errors.profileImage?.message}
                  />
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    disabled={!isDirty || updateProfileMutation.isPending}
                    isLoading={updateProfileMutation.isPending}
                  >
                    <Save className="h-3.5 w-3.5 mr-1.5" />
                    Save Changes
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Read-Only Organizational Attributes */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-blue-500" />
                Company Records
              </CardTitle>
              <CardDescription className="text-xs">
                Official employment attributes configured and managed by HR operations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Employee ID</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {employee.employeeId}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Email Address</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.email}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Department</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.departmentName || "Unassigned"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Job Title</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.jobTitle || "-"}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-400">Role</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {employee.role}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Joining Date</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(employee.joiningDate).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
`;

fs.writeFileSync(employeeProfilePath, employeeProfileContent, 'utf8');
console.log('4. Updated employee/profile/page.tsx');
