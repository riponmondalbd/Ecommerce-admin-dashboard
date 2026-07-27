import { Express } from 'express';
import {
  listCategories,
  getCategory,
  createCategoryController,
  updateCategoryController,
  partialUpdateCategoryController,
  deleteCategoryController,
  getCategoriesTreeController,
  getCategoryAncestorsController,
} from './controllers/category.controller';
import { requirePermission } from '../permission/middleware/requirePermission.middleware';

export const categoryRoutes = (app: Express) => {
  // GET /api/categories - List all categories (requires permission: category:read)
  app.get('/api/categories', requirePermission('category:read'), listCategories);

  // GET /api/categories/:id - Get single category by ID (requires permission: category:read)
  app.get('/api/categories/:id', requirePermission('category:read'), getCategory);

  // POST /api/categories - Create new category (requires permission: category:create)
  app.post('/api/categories', requirePermission('category:create'), createCategoryController);

  // PUT /api/categories/:id - Full update of category (requires permission: category:update)
  app.put('/api/categories/:id', requirePermission('category:update'), updateCategoryController);

  // PATCH /api/categories/:id - Partial update of category (requires permission: category:update)
  app.patch('/api/categories/:id', requirePermission('category:update'), partialUpdateCategoryController);

  // DELETE /api/categories/:id - Delete category (requires permission: category:delete)
  app.delete('/api/categories/:id', requirePermission('category:delete'), deleteCategoryController);

  // GET /api/categories/tree - Get hierarchical tree structure (requires permission: category:read)
  app.get('/api/categories/tree', requirePermission('category:read'), getCategoriesTreeController);

  // GET /api/categories/:id/ancestors - Get ancestors for breadcrumbs (requires permission: category:read)
  app.get('/api/categories/:id/ancestors', requirePermission('category:read'), getCategoryAncestorsController);
};
