import { Request, Response } from 'express';
import { getDashboardStats } from '../services/dashboard.service';
import { successResponse, errorResponse } from '../../../utils/apiResponse';

/**
 * GET /api/dashboard/stats - Get aggregate statistics for the admin dashboard
 */
export const getDashboardStatsController = async (_req: Request, res: Response) => {
  try {
    const stats = await getDashboardStats();
    successResponse(res, stats);
  } catch (error) {
    errorResponse(
      res,
      error instanceof Error ? error.message : 'Failed to fetch dashboard statistics',
      500,
    );
  }
};
