import { Response } from 'express';

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
  messageOrCode?: string | number,
  statusCode: number = 200,
) => {
  let message: string | undefined = undefined;
  let code = statusCode;

  if (typeof messageOrCode === 'number') {
    code = messageOrCode;
  } else if (typeof messageOrCode === 'string') {
    message = messageOrCode;
  }

  return sendResponse(res, {
    success: true,
    statusCode: code,
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
