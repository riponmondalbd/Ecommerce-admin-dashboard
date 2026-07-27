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
  // GET /api/users - List all users (requires permission: user_management:read)
  app.get('/api/users', jwtAuthMiddleware, requirePermission('user_management:read'), listUsers);

  // GET /api/users/:id - Get single user (requires permission: user_management:read)
  app.get('/api/users/:id', jwtAuthMiddleware, requirePermission('user_management:read'), getUser);

  // POST /api/users - Create new user (requires permission: user_management:create)
  app.post('/api/users', jwtAuthMiddleware, requirePermission('user_management:create'), createUserController);

  // PUT /api/users/:id - Full update of user (requires permission: user_management:update)
  app.put('/api/users/:id', jwtAuthMiddleware, requirePermission('user_management:update'), updateUserController);

  // PATCH /api/users/:id - Partial update of user (requires permission: user_management:update)
  app.patch('/api/users/:id', jwtAuthMiddleware, requirePermission('user_management:update'), partialUpdateUserController);

  // DELETE /api/users/:id - Delete user (requires permission: user_management:delete)
  app.delete('/api/users/:id', jwtAuthMiddleware, requirePermission('user_management:delete'), deleteUserController);

  // PUT /api/users/:id/activate - Activate user (requires permission: user_management:update)
  app.put('/api/users/:id/activate', jwtAuthMiddleware, requirePermission('user_management:update'), activateUserController);

  // PUT /api/users/:id/deactivate - Deactivate user (requires permission: user_management:update)
  app.put('/api/users/:id/deactivate', jwtAuthMiddleware, requirePermission('user_management:update'), deactivateUserController);

  // PUT /api/users/:id/lock - Lock user (requires permission: user_management:update)
  app.put('/api/users/:id/lock', jwtAuthMiddleware, requirePermission('user_management:update'), lockUserController);

  // PUT /api/users/:id/unlock - Unlock user (requires permission: user_management:update)
  app.put('/api/users/:id/unlock', jwtAuthMiddleware, requirePermission('user_management:update'), unlockUserController);

  // GET /api/users/:roleId - Get users by role (requires permission: user_management:read)
  app.get('/api/users/:roleId', jwtAuthMiddleware, requirePermission('user_management:read'), getUsersByRoleController);
};
