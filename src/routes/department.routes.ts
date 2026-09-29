import { Router } from 'express';
import * as departmentController from '../controllers/department.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  updateDepartmentStatusSchema,
  getDepartmentByIdSchema,
  listDepartmentsSchema,
} from '../validators/department.validator';

const router = Router();

// All department routes require authentication
router.use(requireAuth);

// GET /api/departments - List all departments (accessible by authenticated users)
router.get(
  '/',
  validate(listDepartmentsSchema),
  departmentController.getDepartments
);

// GET /api/departments/:id - Get department details and member roster
router.get(
  '/:id',
  validate(getDepartmentByIdSchema),
  departmentController.getDepartmentById
);

// POST /api/departments - Create department (requires settings.manage: HR)
router.post(
  '/',
  requirePermission('settings.manage'),
  validate(createDepartmentSchema),
  departmentController.createDepartment
);

// PATCH /api/departments/:id/status - Activate/deactivate department (requires settings.manage: HR)
router.patch(
  '/:id/status',
  requirePermission('settings.manage'),
  validate(updateDepartmentStatusSchema),
  departmentController.updateDepartmentStatus
);

// PATCH /api/departments/:id - Edit department (requires settings.manage: HR)
router.patch(
  '/:id',
  requirePermission('settings.manage'),
  validate(updateDepartmentSchema),
  departmentController.updateDepartment
);

// DELETE /api/departments/:id - Delete department (requires settings.manage: HR, soft rejection if users exist)
router.delete(
  '/:id',
  requirePermission('settings.manage'),
  validate(getDepartmentByIdSchema),
  departmentController.deleteDepartment
);

export default router;
