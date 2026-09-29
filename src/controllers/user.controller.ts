import { Request, Response, NextFunction } from 'express';
import * as userService from '../services/user.service';
import { sendSuccess } from '../utils/response';
import { Role, EmploymentStatus } from '@prisma/client';

export async function getEmployees(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, departmentId, role, status, isActive, page, limit } = req.query;

    const result = await userService.getAllEmployees({
      search: search as string | undefined,
      departmentId: departmentId as string | undefined,
      role: role as Role | undefined,
      status: status as EmploymentStatus | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      page: page ? parseInt(page as string, 10) : 1,
      limit: limit ? parseInt(limit as string, 10) : 50,
    });

    return sendSuccess(res, {
      data: result.employees,
      message: 'Employees retrieved successfully',
      meta: result.pagination,
    });
  } catch (error) {
    next(error);
  }
}

export const getUsers = getEmployees;

export async function getEmployeeById(req: Request, res: Response, next: NextFunction) {
  try {
    const employee = await userService.getEmployeeById(req.params.id as string);
    return sendSuccess(res, {
      data: employee,
      message: 'Employee retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export const getUserById = getEmployeeById;

export async function createEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.currentUser ? { id: req.currentUser.id, role: req.currentUser.role } : undefined;
    const employee = await userService.createEmployee(req.body, actor);

    return sendSuccess(res, {
      data: employee,
      message: 'Employee created successfully',
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

export const createUser = createEmployee;

export async function updateEmployee(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.currentUser ? { id: req.currentUser.id, role: req.currentUser.role } : undefined;
    const employee = await userService.updateEmployee(req.params.id as string, req.body, actor);

    return sendSuccess(res, {
      data: employee,
      message: 'Employee updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export const updateUser = updateEmployee;

export async function updateEmployeeStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.currentUser ? { id: req.currentUser.id, role: req.currentUser.role } : undefined;
    const employee = await userService.updateEmployeeStatus(
      req.params.id as string,
      req.body,
      actor
    );

    return sendSuccess(res, {
      data: employee,
      message: `Employee ${employee.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDashboardStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const stats = await userService.getEmployeeDashboardStats();
    return sendSuccess(res, {
      data: stats,
      message: 'Dashboard stats retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}
