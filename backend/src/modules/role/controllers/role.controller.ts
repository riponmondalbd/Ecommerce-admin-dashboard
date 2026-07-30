import { Request, Response } from 'express';
import * as z from 'zod';
import {
  getRoles,
  getRoleById,
  createRole,
  updateRole,
  partialUpdateRole,
  deleteRole,
  assignPermissionToRole,
  removePermissionFromRole,
  getPermissionsByRole,
} from '../services/role.service';
import { errorResponse, successResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import { ListRoleDto, CreateRoleDto, UpdateRoleDto, PartialUpdateRoleDto } from '../../../validation/schemas';

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
 * GET /api/roles - Get all roles with pagination and search
 */
export const listRoles = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.query, ListRoleDto);
    getRoles(validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * GET /api/roles/:id - Get a single role by ID
 */
export const getRole = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    getRoleById(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * POST /api/roles - Create a new role
 */
export const createRoleController = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.body, CreateRoleDto);
    createRole(validated)
      .then((result) => successResponse(res, result, 201))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * PUT /api/roles/:id - Full update of a role
 */
export const updateRoleController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validated = validateInput(req.body, UpdateRoleDto);
    updateRole(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * PATCH /api/roles/:id - Partial update of a role
 */
export const partialUpdateRoleController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const validated = validateInput(req.body, PartialUpdateRoleDto);
    partialUpdateRole(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * DELETE /api/roles/:id - Delete a role with safety guards
 */
export const deleteRoleController = (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    deleteRole(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * POST /api/roles/:roleId/permissions/:permissionId - Assign permission to role
 */
export const assignPermissionToRoleController = (req: Request, res: Response) => {
  try {
    const roleId = req.params.roleId as string;
    const permissionId = req.params.permissionId as string;
    assignPermissionToRole(roleId, permissionId)
      .then((result) => successResponse(res, result, 201))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * DELETE /api/roles/:roleId/permissions/:permissionId - Remove permission from role
 */
export const removePermissionFromRoleController = (req: Request, res: Response) => {
  try {
    const roleId = req.params.roleId as string;
    const permissionId = req.params.permissionId as string;
    removePermissionFromRole(roleId, permissionId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};

/**
 * GET /api/roles/:roleId/permissions - Get all permissions assigned to a role
 */
export const getPermissionsForRole = (req: Request, res: Response) => {
  try {
    const roleId = req.params.roleId as string;
    getPermissionsByRole(roleId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, error instanceof AppError ? error.message : 'Internal server error', error instanceof AppError ? error.statusCode : 500);
  }
};
