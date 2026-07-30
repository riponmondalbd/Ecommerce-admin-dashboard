import { Express } from 'express';
import {
  listRoles,
  getRole,
  createRoleController,
  updateRoleController,
  partialUpdateRoleController,
  deleteRoleController,
  assignPermissionToRoleController,
  removePermissionFromRoleController,
  getPermissionsForRole,
} from './controllers/role.controller';
import { requirePermission } from './middleware/requirePermission.middleware';
import { authenticate } from '../../middleware/auth.middleware';

export const roleRoutes = (app: Express) => {
  // GET /api/roles - List all roles (requires permission: role:read)
  app.get('/api/roles', authenticate, requirePermission('role:read'), listRoles);

  // GET /api/roles/:id - Get single role (requires permission: role:read)
  app.get('/api/roles/:id', authenticate, requirePermission('role:read'), getRole);

  // POST /api/roles - Create new role (requires permission: role:create)
  app.post('/api/roles', authenticate, requirePermission('role:create'), createRoleController);

  // PUT /api/roles/:id - Full update of role (requires permission: role:update)
  app.put('/api/roles/:id', authenticate, requirePermission('role:update'), updateRoleController);

  // PATCH /api/roles/:id - Partial update of role (requires permission: role:update)
  app.patch('/api/roles/:id', authenticate, requirePermission('role:update'), partialUpdateRoleController);

  // DELETE /api/roles/:id - Delete role (requires permission: role:delete)
  app.delete('/api/roles/:id', authenticate, requirePermission('role:delete'), deleteRoleController);

  // POST /api/roles/:roleId/permissions/:permissionId - Assign permission to role
  app.post(
    '/api/roles/:roleId/permissions/:permissionId',
    authenticate,
    requirePermission('role:update'),
    assignPermissionToRoleController
  );

  // DELETE /api/roles/:roleId/permissions/:permissionId - Remove permission from role
  app.delete(
    '/api/roles/:roleId/permissions/:permissionId',
    authenticate,
    requirePermission('role:update'),
    removePermissionFromRoleController
  );

  // GET /api/roles/:roleId/permissions - Get permissions for a role
  app.get('/api/roles/:roleId/permissions', authenticate, requirePermission('role:read'), getPermissionsForRole);
};
