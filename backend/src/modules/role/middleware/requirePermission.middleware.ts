import { Request, Response, NextFunction } from 'express';
import { checkPermission } from '../../permission/services/permission.service';

export const requirePermission = (requiredPermission: string) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.userId || typeof req.userId !== 'string') {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const hasPermission = await checkPermission(req.userId as string, requiredPermission);
      if (!hasPermission) {
        res.status(403).json({ success: false, message: 'Insufficient permissions' });
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
