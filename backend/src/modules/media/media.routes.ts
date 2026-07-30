import { Express } from 'express';
import {
  listMedia,
  getMediaController,
  createMediaController,
  updateMediaController,
  partialUpdateMediaController,
  deleteMediaController,
  getUserMediaController,
} from './controllers/media.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../permission/middleware/requirePermission.middleware';
// Import multer upload handler for file uploads
import { upload } from './services/media.service';

export const mediaRoutes = (app: Express) => {
  // GET /api/media - List all media (requires permission: media:read)
  app.get('/api/media', authenticate, requirePermission('media:read'), listMedia);

  // GET /api/media/:id - Get single media by ID (requires permission: media:read)
  app.get('/api/media/:id', authenticate, requirePermission('media:read'), getMediaController);

  // POST /api/media - Upload new media (requires permission: media:create)
  app.post('/api/media', authenticate, requirePermission('media:create'), upload.single('file'), createMediaController);

  // PUT /api/media/:id - Full update of media (requires permission: media:update)
  app.put('/api/media/:id', authenticate, requirePermission('media:update'), updateMediaController);

  // PATCH /api/media/:id - Partial update of media (requires permission: media:update)
  app.patch('/api/media/:id', authenticate, requirePermission('media:update'), partialUpdateMediaController);

  // DELETE /api/media/:id - Delete media (requires permission: media:delete)
  app.delete('/api/media/:id', authenticate, requirePermission('media:delete'), deleteMediaController);

  // GET /api/media/assigned-to/:userId - Get users' own media (requires media:read)
  app.get('/api/media/assigned-to/:userId', authenticate, requirePermission('media:read'), getUserMediaController);
};
