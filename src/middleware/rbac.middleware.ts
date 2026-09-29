import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { Permission } from '../types/auth';
import { hasPermission } from '../utils/permissions';
import { UnauthorizedError, ForbiddenError } from '../utils/errors';

/**
 * Require one or more specific roles
 * Rejects with 401 if unauthenticated, 403 if unauthorized role
 */
export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      return next(new UnauthorizedError());
    }

    if (!allowedRoles.includes(req.currentUser.role)) {
      return next(
        new ForbiddenError(
          `Access forbidden: Requires role ${allowedRoles.join(' or ')} (Current: ${req.currentUser.role})`
        )
      );
    }

    next();
  };
}

/**
 * Require a specific granular permission
 * Evaluates the trusted user's role against the centralized permission matrix
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.currentUser) {
      return next(new UnauthorizedError());
    }

    const permitted = hasPermission(req.currentUser.role, permission);

    if (!permitted) {
      return next(
        new ForbiddenError(
          `Access forbidden: Missing required permission '${permission}' for role '${req.currentUser.role}'`
        )
      );
    }

    next();
  };
}
