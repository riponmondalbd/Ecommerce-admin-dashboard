import { Express } from 'express';
import {
  listBrands,
  getBrand,
  createBrandController,
  updateBrandController,
  partialUpdateBrandController,
  deleteBrandController,
  assignBrandMediaController,
  removeBrandMediaController,
} from './controllers/brand.controller';
import { requirePermission } from '../permission/middleware/requirePermission.middleware';

export const brandRoutes = (app: Express) => {
  // GET /api/brands - List all brands (requires permission: brand:read)
  app.get('/api/brands', requirePermission('brand:read'), listBrands);

  // GET /api/brands/:id - Get single brand by ID (requires permission: brand:read)
  app.get('/api/brands/:id', requirePermission('brand:read'), getBrand);

  // POST /api/brands - Create new brand (requires permission: brand:create)
  app.post('/api/brands', requirePermission('brand:create'), createBrandController);

  // PUT /api/brands/:id - Full update of brand (requires permission: brand:update)
  app.put('/api/brands/:id', requirePermission('brand:update'), updateBrandController);

  // PATCH /api/brands/:id - Partial update of brand (requires permission: brand:update)
  app.patch('/api/brands/:id', requirePermission('brand:update'), partialUpdateBrandController);

  // DELETE /api/brands/:id - Delete brand (requires permission: brand:delete)
  app.delete('/api/brands/:id', requirePermission('brand:delete'), deleteBrandController);

  // POST /api/brands/:brandId/media - Assign media (logo) to brand (requires permission: brand:update)
  app.post('/api/brands/:brandId/media', requirePermission('brand:update'), assignBrandMediaController);

  // DELETE /api/brands/:brandId/media - Remove media (logo) from brand (requires permission: brand:update)
  app.delete('/api/brands/:brandId/media', requirePermission('brand:update'), removeBrandMediaController);
};
