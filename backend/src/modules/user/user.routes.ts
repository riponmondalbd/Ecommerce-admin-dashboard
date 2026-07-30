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
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../permission/middleware/requirePermission.middleware';

export const userRoutes = (app: Express) => {
  // GET /api/users - List all users (requires permission: user:read)
  app.get('/api/users', authenticate, requirePermission('user:read'), listUsers);

  // GET /api/users/:id - Get single user (requires permission: user:read)
  app.get('/api/users/:id', authenticate, requirePermission('user:read'), getUser);

  // POST /api/users - Create new user (requires permission: user:create)
  app.post('/api/users', authenticate, requirePermission('user:create'), createUserController);

  // PUT /api/users/:id - Full update of user (requires permission: user:update)
  app.put('/api/users/:id', authenticate, requirePermission('user:update'), updateUserController);

  // PATCH /api/users/:id - Partial update of user (requires permission: user:update)
  app.patch('/api/users/:id', authenticate, requirePermission('user:update'), partialUpdateUserController);

  // DELETE /api/users/:id - Delete user (requires permission: user:delete)
  app.delete('/api/users/:id', authenticate, requirePermission('user:delete'), deleteUserController);

  // PUT /api/users/:id/activate - Activate user (requires permission: user:update)
  app.put('/api/users/:id/activate', authenticate, requirePermission('user:update'), activateUserController);

  // PUT /api/users/:id/deactivate - Deactivate user (requires permission: user:update)
  app.put('/api/users/:id/deactivate', authenticate, requirePermission('user:update'), deactivateUserController);

  // PUT /api/users/:id/lock - Lock user (requires permission: user:update)
  app.put('/api/users/:id/lock', authenticate, requirePermission('user:update'), lockUserController);

  // PUT /api/users/:id/unlock - Unlock user (requires permission: user:update)
  app.put('/api/users/:id/unlock', authenticate, requirePermission('user:update'), unlockUserController);

  // GET /api/users/:roleId - Get users by role (requires permission: user:read)
  app.get('/api/users/:roleId', authenticate, requirePermission('user:read'), getUsersByRoleController);
};
