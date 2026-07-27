import { Request, Response } from 'express';
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  partialUpdateProduct,
  deleteProduct,
  getProductVariants,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  restockProductVariant,
  sellProductVariant,
  getProductTransactions,
} from '../services/product.service';
import { errorResponse, successResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import {
  ListProductDto,
  CreateProductDto,
  UpdateProductDto,
  PartialUpdateProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
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
 * GET /api/products - Get all products with pagination and search
 */
export const listProducts = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.query, ListProductDto);
    getProducts(validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/products/:id - Get a single product by ID
 */
export const getProduct = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid product ID', 400);
    }
    getProductById(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/products - Create new product
 */
export const createProductController = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.body, CreateProductDto);
    createProduct(validated)
      .then((result) => {
        res.status(201).json({ success: true, data: result });
      })
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/products/:id - Full update of product
 */
export const updateProductController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid product ID', 400);
    }
    const validated = validateInput(req.body, UpdateProductDto);
    updateProduct(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/products/:id - Partial update of product
 */
export const partialUpdateProductController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid product ID', 400);
    }
    const validated = validateInput(req.body, PartialUpdateProductDto);
    partialUpdateProduct(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/products/:id - Delete a product
 */
export const deleteProductController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid product ID', 400);
    }
    deleteProduct(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/products/:productId/variants - Get all variants for a product
 */
export const getProductVariantsController = (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;
    if (!productId || typeof productId !== 'string') {
      throw new AppError('Invalid product ID', 400);
    }
    getProductVariants(productId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/products/:productId/variants - Create new variant
 */
export const createProductVariantController = (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;
    if (!productId || typeof productId !== 'string') {
      throw new AppError('Invalid product ID', 400);
    }
    const validated = validateInput(req.body, CreateProductVariantDto);
    createProductVariant(productId, validated)
      .then((result) => {
        res.status(201).json({ success: true, data: result });
      })
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/variants/:id - Full update of variant
 */
export const updateProductVariantController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid variant ID', 400);
    }
    const validated = validateInput(req.body, UpdateProductVariantDto);
    updateProductVariant(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/variants/:id - Delete a variant
 */
export const deleteProductVariantController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid variant ID', 400);
    }
    deleteProductVariant(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/variants/:id/restock - Restock inventory
 */
export const restockProductVariantController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid variant ID', 400);
    }
    const quantity = parseInt(req.body.quantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      throw new AppError('Invalid quantity', 400);
    }
    restockProductVariant(id, quantity)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/variants/:id/sell - Sell inventory
 */
export const sellProductVariantController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid variant ID', 400);
    }
    const quantity = parseInt(req.body.quantity, 10);
    if (isNaN(quantity) || quantity <= 0) {
      throw new AppError('Invalid quantity', 400);
    }
    sellProductVariant(id, quantity)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/products/:productId/transactions - Get transaction history
 */
export const getProductTransactionsController = (req: Request, res: Response) => {
  try {
    const productId = req.params.productId;
    if (!productId || typeof productId !== 'string') {
      throw new AppError('Invalid product ID', 400);
    }
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const page = parseInt(req.query.page as string, 10) || 1;
    getProductTransactions(productId, undefined, limit, page)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};
