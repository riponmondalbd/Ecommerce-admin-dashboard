import { Express } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../../middleware/auth.middleware';

export const authRoutes = (app: Express) => {
  // Public endpoints - no authentication required
  app.post('/api/auth/login', authController.login);
  app.post('/api/auth/refresh', authController.refresh);
  app.post('/api/auth/logout', authController.logout);

  // Protected endpoint - requires authentication
  app.get('/api/auth/me', authenticate, async (req, res) => {
    try {
      const userId = (req as any).userId;
      if (!userId || typeof userId !== 'string') {
        return res.status(500).json({ success: false, message: 'User ID not available' });
      }

      // Lazy load auth service to avoid circular dependency
      const { authService } = await import('./auth.service');
      const user = await authService.getUserById(userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      const { password, role, ...safeUser } = user;
      const permissions = role?.permissions?.map((rp: any) => rp.permission.key) || [];

      return res.json({
        success: true,
        data: {
          ...safeUser,
          role: role ? { id: role.id, name: role.name } : null,
          permissions,
        },
      });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  });
};
