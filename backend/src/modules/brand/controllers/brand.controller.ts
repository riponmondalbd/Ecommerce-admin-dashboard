import { Request, Response } from 'express';
import {
  getBrands,
  getBrandById,
  createBrand,
  updateBrand,
  partialUpdateBrand,
  deleteBrand,
  assignBrandMedia,
  removeBrandMedia,
} from '../services/brand.service';
import { errorResponse, successResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import { ListBrandDto, CreateBrandDto, UpdateBrandDto, PartialUpdateBrandDto } from '../../../validation/schemas';

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
 * GET /api/brands - Get all brands with pagination and search
 */
export const listBrands = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.query, ListBrandDto);
    getBrands(validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/brands/:id - Get a single brand by ID
 */
export const getBrand = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid brand ID', 400);
    }
    getBrandById(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/brands - Create new brand
 */
export const createBrandController = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.body, CreateBrandDto);
    createBrand(validated)
      .then((result) => {
        res.status(201).json({ success: true, data: result });
      })
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/brands/:id - Full update of brand
 */
export const updateBrandController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid brand ID', 400);
    }
    const validated = validateInput(req.body, UpdateBrandDto);
    updateBrand(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/brands/:id - Partial update of brand
 */
export const partialUpdateBrandController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid brand ID', 400);
    }
    const validated = validateInput(req.body, PartialUpdateBrandDto);
    partialUpdateBrand(id, validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/brands/:id - Delete a brand
 */
export const deleteBrandController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid brand ID', 400);
    }
    deleteBrand(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/brands/:brandId/media - Assign media (logo) to brand
 */
export const assignBrandMediaController = (req: Request, res: Response) => {
  try {
    const brandId = req.params.brandId;
    const mediaId = req.body.mediaId;
    if (!brandId || typeof brandId !== 'string') {
      throw new AppError('Invalid brand ID', 400);
    }
    if (!mediaId || typeof mediaId !== 'string') {
      throw new AppError('Invalid media ID', 400);
    }
    assignBrandMedia(brandId, mediaId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/brands/:brandId/media - Remove media (logo) from brand
 */
export const removeBrandMediaController = (req: Request, res: Response) => {
  try {
    const brandId = req.params.brandId;
    if (!brandId || typeof brandId !== 'string') {
      throw new AppError('Invalid brand ID', 400);
    }
    removeBrandMedia(brandId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};
