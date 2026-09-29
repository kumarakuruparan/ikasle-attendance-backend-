import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError, ConflictError, BadRequestError } from '../utils/errors';
import { logAuditEvent } from './audit.service';
import { Role } from '../types/auth';

export interface ListDepartmentFilters {
  search?: string;
  isActive?: boolean;
}

export async function getAllDepartments(filters: ListDepartmentFilters = {}) {
  const where: Prisma.DepartmentWhereInput = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search && filters.search.trim() !== '') {
    const term = filters.search.trim();
    where.OR = [
      { name: { contains: term, mode: 'insensitive' } },
      { description: { contains: term, mode: 'insensitive' } },
    ];
  }

  const departments = await prisma.department.findMany({
    where,
    include: {
      _count: {
        select: { users: true },
      },
    },
    orderBy: { name: 'asc' },
  });

  return departments.map((dept) => ({
    id: dept.id,
    name: dept.name,
    description: dept.description,
    isActive: dept.isActive,
    userCount: dept._count.users,
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  }));
}

export async function getDepartmentById(id: string) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: {
      users: {
        select: {
          id: true,
          employeeId: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          jobTitle: true,
          role: true,
          isActive: true,
          employmentStatus: true,
          profileImage: true,
          joiningDate: true,
        },
        orderBy: { firstName: 'asc' },
      },
      _count: {
        select: { users: true },
      },
    },
  });

  if (!dept) {
    throw new NotFoundError(`Department with ID '${id}' not found`);
  }

  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    isActive: dept.isActive,
    userCount: dept._count.users,
    users: dept.users.map((u) => ({
      ...u,
      fullName: `${u.firstName} ${u.lastName}`.trim(),
      joiningDate: u.joiningDate.toISOString(),
    })),
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}

export async function createDepartment(
  data: { name: string; description?: string | null; isActive?: boolean },
  actor?: { id: string; role: Role }
) {
  const trimmedName = data.name.trim();

  const existing = await prisma.department.findFirst({
    where: {
      name: { equals: trimmedName, mode: 'insensitive' },
    },
  });

  if (existing) {
    throw new ConflictError(`Department '${trimmedName}' already exists`);
  }

  const dept = await prisma.department.create({
    data: {
      name: trimmedName,
      description: data.description?.trim() || null,
      isActive: data.isActive !== undefined ? data.isActive : true,
    },
  });

  await logAuditEvent({
    action: 'DEPARTMENT_CREATED',
    entity: 'Department',
    entityId: dept.id,
    actorId: actor?.id,
    actorRole: actor?.role,
    newState: { name: dept.name, isActive: dept.isActive },
  });

  return {
    id: dept.id,
    name: dept.name,
    description: dept.description,
    isActive: dept.isActive,
    userCount: 0,
    createdAt: dept.createdAt.toISOString(),
    updatedAt: dept.updatedAt.toISOString(),
  };
}

export async function updateDepartment(
  id: string,
  data: { name?: string; description?: string | null; isActive?: boolean },
  actor?: { id: string; role: Role }
) {
  const current = await prisma.department.findUnique({ where: { id } });
  if (!current) {
    throw new NotFoundError(`Department with ID '${id}' not found`);
  }

  if (data.name && data.name.trim().toLowerCase() !== current.name.toLowerCase()) {
    const conflict = await prisma.department.findFirst({
      where: {
        name: { equals: data.name.trim(), mode: 'insensitive' },
        NOT: { id },
      },
    });
    if (conflict) {
      throw new ConflictError(`Department with name '${data.name.trim()}' already exists`);
    }
  }

  const updated = await prisma.department.update({
    where: { id },
    data: {
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.description !== undefined && { description: data.description ? data.description.trim() : null }),
      ...(data.isActive !== undefined && { isActive: data.isActive }),
    },
    include: {
      _count: { select: { users: true } },
    },
  });

  await logAuditEvent({
    action: 'DEPARTMENT_UPDATED',
    entity: 'Department',
    entityId: updated.id,
    actorId: actor?.id,
    actorRole: actor?.role,
    previousState: { name: current.name, isActive: current.isActive },
    newState: { name: updated.name, isActive: updated.isActive },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    isActive: updated.isActive,
    userCount: updated._count.users,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function updateDepartmentStatus(
  id: string,
  isActive: boolean,
  actor?: { id: string; role: Role }
) {
  const current = await prisma.department.findUnique({ where: { id } });
  if (!current) {
    throw new NotFoundError(`Department with ID '${id}' not found`);
  }

  const updated = await prisma.department.update({
    where: { id },
    data: { isActive },
    include: { _count: { select: { users: true } } },
  });

  await logAuditEvent({
    action: isActive ? 'DEPARTMENT_ACTIVATED' : 'DEPARTMENT_DEACTIVATED',
    entity: 'Department',
    entityId: updated.id,
    actorId: actor?.id,
    actorRole: actor?.role,
    previousState: { isActive: current.isActive },
    newState: { isActive: updated.isActive },
  });

  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    isActive: updated.isActive,
    userCount: updated._count.users,
    createdAt: updated.createdAt.toISOString(),
    updatedAt: updated.updatedAt.toISOString(),
  };
}

export async function deleteDepartment(id: string, actor?: { id: string; role: Role }) {
  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });

  if (!dept) {
    throw new NotFoundError(`Department with ID '${id}' not found`);
  }

  if (dept._count.users > 0) {
    throw new BadRequestError(
      `Cannot delete department '${dept.name}' because it contains ${dept._count.users} associated employee(s). Please reassign them or deactivate the department instead.`
    );
  }

  await prisma.department.delete({ where: { id } });

  await logAuditEvent({
    action: 'DEPARTMENT_DEACTIVATED',
    entity: 'Department',
    entityId: id,
    actorId: actor?.id,
    actorRole: actor?.role,
    metadata: { deletedName: dept.name },
  });

  return { id, message: `Department '${dept.name}' deleted successfully` };
}
