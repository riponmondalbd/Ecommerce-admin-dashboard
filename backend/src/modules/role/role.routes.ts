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

export const roleRoutes = (app: Express) => {
  // GET /api/roles - List all roles (requires permission: role_management:read)
  app.get('/api/roles', requirePermission('role_management:read'), listRoles);

  // GET /api/roles/:id - Get single role (requires permission: role_management:read)
  app.get('/api/roles/:id', requirePermission('role_management:read'), getRole);

  // POST /api/roles - Create new role (requires permission: role_management:create)
  app.post('/api/roles', requirePermission('role_management:create'), createRoleController);

  // PUT /api/roles/:id - Full update of role (requires permission: role_management:update)
  app.put('/api/roles/:id', requirePermission('role_management:update'), updateRoleController);

  // PATCH /api/roles/:id - Partial update of role (requires permission: role_management:update)
  app.patch('/api/roles/:id', requirePermission('role_management:update'), partialUpdateRoleController);

  // DELETE /api/roles/:id - Delete role (requires permission: role_management:delete)
  app.delete('/api/roles/:id', requirePermission('role_management:delete'), deleteRoleController);

  // POST /api/roles/:roleId/permissions/:permissionId - Assign permission to role (requires permission: role_management:update)
  app.post(
    '/api/roles/:roleId/permissions/:permissionId',
    requirePermission('role_management:update'),
    assignPermissionToRoleController
  );

  // DELETE /api/roles/:roleId/permissions/:permissionId - Remove permission from role (requires permission: role_management:update)
  app.delete(
    '/api/roles/:roleId/permissions/:permissionId',
    requirePermission('role_management:update'),
    removePermissionFromRoleController
  );

  // GET /api/roles/:roleId/permissions - Get permissions for a role (requires permission: role_management:read)
  app.get('/api/roles/:roleId/permissions', requirePermission('role_management:read'), getPermissionsForRole);
};
