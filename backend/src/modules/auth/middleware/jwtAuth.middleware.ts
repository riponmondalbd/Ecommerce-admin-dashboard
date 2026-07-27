import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../database/prisma';
import { env } from '../../../config/env';
import { errorResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';

export const jwtAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && typeof req.cookies === 'object' && req.cookies.accessToken) {
    token = req.cookies.accessToken as string;
  }

  if (!token) {
    return errorResponse(res, 'No access token provided', 401);
  }

  try {
    const verified = jwt.verify(token, env.jwtAccessSecret) as { userId: string; email: string; role: string };

    const user = await prisma.user.findUnique({ where: { id: verified.userId }, include: { role: true } });

    if (!user) throw new AppError('User not found', 404);
    if (user.status !== 'ACTIVE') throw new AppError('Account is not active', 403);

    (req as any).userId = verified.userId;
    (req as any).email = verified.email;
    (req as any).role = verified.role.name;
    (req as any).user = user;

    next();
  } catch (error) {
    if (error instanceof Error && ('message' in error || error instanceof jwt.JsonWebTokenError)) {
      return errorResponse(res, 'Invalid or expired token', 401);
    }
    if (error instanceof AppError) {
      return errorResponse(res, error.message, error.statusCode);
    }
    return errorResponse(res, 'Authentication failed', 500);
  }
};