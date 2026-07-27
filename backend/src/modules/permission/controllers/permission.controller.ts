import { Request, Response } from 'express';
import {
  getPermissions,
  getPermissionById,
  createPermission,
  updatePermission,
  partialUpdatePermission,
  deletePermission,
  assignPermissionToRole,
  removePermissionFromRole,
} from '../services/permission.service';
import { successResponse, errorResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import { ListPermissionDto } from '../dtos/list.permission.dto';
import { CreatePermissionDto } from '../dtos/create.permission.dto';
import { UpdatePermissionDto } from '../dtos/update.permission.dto';
import { PartialUpdatePermissionDto } from '../dtos/update.permission.dto';

export const permissionController = {
  // GET /api/permissions - List all permissions with pagination and search
  async list(req: Request, res: Response) {
    try {
      const result = await getPermissions(req.query as any);
      return successResponse(res, result.data, 'Permissions retrieved successfully', 200, result.pagination);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to retrieve permissions', 500);
    }
  },

  // GET /api/permissions/:id - Get a single permission by ID
  async getById(req: Request, res: Response) {
    try {
      const permission = await getPermissionById(req.params.id);
      return successResponse(res, permission, 'Permission retrieved successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to retrieve permission', 500);
    }
  },

  // POST /api/permissions - Create a new permission
  async create(req: Request, res: Response) {
    try {
      const permission = await createPermission(req.body);
      return successResponse(res, permission, 'Permission created successfully', 201);
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to create permission', 500);
    }
  },

  // PUT /api/permissions/:id - Full update of a permission
  async update(req: Request, res: Response) {
    try {
      const permission = await updatePermission(req.params.id, req.body);
      return successResponse(res, permission, 'Permission updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to update permission', 500);
    }
  },

  // PATCH /api/permissions/:id - Partial update of a permission
  async partialUpdate(req: Request, res: Response) {
    try {
      const permission = await partialUpdatePermission(req.params.id, req.body);
      return successResponse(res, permission, 'Permission updated successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to update permission', 500);
    }
  },

  // DELETE /api/permissions/:id - Delete a permission
  async delete(req: Request, res: Response) {
    try {
      const result = await deletePermission(req.params.id);
      return successResponse(res, {}, 'Permission deleted successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to delete permission', 500);
    }
  },

  // POST /api/permissions/:id/roles/:roleId - Assign a permission to a role
  async assignToRole(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const assignment = await assignPermissionToRole(roleId, req.params.id);
      return successResponse(res, assignment, 'Permission assigned to role successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to assign permission to role', 500);
    }
  },

  // DELETE /api/permissions/:id/roles/:roleId - Remove a permission from a role
  async removeFromRole(req: Request, res: Response) {
    try {
      const { roleId } = req.params;
      const result = await removePermissionFromRole(roleId, req.params.id);
      return successResponse(res, result, 'Permission removed from role successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to remove permission from role', 500);
    }
  },
};