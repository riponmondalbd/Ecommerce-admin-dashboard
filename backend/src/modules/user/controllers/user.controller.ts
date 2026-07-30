import { Request, Response } from 'express';
import * as z from 'zod';
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  partialUpdateUser,
  deleteUser,
  activateUser,
  deactivateUser,
  lockUser,
  unlockUser,
  getUsersByRole,
} from '../services/user.service';
import { errorResponse, successResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import { ListUserDto, CreateUserDto, UpdateUserDto, PartialUpdateUserDto } from '../../../validation/schemas';

// Validate input helper
const validateInput = <T>(input: unknown, schema: z.Schema<T>): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => i.message).join(', ');
    throw new AppError(`Validation failed: ${issues}`, 400);
  }
  return parsed.data;
};

/**
 * GET /api/users - Get all users with pagination and search
 */
export const listUsers = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.query, ListUserDto);
    getUsers(validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/users/:id - Get a single user by ID
 */
export const getUser = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    getUserById(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/users - Create a new user
 */
export const createUserController = (req: Request, res: Response) => {
  try {
    const requestingUserId = (req as any)?.userId;
    const validated = validateInput(req.body, CreateUserDto);
    createUser(validated, requestingUserId)
      .then((result) => successResponse(res, result, 201))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/users/:id - Full update of a user
 */
export const updateUserController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const requestingUserId = (req as any)?.userId;
    const validated = validateInput(req.body, UpdateUserDto);
    updateUser(id, validated, requestingUserId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/users/:id - Partial update of a user
 */
export const partialUpdateUserController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const requestingUserId = (req as any)?.userId;
    const validated = validateInput(req.body, PartialUpdateUserDto);
    partialUpdateUser(id, validated, requestingUserId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/users/:id - Delete a user
 */
export const deleteUserController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const requestingUserId = (req as any)?.userId;
    deleteUser(id, requestingUserId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/users/:id/activate - Activate a user
 */
export const activateUserController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    activateUser(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/users/:id/deactivate - Deactivate a user
 */
export const deactivateUserController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    deactivateUser(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/users/:id/lock - Lock a user
 */
export const lockUserController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    lockUser(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/users/:id/unlock - Unlock a user
 */
export const unlockUserController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    unlockUser(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/users/:roleId - Get all users assigned to a role
 */
export const getUsersByRoleController = (req: Request, res: Response) => {
  try {
    const roleId = req.params.roleId as string;
    getUsersByRole(roleId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};
