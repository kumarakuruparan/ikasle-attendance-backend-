import { Role, EmploymentStatus, Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { UserWithDepartment } from '../types/auth';
import { logAuditEvent } from './audit.service';
import crypto from 'crypto';

export function sanitizeUser(user: UserWithDepartment) {
  return {
    id: user.id,
    clerkUserId: user.clerkUserId,
    employeeId: user.employeeId,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: `${user.firstName} ${user.lastName}`.trim(),
    email: user.email,
    phone: user.phone || null,
    profileImage: user.profileImage || null,
    role: user.role,
    jobTitle: user.jobTitle || null,
    departmentId: user.departmentId || null,
    departmentName: user.department?.name || null,
    department: user.department
      ? {
          id: user.department.id,
          name: user.department.name,
          description: user.department.description,
        }
      : null,
    joiningDate: user.joiningDate.toISOString(),
    employmentStatus: user.employmentStatus,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}

/**
 * Safely generate the next human-friendly Employee ID (e.g. IK001, IK002, IK003...)
 * Finds the current maximum sequential number and increments by 1.
 */
export async function generateNextEmployeeId(): Promise<string> {
  // Find all users with employeeId starting with 'IK'
  const users = await prisma.user.findMany({
    where: {
      employeeId: {
        startsWith: 'IK',
      },
    },
    select: { employeeId: true },
  });

  let maxNum = 0;
  for (const u of users) {
    const match = u.employeeId.match(/^IK(\d+)$/i);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `IK${nextNum.toString().padStart(3, '0')}`;
}

export interface ListEmployeesFilters {
  search?: string;
  departmentId?: string;
  role?: Role;
  status?: EmploymentStatus;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export async function getAllEmployees(filters: ListEmployeesFilters = {}) {
  const { search, departmentId, role, status, isActive, page = 1, limit = 50 } = filters;

  const where: Prisma.UserWhereInput = {};

  if (departmentId) {
    where.departmentId = departmentId;
  }

  if (role) {
    where.role = role;
  }

  if (status) {
    where.employmentStatus = status;
  }

  if (isActive !== undefined) {
    where.isActive = isActive;
  }

  if (search && search.trim() !== '') {
    const term = search.trim();
    where.OR = [
      { firstName: { contains: term, mode: 'insensitive' } },
      { lastName: { contains: term, mode: 'insensitive' } },
      { email: { contains: term, mode: 'insensitive' } },
      { employeeId: { contains: term, mode: 'insensitive' } },
      { jobTitle: { contains: term, mode: 'insensitive' } },
    ];
  }

  const take = Math.min(Math.max(Number(limit), 1), 100);
  const skip = (Math.max(Number(page), 1) - 1) * take;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      include: { department: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
  ]);

  return {
    employees: users.map(sanitizeUser),
    pagination: {
      total,
      page: Number(page),
      limit: take,
      totalPages: Math.ceil(total / take),
    },
  };
}

// Backwards-compatible getAllUsers
export async function getAllUsers() {
  const result = await getAllEmployees({ limit: 100 });
  return result.employees;
}

export async function getEmployeeById(id: string) {
  // Support lookup by either database cuid/uuid or visible employeeId (IK001)
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ id }, { employeeId: id }],
    },
    include: { department: true },
  });

  if (!user) {
    throw new NotFoundError(`Employee with ID '${id}' not found`);
  }

  return sanitizeUser(user);
}

export const getUserById = getEmployeeById;

