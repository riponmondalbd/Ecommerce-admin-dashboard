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

export const permissionController = {
  // GET /api/permissions - List all permissions with pagination and search
  async list(req: Request, res: Response) {
    try {
      const queryParams = {
        page: req.query.page ? Number(req.query.page) : 1,
        limit: req.query.limit ? Number(req.query.limit) : 10,
        group: req.query.group as string | undefined,
        search: req.query.search as string | undefined,
        isActive: req.query.isActive === 'true'
      };
      const result = await getPermissions(queryParams);
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
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid permission ID' });
      }
      const permission = await getPermissionById(id);
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
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid permission ID' });
      }
      const permission = await updatePermission(id, req.body);
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
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid permission ID' });
      }
      const permission = await partialUpdatePermission(id, req.body);
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
      const id = req.params.id;
      if (!id || typeof id !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid permission ID' });
      }
      const result = await deletePermission(id);
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
      const id = req.params.id;
      const roleId = req.params.roleId;
      if (!id || !roleId || typeof id !== 'string' || typeof roleId !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid permission or role ID' });
      }
      const assignment = await assignPermissionToRole(roleId, id);
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
      const id = req.params.id;
      const roleId = req.params.roleId;
      if (!id || !roleId || typeof id !== 'string' || typeof roleId !== 'string') {
        return res.status(400).json({ success: false, message: 'Invalid permission or role ID' });
      }
      const result = await removePermissionFromRole(roleId, id);
      return successResponse(res, result, 'Permission removed from role successfully');
    } catch (error) {
      if (error instanceof AppError) {
        return errorResponse(res, error.message, error.statusCode);
      }
      return errorResponse(res, 'Failed to remove permission from role', 500);
    }
  },
};