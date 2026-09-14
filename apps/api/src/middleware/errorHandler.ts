import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger.js';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: err.errors.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      },
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle Mongoose cast errors or duplicate keys
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: `Invalid format for field: ${err.path}`,
      },
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({
      error: {
        code: 'CONFLICT',
        message: 'Resource with this unique identifier already exists',
      },
    });
  }

  logger.error({ err, path: req.path, method: req.method }, 'Unhandled server error');

  return res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
    },
  });
}
