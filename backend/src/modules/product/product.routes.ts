import { Express } from 'express';
import {
  listProducts,
  getProduct,
  createProductController,
  updateProductController,
  partialUpdateProductController,
  deleteProductController,
  getProductVariantsController,
  createProductVariantController,
  updateProductVariantController,
  deleteProductVariantController,
  restockProductVariantController,
  sellProductVariantController,
  getProductTransactionsController,
} from './controllers/product.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../permission/middleware/requirePermission.middleware';

export const productRoutes = (app: Express) => {
  // GET /api/products - List all products (requires permission: product:read)
  app.get('/api/products', authenticate, requirePermission('product:read'), listProducts);

  // GET /api/products/:id - Get single product by ID (requires permission: product:read)
  app.get('/api/products/:id', authenticate, requirePermission('product:read'), getProduct);

  // POST /api/products - Create new product (requires permission: product:create)
  app.post('/api/products', authenticate, requirePermission('product:create'), createProductController);

  // PUT /api/products/:id - Full update of product (requires permission: product:update)
  app.put('/api/products/:id', authenticate, requirePermission('product:update'), updateProductController);

  // PATCH /api/products/:id - Partial update of product (requires permission: product:update)
  app.patch('/api/products/:id', authenticate, requirePermission('product:update'), partialUpdateProductController);

  // DELETE /api/products/:id - Delete product (requires permission: product:delete)
  app.delete('/api/products/:id', authenticate, requirePermission('product:delete'), deleteProductController);

  // GET /api/products/:productId/variants - Get all variants for a product (requires permission: product:read)
  app.get('/api/products/:productId/variants', authenticate, requirePermission('product:read'), getProductVariantsController);

  // POST /api/products/:productId/variants - Create new variant (requires permission: product:update)
  app.post('/api/products/:productId/variants', authenticate, requirePermission('product:update'), createProductVariantController);

  // PUT /api/variants/:id - Full update of variant (requires permission: product:update)
  app.put('/api/variants/:id', authenticate, requirePermission('product:update'), updateProductVariantController);

  // DELETE /api/variants/:id - Delete variant (requires permission: product:delete)
  app.delete('/api/variants/:id', authenticate, requirePermission('product:delete'), deleteProductVariantController);

  // PUT /api/variants/:id/restock - Restock inventory (requires permission: product:update)
  app.put('/api/variants/:id/restock', authenticate, requirePermission('product:update'), restockProductVariantController);

  // PUT /api/variants/:id/sell - Sell inventory (requires permission: product:update)
  app.put('/api/variants/:id/sell', authenticate, requirePermission('product:update'), sellProductVariantController);

  // GET /api/products/:productId/transactions - Get transaction history (requires permission: product:read)
  app.get('/api/products/:productId/transactions', authenticate, requirePermission('product:read'), getProductTransactionsController);
};
