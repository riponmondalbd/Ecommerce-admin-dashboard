import { Request, Response } from 'express';
import {
  getAttributes,
  getAttributeById,
  createAttribute,
  updateAttribute,
  partialUpdateAttribute,
  deleteAttribute,
  getAttributeValues,
  createAttributeValue,
  updateAttributeValue,
  partialUpdateAttributeValue,
  deleteAttributeValue,
} from '../services/attribute.service';
import { errorResponse, successResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import {
  ListAttributeDto,
  CreateAttributeDto,
  UpdateAttributeDto,
  PartialUpdateAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
  PartialUpdateAttributeValueDto,
} from '../../../validation/schemas';

// Validate input helper
const validateInput = <T>(input: unknown, schema: any): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i: any) => i.message).join(', ');
    throw new AppError(`Validation failed: ${issues}`, 400);
  }
  return parsed.data;
};

/**
 * GET /api/attributes - Get all attributes with pagination and search
 */
export const listAttributes = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.query, ListAttributeDto);
    getAttributes(validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * GET /api/attributes/:id - Get a single attribute by ID
 */
export const getAttribute = (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid attribute ID', 400);
    }
    getAttributeById(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * POST /api/attributes - Create new attribute
 */
export const createAttributeController = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.body, CreateAttributeDto);
    createAttribute(validated)
      .then((result) => {
        res.status(201).json({ success: true, data: result });
      })
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * PUT /api/attributes/:id - Full update of attribute
 */
export const updateAttributeController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid attribute ID', 400);
    }
    const validated = validateInput(req.body, UpdateAttributeDto);
    updateAttribute(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * PATCH /api/attributes/:id - Partial update of attribute
 */
export const partialUpdateAttributeController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid attribute ID', 400);
    }
    const validated = validateInput(req.body, PartialUpdateAttributeDto);
    partialUpdateAttribute(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * DELETE /api/attributes/:id - Delete an attribute
 */
export const deleteAttributeController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid attribute ID', 400);
    }
    deleteAttribute(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * GET /api/attributes/:attributeId/values - Get all values for an attribute
 */
export const getAttributeValuesController = (req: Request, res: Response) => {
  try {
    const attributeId = req.params.attributeId;
    if (!attributeId || typeof attributeId !== 'string') {
      throw new AppError('Invalid attribute ID', 400);
    }
    getAttributeValues(attributeId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * POST /api/attributes/:attributeId/values - Create new attribute value
 */
export const createAttributeValueController = (req: Request, res: Response) => {
  try {
    const attributeId = req.params.attributeId;
    if (!attributeId || typeof attributeId !== 'string') {
      throw new AppError('Invalid attribute ID', 400);
    }
    req.body.attributeId = attributeId;
    const validated = validateInput(req.body, CreateAttributeValueDto);
    createAttributeValue(attributeId, validated)
      .then((result) => {
        res.status(201).json({ success: true, data: result });
      })
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * PUT /api/attribute-values/:id - Full update of attribute value
 */
export const updateAttributeValueController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid attribute value ID', 400);
    }
    const validated = validateInput(req.body, UpdateAttributeValueDto);
    updateAttributeValue(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * PATCH /api/attribute-values/:id - Partial update of attribute value
 */
export const partialUpdateAttributeValueController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid attribute value ID', 400);
    }
    const validated = validateInput(req.body, PartialUpdateAttributeValueDto);
    partialUpdateAttributeValue(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};

/**
 * DELETE /api/attribute-values/:id - Delete an attribute value
 */
export const deleteAttributeValueController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid attribute value ID', 400);
    }
    deleteAttributeValue(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error: any) {
    if (error instanceof AppError) {
      errorResponse(res, error.message, error.statusCode);
    } else {
      errorResponse(res, error.message || 'Internal server error', 500);
    }
  }
};
