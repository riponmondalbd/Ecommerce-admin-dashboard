import { Request, Response, NextFunction } from 'express';
import { checkPermission } from '../services/permission.service';

/**
 * Middleware that enforces a specific permission requirement.
 * The user must have the specified permission to access the route.
 *
 * @param requiredPermission - The permission key to check (e.g., "product:create")
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // req.userId should be set by jwtAuthMiddleware
      if (!req.userId || typeof req.userId !== 'string') {
        return res.status(401).json({
          success: false,
          message: 'Access token is missing or invalid',
        });
      }

      const hasPermission = await checkPermission(req.userId as string, requiredPermission);

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: `Insufficient permissions. Required: ${requiredPermission}`,
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      next(error);
    }
  };
};