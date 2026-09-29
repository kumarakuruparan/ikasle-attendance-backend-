import { Router } from 'express';
import * as userController from '../controllers/user.controller';
import { requireAuth } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/rbac.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createUserSchema,
  updateUserSchema,
  updateUserStatusSchema,
  getUserByIdSchema,
  listUsersSchema,
} from '../validators/user.validator';

const router = Router();

// All user/employee routes require authentication
router.use(requireAuth);

// GET /api/employees/dashboard/stats - Aggregated stats for dashboards (requires employees.view)
router.get(
  '/dashboard/stats',
  requirePermission('employees.view'),
  userController.getDashboardStats
);

// GET /api/employees - List all employees (requires employees.view)
router.get(
  '/',
  requirePermission('employees.view'),
  validate(listUsersSchema),
  userController.getEmployees
);

// GET /api/employees/:id - Get employee details by ID or Employee ID (requires employees.view)
router.get(
  '/:id',
  requirePermission('employees.view'),
  validate(getUserByIdSchema),
  userController.getEmployeeById
);

// POST /api/employees - Create new employee (requires employees.manage)
router.post(
  '/',
  requirePermission('employees.manage'),
  validate(createUserSchema),
  userController.createEmployee
);

// PATCH /api/employees/:id/status - Update employee active/employment status (requires employees.manage)
router.patch(
  '/:id/status',
  requirePermission('employees.manage'),
  validate(updateUserStatusSchema),
  userController.updateEmployeeStatus
);

// PATCH /api/employees/:id - Update employee details (requires employees.manage)
router.patch(
  '/:id',
  requirePermission('employees.manage'),
  validate(updateUserSchema),
  userController.updateEmployee
);

export default router;
