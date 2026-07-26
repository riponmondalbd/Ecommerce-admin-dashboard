import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { errorResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

/**
 * Global error handler middleware.
 * Catches all errors and returns a consistent JSON response.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Log the full error stack in development
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  // Handle known application errors
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }

  // Handle Prisma known errors
  if (err.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as { code: string; message: string };
    logger.error(`Prisma error [${prismaError.code}]: ${prismaError.message}`);

    switch (prismaError.code) {
      case 'P2002':
        return errorResponse(res, 'A record with this value already exists.', 409);
      case 'P2025':
        return errorResponse(res, 'Record not found.', 404);
      default:
        return errorResponse(res, 'Database operation failed.', 500);
    }
  }

  // Handle Zod validation errors (from route-level validation)
  if (err.name === 'ZodError') {
    const zodError = err as { issues?: Array<{ path: string[]; message: string }> };
    const messages = zodError.issues?.map((issue) =>
      `${issue.path.join('.')}: ${issue.message}`,
    );
    return errorResponse(res, `Validation failed: ${messages?.join(', ')}`, 400);
  }

  // Default: unexpected server error
  return errorResponse(res, 'Internal server error.', 500);
};
