import { Request, Response } from 'express';
import {
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  partialUpdateCategory,
  deleteCategory,
  getCategoriesTree,
  getCategoryAncestors,
} from '../services/category.service';
import { errorResponse, successResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import { ListCategoryDto, CreateCategoryDto, UpdateCategoryDto, PartialUpdateCategoryDto } from '../../../validation/schemas';

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
 * GET /api/categories - Get all categories with pagination and search
 */
export const listCategories = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.query, ListCategoryDto);
    getCategories(validated)
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
 * GET /api/categories/:id - Get a single category by ID
 */
export const getCategory = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid category ID', 400);
    }
    getCategoryById(id)
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
 * POST /api/categories - Create new category
 */
export const createCategoryController = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.body, CreateCategoryDto);
    createCategory(validated)
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
 * PUT /api/categories/:id - Full update of category
 */
export const updateCategoryController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid category ID', 400);
    }
    const validated = validateInput(req.body, UpdateCategoryDto);
    updateCategory(id, validated)
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
 * PATCH /api/categories/:id - Partial update of category
 */
export const partialUpdateCategoryController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid category ID', 400);
    }
    const validated = validateInput(req.body, PartialUpdateCategoryDto);
    partialUpdateCategory(id, validated)
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
 * DELETE /api/categories/:id - Delete a category
 */
export const deleteCategoryController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid category ID', 400);
    }
    deleteCategory(id)
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
 * GET /api/categories/tree - Get all categories as a hierarchical tree
 */
export const getCategoriesTreeController = (_req: Request, res: Response) => {
  try {
    getCategoriesTree()
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
 * GET /api/categories/:id/ancestors - Get ancestors for breadcrumb navigation
 */
export const getCategoryAncestorsController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid category ID', 400);
    }
    getCategoryAncestors(id)
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