export async function createEmployee(
  data: {
    clerkUserId?: string;
    employeeId?: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    profileImage?: string | null;
    role?: Role;
    jobTitle?: string | null;
    departmentId?: string | null;
    joiningDate?: string | Date;
    employmentStatus?: EmploymentStatus;
    isActive?: boolean;
  },
  actor?: { id: string; role: Role }
) {
  // 1. Verify department if provided
  if (data.departmentId) {
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!dept) {
      throw new BadRequestError(`Department with ID '${data.departmentId}' does not exist`);
    }
  }

  // 2. Check for duplicate email
  const existingEmail = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existingEmail) {
    throw new ConflictError(`An employee with email '${data.email}' already exists`);
  }

  // 3. Resolve status & active flags synchronously
  let resolvedStatus = data.employmentStatus || EmploymentStatus.ACTIVE;
  let resolvedActive = data.isActive !== undefined ? data.isActive : true;
  if (resolvedStatus === EmploymentStatus.INACTIVE) {
    resolvedActive = false;
  } else if (!resolvedActive) {
    resolvedStatus = EmploymentStatus.INACTIVE;
  }

  // 4. Resolve clerkUserId: if not supplied, create a pending placeholder
  const clerkUserId = data.clerkUserId || `pending_clerk_${crypto.randomUUID()}`;

  // 5. Check if specific clerkUserId already in use
  const existingClerk = await prisma.user.findUnique({
    where: { clerkUserId },
  });
  if (existingClerk) {
    throw new ConflictError(`An employee with Clerk ID '${clerkUserId}' already exists`);
  }

  // 6. Safe Employee ID assignment with retry loop against race conditions
  let attempts = 0;
  let createdUser: UserWithDepartment | null = null;
  let targetEmployeeId = data.employeeId;

  while (attempts < 5 && !createdUser) {
    attempts++;
    const currentEmployeeId = targetEmployeeId || (await generateNextEmployeeId());

    try {
      createdUser = await prisma.user.create({
        data: {
          clerkUserId,
          employeeId: currentEmployeeId,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          phone: data.phone || null,
          profileImage: data.profileImage || null,
          role: data.role || Role.EMPLOYEE,
          jobTitle: data.jobTitle || null,
          departmentId: data.departmentId || null,
          joiningDate: data.joiningDate ? new Date(data.joiningDate) : new Date(),
          employmentStatus: resolvedStatus,
          isActive: resolvedActive,
        },
        include: { department: true },
      });
    } catch (err: unknown) {
      // Prisma unique violation code is P2002
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const target = (err.meta?.target as string[]) || [];
        if (target.includes('employeeId') && !data.employeeId) {
          // Employee ID race condition: retry with incremented ID
          continue;
        }
        if (target.includes('employeeId')) {
          throw new ConflictError(`Employee ID '${targetEmployeeId}' is already in use`);
        }
        if (target.includes('email')) {
          throw new ConflictError(`An employee with email '${data.email}' already exists`);
        }
      }
      throw err;
    }
  }

  if (!createdUser) {
    throw new Error('Failed to safely allocate a unique Employee ID. Please try again.');
  }

  // 7. Audit log event
  await logAuditEvent({
    action: 'EMPLOYEE_CREATED',
    entity: 'User',
    entityId: createdUser.id,
    actorId: actor?.id,
    actorRole: actor?.role,
    newState: {
      employeeId: createdUser.employeeId,
      email: createdUser.email,
      role: createdUser.role,
      departmentId: createdUser.departmentId,
    },
  });

  return sanitizeUser(createdUser);
}

export const createUser = createEmployee;

export async function updateEmployee(
  id: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    profileImage?: string | null;
    role?: Role;
    jobTitle?: string | null;
    departmentId?: string | null;
    joiningDate?: string | Date;
    employmentStatus?: EmploymentStatus;
    isActive?: boolean;
  },
  actor?: { id: string; role: Role }
) {
  const current = await prisma.user.findFirst({
    where: { OR: [{ id }, { employeeId: id }] },
  });

  if (!current) {
    throw new NotFoundError(`Employee with ID '${id}' not found`);
  }

  // Verify department if updated
  if (data.departmentId !== undefined && data.departmentId !== null) {
    const dept = await prisma.department.findUnique({
      where: { id: data.departmentId },
    });
    if (!dept) {
      throw new BadRequestError(`Department with ID '${data.departmentId}' does not exist`);
    }
  }

  // Synchronize isActive and employmentStatus
  let updateData: Prisma.UserUpdateInput = {
    ...(data.firstName !== undefined && { firstName: data.firstName }),
    ...(data.lastName !== undefined && { lastName: data.lastName }),
    ...(data.phone !== undefined && { phone: data.phone }),
    ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
    ...(data.jobTitle !== undefined && { jobTitle: data.jobTitle }),
    ...(data.departmentId !== undefined && {
      department: data.departmentId ? { connect: { id: data.departmentId } } : { disconnect: true },
    }),
    ...(data.joiningDate !== undefined && { joiningDate: new Date(data.joiningDate) }),
  };

  // Only assign role if provided
  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  if (data.employmentStatus !== undefined && data.isActive !== undefined) {
    updateData.employmentStatus = data.employmentStatus;
    updateData.isActive = data.isActive;
  } else if (data.employmentStatus !== undefined) {
    updateData.employmentStatus = data.employmentStatus;
    updateData.isActive = data.employmentStatus === EmploymentStatus.ACTIVE;
  } else if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
    updateData.employmentStatus = data.isActive ? EmploymentStatus.ACTIVE : EmploymentStatus.INACTIVE;
  }

  const updated = await prisma.user.update({
    where: { id: current.id },
    data: updateData,
    include: { department: true },
  });

  // Audit lifecycle changes
  if (data.role && data.role !== current.role) {
    await logAuditEvent({
      action: 'ROLE_CHANGED',
      entity: 'User',
      entityId: updated.id,
      actorId: actor?.id,
      actorRole: actor?.role,
      previousState: { role: current.role },
      newState: { role: updated.role },
    });
  }

  if (data.departmentId !== undefined && data.departmentId !== current.departmentId) {
    await logAuditEvent({
      action: 'DEPARTMENT_CHANGED',
      entity: 'User',
      entityId: updated.id,
      actorId: actor?.id,
      actorRole: actor?.role,
      previousState: { departmentId: current.departmentId },
      newState: { departmentId: updated.departmentId },
    });
  }

  await logAuditEvent({
    action: 'EMPLOYEE_UPDATED',
    entity: 'User',
    entityId: updated.id,
    actorId: actor?.id,
    actorRole: actor?.role,
  });

  return sanitizeUser(updated);
}

