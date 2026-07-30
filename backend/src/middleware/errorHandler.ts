import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/appError';
import { errorResponse } from '../utils/apiResponse';
import { logger } from '../utils/logger';

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  if (process.env.NODE_ENV === 'development') {
    logger.error(err.stack);
  }

  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }

  if (err instanceof Error && ('code' in err || err.message)) {
    const code = (err as any).code;
    if (code === 'P2002') {
      return errorResponse(res, 'A record with this value already exists.', 409);
    }
    if (code === 'P2025') {
      return errorResponse(res, 'Record not found.', 404);
    }
  }

  if ((err as any).name === 'ZodError') {
    const issues = (err as any).issues?.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`).join(', ');
    return errorResponse(res, `Validation failed: ${issues}`, 400);
  }

  return errorResponse(res, 'Internal server error.', 500);
};