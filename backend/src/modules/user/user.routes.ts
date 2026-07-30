import { Express } from 'express';
import {
  listUsers,
  getUser,
  createUserController,
  updateUserController,
  partialUpdateUserController,
  deleteUserController,
  activateUserController,
  deactivateUserController,
  lockUserController,
  unlockUserController,
  getUsersByRoleController,
} from './controllers/user.controller';
import { jwtAuthMiddleware } from '../auth/middleware/jwtAuth.middleware';
import { requirePermission } from '../permission/middleware/requirePermission.middleware';

export const userRoutes = (app: Express) => {
  // GET /api/users - List all users (requires permission: user:read)
  app.get('/api/users', jwtAuthMiddleware, requirePermission('user:read'), listUsers);

  // GET /api/users/:id - Get single user (requires permission: user:read)
  app.get('/api/users/:id', jwtAuthMiddleware, requirePermission('user:read'), getUser);

  // POST /api/users - Create new user (requires permission: user:create)
  app.post('/api/users', jwtAuthMiddleware, requirePermission('user:create'), createUserController);

  // PUT /api/users/:id - Full update of user (requires permission: user:update)
  app.put('/api/users/:id', jwtAuthMiddleware, requirePermission('user:update'), updateUserController);

  // PATCH /api/users/:id - Partial update of user (requires permission: user:update)
  app.patch('/api/users/:id', jwtAuthMiddleware, requirePermission('user:update'), partialUpdateUserController);

  // DELETE /api/users/:id - Delete user (requires permission: user:delete)
  app.delete('/api/users/:id', jwtAuthMiddleware, requirePermission('user:delete'), deleteUserController);

  // PUT /api/users/:id/activate - Activate user (requires permission: user:update)
  app.put('/api/users/:id/activate', jwtAuthMiddleware, requirePermission('user:update'), activateUserController);

  // PUT /api/users/:id/deactivate - Deactivate user (requires permission: user:update)
  app.put('/api/users/:id/deactivate', jwtAuthMiddleware, requirePermission('user:update'), deactivateUserController);

  // PUT /api/users/:id/lock - Lock user (requires permission: user:update)
  app.put('/api/users/:id/lock', jwtAuthMiddleware, requirePermission('user:update'), lockUserController);

  // PUT /api/users/:id/unlock - Unlock user (requires permission: user:update)
  app.put('/api/users/:id/unlock', jwtAuthMiddleware, requirePermission('user:update'), unlockUserController);

  // GET /api/users/:roleId - Get users by role (requires permission: user:read)
  app.get('/api/users/:roleId', jwtAuthMiddleware, requirePermission('user:read'), getUsersByRoleController);
};
