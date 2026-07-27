import { Express } from 'express';
import {
  listAttributes,
  getAttribute,
  createAttributeController,
  updateAttributeController,
  partialUpdateAttributeController,
  deleteAttributeController,
  getAttributeValuesController,
  createAttributeValueController,
  updateAttributeValueController,
  partialUpdateAttributeValueController,
  deleteAttributeValueController,
} from './controllers/attribute.controller';
import { requirePermission } from '../permission/middleware/requirePermission.middleware';

export const attributeRoutes = (app: Express) => {
  // GET /api/attributes - List all attributes (requires permission: attribute:read)
  app.get('/api/attributes', requirePermission('attribute:read'), listAttributes);

  // GET /api/attributes/:id - Get single attribute by ID (requires permission: attribute:read)
  app.get('/api/attributes/:id', requirePermission('attribute:read'), getAttribute);

  // POST /api/attributes - Create new attribute (requires permission: attribute:create)
  app.post('/api/attributes', requirePermission('attribute:create'), createAttributeController);

  // PUT /api/attributes/:id - Full update of attribute (requires permission: attribute:update)
  app.put('/api/attributes/:id', requirePermission('attribute:update'), updateAttributeController);

  // PATCH /api/attributes/:id - Partial update of attribute (requires permission: attribute:update)
  app.patch('/api/attributes/:id', requirePermission('attribute:update'), partialUpdateAttributeController);

  // DELETE /api/attributes/:id - Delete attribute (requires permission: attribute:delete)
  app.delete('/api/attributes/:id', requirePermission('attribute:delete'), deleteAttributeController);

  // GET /api/attributes/:attributeId/values - Get values for an attribute (requires permission: attribute:read)
  app.get('/api/attributes/:attributeId/values', requirePermission('attribute:read'), getAttributeValuesController);

  // POST /api/attributes/:attributeId/values - Create new value (requires permission: attribute:update)
  app.post('/api/attributes/:attributeId/values', requirePermission('attribute:update'), createAttributeValueController);

  // PUT /api/attribute-values/:id - Full update of attribute value (requires permission: attribute:update)
  app.put('/api/attribute-values/:id', requirePermission('attribute:update'), updateAttributeValueController);

  // PATCH /api/attribute-values/:id - Partial update of attribute value (requires permission: attribute:update)
  app.patch('/api/attribute-values/:id', requirePermission('attribute:update'), partialUpdateAttributeValueController);

  // DELETE /api/attribute-values/:id - Delete attribute value (requires permission: attribute:delete)
  app.delete('/api/attribute-values/:id', requirePermission('attribute:delete'), deleteAttributeValueController);
};
