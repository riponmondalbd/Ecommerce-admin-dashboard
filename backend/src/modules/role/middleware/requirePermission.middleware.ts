import { Request, Response, NextFunction } from 'express';
import { checkPermission } from '../../../permission/services/permission.service';

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.userId || typeof req.userId !== 'string') {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }

      const hasPermission = await checkPermission(req.userId as string, requiredPermission);
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: 'Insufficient permissions' });
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
