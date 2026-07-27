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
import { requirePermission } from '../permission/middleware/requirePermission.middleware';

export const productRoutes = (app: Express) => {
  // GET /api/products - List all products (requires permission: product:read)
  app.get('/api/products', requirePermission('product:read'), listProducts);

  // GET /api/products/:id - Get single product by ID (requires permission: product:read)
  app.get('/api/products/:id', requirePermission('product:read'), getProduct);

  // POST /api/products - Create new product (requires permission: product:create)
  app.post('/api/products', requirePermission('product:create'), createProductController);

  // PUT /api/products/:id - Full update of product (requires permission: product:update)
  app.put('/api/products/:id', requirePermission('product:update'), updateProductController);

  // PATCH /api/products/:id - Partial update of product (requires permission: product:update)
  app.patch('/api/products/:id', requirePermission('product:update'), partialUpdateProductController);

  // DELETE /api/products/:id - Delete product (requires permission: product:delete)
  app.delete('/api/products/:id', requirePermission('product:delete'), deleteProductController);

  // GET /api/products/:productId/variants - Get all variants for a product (requires permission: product:read)
  app.get('/api/products/:productId/variants', requirePermission('product:read'), getProductVariantsController);

  // POST /api/products/:productId/variants - Create new variant (requires permission: product:update)
  app.post('/api/products/:productId/variants', requirePermission('product:update'), createProductVariantController);

  // PUT /api/variants/:id - Full update of variant (requires permission: product:update)
  app.put('/api/variants/:id', requirePermission('product:update'), updateProductVariantController);

  // DELETE /api/variants/:id - Delete variant (requires permission: product:delete)
  app.delete('/api/variants/:id', requirePermission('product:delete'), deleteProductVariantController);

  // PUT /api/variants/:id/restock - Restock inventory (requires permission: product:update)
  app.put('/api/variants/:id/restock', requirePermission('product:update'), restockProductVariantController);

  // PUT /api/variants/:id/sell - Sell inventory (requires permission: product:update)
  app.put('/api/variants/:id/sell', requirePermission('product:update'), sellProductVariantController);

  // GET /api/products/:productId/transactions - Get transaction history (requires permission: product:read)
  app.get('/api/products/:productId/transactions', requirePermission('product:read'), getProductTransactionsController);
};
