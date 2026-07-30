import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../../../config/env';
import { prisma } from '../../../database/prisma';
import { errorResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';

export const jwtAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  console.log('[DEBUG] Authorization header:', req.headers.authorization);
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1] ?? null;
    if (token) {
      console.log('[DEBUG] Token from Bearer header extracted:', token.substring(0, 30), '...');
    }
  } else if (
    (req as any).cookies &&
    typeof (req as any).cookies === 'object' &&
    (req as any).cookies.accessToken
  ) {
    token = (req as any).cookies.accessToken;
    console.log('[DEBUG] Token from cookie extracted:', token ? 'found' : 'not found');
  }

  if (!token) {
    console.log('[DEBUG] No token found - returning 401');
    errorResponse(res, 'No access token provided', 401);
    return;
  }

  console.log(
    '[DEBUG] About to verify token with secret length:',
    env.jwtAccessSecret?.length || 0,
  );
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

    (req as any).userId = verified.userId;
    (req as any).email = verified.email;
    (req as any).role = verified.role;
    (req as any).user = user;

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
