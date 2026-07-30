import { Request, Response } from 'express';
import { authService } from './auth.service';
import { LoginInput } from './dtos/login.dto';
import { RegisterInput } from './dtos/register.dto';
import { successResponse, errorResponse } from '../../utils/apiResponse';
import { AppError } from '../../utils/appError';

export const authController = {
  async register(req: Request, res: Response) {
    try {
      const input = req.body as RegisterInput;
      const user = await authService.register(input);
      return successResponse(res, { user }, 'User registered successfully', 201);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Registration failed', 500);
    }
  },

  async login(req: Request, res: Response) {
    try {
      const input = req.body as LoginInput;
      const { accessToken, refreshToken } = await authService.login(input, req);
      // Set httpOnly cookie if desired: res.cookie('accessToken', accessToken, { httpOnly: true, secure: true });
      return successResponse(res, { accessToken, refreshToken }, 'Login successful');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Login failed', 500);
    }
  },

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return errorResponse(res, 'Missing refresh token', 400);
      }
      const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(refreshToken, req);
      return successResponse(res, { accessToken, refreshToken: newRefreshToken }, 'Token refreshed');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to refresh token', 500);
    }
  },

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return errorResponse(res, 'Missing refresh token', 400);
      }
      await authService.logout(refreshToken);
      // Clear cookies if used: res.clearCookie('accessToken');
      return successResponse(res, {}, 'Logout successful');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Logout failed', 500);
    }
  },
};
