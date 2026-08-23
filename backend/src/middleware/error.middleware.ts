import { NextFunction, Request, Response } from 'express';
import { ValidationError as SequelizeValidationError } from 'sequelize';
import { ZodError } from 'zod';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';

// Centralized error handler — every thrown error (from asyncHandler-wrapped
// controllers, middleware, etc.) ends up here and is normalized into
// `{ success: false, message, errors? }`.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.details,
    });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.flatten(),
    });
    return;
  }

  if (err instanceof SequelizeValidationError) {
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: err.errors.map((e) => ({ field: e.path, message: e.message })),
    });
    return;
  }

  logger.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(env.isProduction ? {} : { stack: (err as Error)?.stack }),
  });
}
