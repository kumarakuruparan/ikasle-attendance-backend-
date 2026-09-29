import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ApiError } from '../utils/errors';
import config from '../config/env';

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
};

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  // 1. Custom ApiError (BadRequest, Unauthorized, Forbidden, NotFound, Conflict)
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      ...(err.details ? { errors: err.details } : {}),
    });
  }

  // 2. Prisma Known Request Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[])?.join(', ') || 'field';
      return res.status(409).json({
        success: false,
        message: `A record with this ${target} already exists.`,
      });
    }

    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'The requested record could not be found.',
      });
    }

    return res.status(400).json({
      success: false,
      message: 'Database query constraint error.',
    });
  }

  // 3. Prisma Validation Errors
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({
      success: false,
      message: 'Invalid database query parameters.',
    });
  }

  // 4. Unexpected Server Error
  if (!config.isProduction) {
    console.error('Unhandled Server Error:', err);
  }

  return res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(!config.isProduction ? { error: err.message } : {}),
  });
};
