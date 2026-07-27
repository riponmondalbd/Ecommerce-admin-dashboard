import { Express } from 'express';
import { authController } from './auth.controller';
import { jwtAuthMiddleware } from './middleware/jwtAuth.middleware';

export const authRoutes = (app: Express) => {
  app.post('/api/auth/register', (req, res) => {
    authController.register(req, res);
  });

  app.post('/api/auth/login', (req, res) => {
    authController.login(req, res);
  });

  app.post('/api/auth/refresh', (req, res) => {
    authController.refresh(req, res);
  });

  app.post('/api/auth/logout', (req, res) => {
    authController.logout(req, res);
  });

  app.get('/api/auth/me', jwtAuthMiddleware, async (req, res) => {
    try {
      const { authService } = await import('./auth.service');
      if (!req.userId || typeof req.userId !== 'string') {
        return res.status(500).json({ success: false, message: 'User ID not available' });
      }
      const user = await authService.getUserById(req.userId);
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      const { password, ...safeUser } = user;
      return res.json({ success: true, data: safeUser });
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
  });
};