import { Response } from 'express';

interface SuccessResponseOptions<T> {
  data?: T;
  message?: string;
  statusCode?: number;
  meta?: Record<string, unknown>;
}

export function sendSuccess<T>(
  res: Response,
  options: SuccessResponseOptions<T> = {}
) {
  const { data, message, statusCode = 200, meta } = options;
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });
}

export function sendError(
  res: Response,
  message: string,
  statusCode = 500,
  details?: unknown
) {
  return res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { errors: details } : {}),
  });
}