export const updateUser = updateEmployee;

export async function updateEmployeeStatus(
  id: string,
  statusData: { isActive?: boolean; employmentStatus?: EmploymentStatus },
  actor?: { id: string; role: Role }
) {
  const current = await prisma.user.findFirst({
    where: { OR: [{ id }, { employeeId: id }] },
  });

  if (!current) {
    throw new NotFoundError(`Employee with ID '${id}' not found`);
  }

  let resolvedActive = statusData.isActive;
  let resolvedStatus = statusData.employmentStatus;

  if (resolvedActive !== undefined && resolvedStatus === undefined) {
    resolvedStatus = resolvedActive ? EmploymentStatus.ACTIVE : EmploymentStatus.INACTIVE;
  } else if (resolvedStatus !== undefined && resolvedActive === undefined) {
    resolvedActive = resolvedStatus === EmploymentStatus.ACTIVE;
  }

  const updated = await prisma.user.update({
    where: { id: current.id },
    data: {
      isActive: resolvedActive,
      employmentStatus: resolvedStatus,
    },
    include: { department: true },
  });

  await logAuditEvent({
    action: resolvedActive ? 'EMPLOYEE_ACTIVATED' : 'EMPLOYEE_DEACTIVATED',
    entity: 'User',
    entityId: updated.id,
    actorId: actor?.id,
    actorRole: actor?.role,
    previousState: { isActive: current.isActive, employmentStatus: current.employmentStatus },
    newState: { isActive: updated.isActive, employmentStatus: updated.employmentStatus },
  });

  return sanitizeUser(updated);
}

/**
 * Employee Self-Profile Update: Only safe personal fields permitted.
 * Role, Employee ID, Department, Employment Status, Joining Date CANNOT be modified.
 */
export async function updateSelfProfile(
  userId: string,
  data: {
    firstName?: string;
    lastName?: string;
    phone?: string | null;
    profileImage?: string | null;
  }
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { department: true },
  });

  if (!user) {
    throw new NotFoundError('User profile not found');
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(data.firstName !== undefined && { firstName: data.firstName }),
      ...(data.lastName !== undefined && { lastName: data.lastName }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.profileImage !== undefined && { profileImage: data.profileImage }),
    },
    include: { department: true },
  });

  return sanitizeUser(updated);
}

/**
 * Aggregated Statistics for HR and CEO Dashboards
 */
export async function getEmployeeDashboardStats() {
  const [totalEmployees, activeEmployees, inactiveEmployees, departmentCount, departments] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isActive: false } }),
      prisma.department.count(),
      prisma.department.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          _count: {
            select: { users: true },
          },
        },
        orderBy: { name: 'asc' },
      }),
    ]);

  return {
    totalEmployees,
    activeEmployees,
    inactiveEmployees,
    departmentCount,
    departmentOverview: departments.map((d) => ({
      id: d.id,
      name: d.name,
      employeeCount: d._count.users,
    })),
  };
}
