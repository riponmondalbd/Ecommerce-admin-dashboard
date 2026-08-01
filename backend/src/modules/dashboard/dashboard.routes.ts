import { Express } from 'express';
import { getDashboardStatsController } from './controllers/dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';

export const dashboardRoutes = (app: Express) => {
  // GET /api/dashboard/stats — requires authentication
  app.get('/api/dashboard/stats', authenticate, getDashboardStatsController);
};
