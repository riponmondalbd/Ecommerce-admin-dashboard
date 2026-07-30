import { Express } from 'express';
import { permissionController } from './controllers/permission.controller';
import { requirePermission } from './middleware/requirePermission.middleware';
import { authenticate } from '../../middleware/auth.middleware';

/**
 * Mount permission routes on the Express app.
 * All endpoints are protected with JWT authentication and require appropriate permissions.
 */
export const permissionRoutes = (app: Express) => {
  // GET /api/permissions - List all permissions (requires permission:read)
  app.get('/api/permissions', authenticate, requirePermission('permission:read'), permissionController.list);

  // GET /api/permissions/:id - Get a single permission (requires permission:read)
  app.get('/api/permissions/:id', authenticate, requirePermission('permission:read'), permissionController.getById);

  // POST /api/permissions - Create a new permission (requires permission:create)
  app.post('/api/permissions', authenticate, requirePermission('permission:create'), permissionController.create);

  // PUT /api/permissions/:id - Update a permission (requires permission:update)
  app.put('/api/permissions/:id', authenticate, requirePermission('permission:update'), permissionController.update);

  // PATCH /api/permissions/:id - Partially update a permission (requires permission:update)
  app.patch('/api/permissions/:id', authenticate, requirePermission('permission:update'), permissionController.partialUpdate);

  // DELETE /api/permissions/:id - Delete a permission (requires permission:delete)
  app.delete('/api/permissions/:id', authenticate, requirePermission('permission:delete'), permissionController.delete);

  // POST /api/permissions/:id/roles/:roleId - Assign a permission to a role (requires permission:update)
  app.post(
    '/api/permissions/:id/roles/:roleId',
    authenticate,
    requirePermission('permission:update'),
    permissionController.assignToRole
  );

  // DELETE /api/permissions/:id/roles/:roleId - Remove a permission from a role (requires permission:update)
  app.delete(
    '/api/permissions/:id/roles/:roleId',
    authenticate,
    requirePermission('permission:update'),
    permissionController.removeFromRole
  );
};
