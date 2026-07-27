import { Express } from 'express';
import { permissionController } from './controllers/permission.controller';
import { requirePermission } from './middleware/requirePermission.middleware';
import { jwtAuthMiddleware } from '../auth/middleware/jwtAuth.middleware';

/**
 * Mount permission routes on the Express app.
 * All endpoints are protected with JWT authentication and require appropriate permissions.
 */
export const permissionRoutes = (app: Express) => {
  // GET /api/permissions - List all permissions (requires permission_management:read)
  app.get('/api/permissions', jwtAuthMiddleware, requirePermission('permission_management:read'), permissionController.list);

  // GET /api/permissions/:id - Get a single permission (requires permission_management:read)
  app.get('/api/permissions/:id', jwtAuthMiddleware, requirePermission('permission_management:read'), permissionController.getById);

  // POST /api/permissions - Create a new permission (requires permission_management:create)
  app.post('/api/permissions', jwtAuthMiddleware, requirePermission('permission_management:create'), permissionController.create);

  // PUT /api/permissions/:id - Update a permission (requires permission_management:update)
  app.put('/api/permissions/:id', jwtAuthMiddleware, requirePermission('permission_management:update'), permissionController.update);

  // PATCH /api/permissions/:id - Partially update a permission (requires permission_management:update)
  app.patch('/api/permissions/:id', jwtAuthMiddleware, requirePermission('permission_management:update'), permissionController.partialUpdate);

  // DELETE /api/permissions/:id - Delete a permission (requires permission_management:delete)
  app.delete('/api/permissions/:id', jwtAuthMiddleware, requirePermission('permission_management:delete'), permissionController.delete);

  // POST /api/permissions/:id/roles/:roleId - Assign a permission to a role (requires permission_management:update)
  app.post('/api/permissions/:id/roles/:roleId', jwtAuthMiddleware, requirePermission('permission_management:update'), permissionController.assignToRole);

  // DELETE /api/permissions/:id/roles/:roleId - Remove a permission from a role (requires permission_management:update)
  app.delete('/api/permissions/:id/roles/:roleId', jwtAuthMiddleware, requirePermission('permission_management:update'), permissionController.removeFromRole);
};