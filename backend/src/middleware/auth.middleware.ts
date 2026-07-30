import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env';
import { prisma } from '../../database/prisma';
import { errorResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

/**
 * Shared authentication middleware that extracts and verifies JWT tokens.
 * Sets req.userId, req.email, req.role, and req.user on successful verification.
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | null = null;

  // Try Bearer header first (preferred for APIs)
  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1] ?? null;
  }

  // Fallback to cookies (for browser-based auth)
  if (!token && (req as any).cookies && (req as any).cookies.accessToken) {
    token = (req as any).cookies.accessToken;
  }

  if (!token) {
    errorResponse(res, 'No access token provided', 401);
    return;
  }

  try {
    const verified = jwt.verify(token, env.jwtAccessSecret) as {
      userId: string;
      email: string;
      role: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: verified.userId },
      include: { role: true },
    });

    if (!user) throw new AppError('User not found', 404);
    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    // Attach user info to request
    (req as any).userId = verified.userId;
    (req as any).email = verified.email;
    (req as any).role = verified.role;
    (req as any).user = user;

    // Also attach request object for downstream use (e.g., capturing IP in refresh tokens)
    (req as any).request = req;

    next();
    return;
  } catch (error) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
      return;
    }
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      errorResponse(res, 'Invalid or expired token', 401);
      return;
    }
    if (error instanceof Error) {
      errorResponse(res, error.message, 401);
      return;
    }
    errorResponse(res, 'Authentication failed', 500);
    return;
  }
};
