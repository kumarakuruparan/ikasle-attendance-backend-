import { Request, Response, NextFunction } from 'express';
import * as departmentService from '../services/department.service';
import { sendSuccess } from '../utils/response';

export async function getDepartments(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, isActive } = req.query;
    const departments = await departmentService.getAllDepartments({
      search: search as string | undefined,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
    });

    return sendSuccess(res, {
      data: departments,
      message: 'Departments retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function getDepartmentById(req: Request, res: Response, next: NextFunction) {
  try {
    const department = await departmentService.getDepartmentById(req.params.id as string);
    return sendSuccess(res, {
      data: department,
      message: 'Department retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function createDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.currentUser ? { id: req.currentUser.id, role: req.currentUser.role } : undefined;
    const department = await departmentService.createDepartment(req.body, actor);

    return sendSuccess(res, {
      data: department,
      message: 'Department created successfully',
      statusCode: 201,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.currentUser ? { id: req.currentUser.id, role: req.currentUser.role } : undefined;
    const department = await departmentService.updateDepartment(
      req.params.id as string,
      req.body,
      actor
    );

    return sendSuccess(res, {
      data: department,
      message: 'Department updated successfully',
    });
  } catch (error) {
    next(error);
  }
}

export async function updateDepartmentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.currentUser ? { id: req.currentUser.id, role: req.currentUser.role } : undefined;
    const department = await departmentService.updateDepartmentStatus(
      req.params.id as string,
      req.body.isActive,
      actor
    );

    return sendSuccess(res, {
      data: department,
      message: `Department ${department.isActive ? 'activated' : 'deactivated'} successfully`,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteDepartment(req: Request, res: Response, next: NextFunction) {
  try {
    const actor = req.currentUser ? { id: req.currentUser.id, role: req.currentUser.role } : undefined;
    const result = await departmentService.deleteDepartment(req.params.id as string, actor);

    return sendSuccess(res, {
      data: result,
      message: result.message,
    });
  } catch (error) {
    next(error);
  }
}
