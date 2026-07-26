import { Response, NextFunction } from 'express';

/**
 * Standard API response helper.
 * Ensures every endpoint returns a consistent JSON shape.
 */
export const sendResponse = (res: Response, options: {
  success: boolean;
  statusCode?: number;
  data?: unknown;
  message?: string;
}) => {
  const { statusCode = 200, data, message } = options;

  return res.status(statusCode).json({
    success: options.success,
    ...(options.data !== undefined && { data }),
    ...(message && { message }),
  });
};

/**
 * Success response helper
 */
export const successResponse = (
  res: Response,
  data: unknown,
  message?: string,
  statusCode: number = 200,
) => {
  return sendResponse(res, {
    success: true,
    statusCode,
    data,
    message,
  });
};

/**
 * Error response helper
 */
export const errorResponse = (
  res: Response,
  message: string,
  statusCode: number = 500,
) => {
  return sendResponse(res, {
    success: false,
    statusCode,
    message,
  });
};
