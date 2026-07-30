import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../../../database/prisma';
import { env } from '../../../config/env';
import { checkPermission } from '../services/permission.service';

/**
 * Middleware that enforces a specific permission requirement.
 * Combines JWT authentication AND permission checking.
 *
 * @param requiredPermission - The permission key to check (e.g., "product:create")
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Verify JWT if not already present in request
      if (!req.userId || typeof req.userId !== 'string') {
        const authHeader = req.headers.authorization;
        let token: string | null = null;

        if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1] ?? null;
        } else if ((req as any).cookies && (req as any).cookies.accessToken) {
          token = (req as any).cookies.accessToken;
        }

        if (!token) {
          res.status(401).json({
            success: false,
            message: 'Access token is missing or invalid',
          });
          return;
        }

        try {
          const verified = jwt.verify(token, env.jwtAccessSecret) as { userId: string; email: string; role: string };
          const user = await prisma.user.findUnique({ where: { id: verified.userId }, include: { role: true } });
          if (!user) throw new Error('User not found');
          if (user.status !== 'ACTIVE') throw new Error('Account is not active');

          (req as any).userId = verified.userId;
          (req as any).email = verified.email;
          (req as any).role = verified.role;
          (req as any).user = user;
        } catch (err) {
          res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
          });
          return;
        }
      }

      const hasPermission = await checkPermission(req.userId as string, requiredPermission);

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${requiredPermission}`,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      next(error);
    }
  };
};