import { Request, Response, NextFunction } from 'express';
import { checkPermission } from '../services/permission.service';

/**
 * Middleware that enforces a specific permission requirement.
 * Assumes authentication has already been performed by authenticate() middleware.
 * req.userId is expected to be present from prior auth middleware.
 *
 * @param requiredPermission - The permission key to check (e.g., "product:create")
 */
export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Ensure authentication happened first
    if (!req.userId || typeof req.userId !== 'string') {
      res.status(401).json({
        success: false,
        message: 'Access token is missing or invalid',
      });
      return;
    }

    try {
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
