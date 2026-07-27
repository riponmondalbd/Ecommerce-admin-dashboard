import { Request, Response } from 'express';
import {
  getMedia,
  getMediaById,
  createMedia,
  updateMedia,
  partialUpdateMedia,
  deleteMedia,
  getUserMedia,
} from '../services/media.service';
import { errorResponse, successResponse } from '../../../utils/apiResponse';
import { AppError } from '../../../utils/appError';
import { ListMediaDto } from '../../../validation/schemas';

// Validate input helper
const validateInput = <T>(input: unknown, schema: any): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => i.message).join(', ');
    throw new AppError(`Validation failed: ${issues}`, 400);
  }
  return parsed.data;
};

/**
 * GET /api/media - Get all media with pagination and search
 */
export const listMedia = (req: Request, res: Response) => {
  try {
    const validated = validateInput(req.query, ListMediaDto);
    getMedia(validated)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/media/:id - Get a single media by ID
 */
export const getMediaController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid media ID', 400);
    }
    getMediaById(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * POST /api/media - Create new media (file upload endpoint)
 * This is a Multer upload handler that expects file in field "file"
 */
export const createMediaController = (req: Request, res: Response) => {
  try {
    // req.file contains the uploaded file (from multer middleware)
    // req.body contains any form fields sent with the upload
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const requestBody = {
      uploadedById: (req as any)?.userId,
      ...req.body,
    };

    createMedia(req.file, requestBody)
      .then((result) => successResponse(res, result, 201))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PUT /api/media/:id - Full update of a media item
 */
export const updateMediaController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid media ID', 400);
    }
    const requestBody = {
      ...req.body,
    };
    updateMedia(id, requestBody)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * PATCH /api/media/:id - Partial update of a media item
 */
export const partialUpdateMediaController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid media ID', 400);
    }
    const requestBody = {
      ...req.body,
    };
    partialUpdateMedia(id, requestBody)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * DELETE /api/media/:id - Delete a media item
 */
export const deleteMediaController = (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    if (!id || typeof id !== 'string') {
      throw new AppError('Invalid media ID', 400);
    }
    deleteMedia(id)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};

/**
 * GET /api/media/assigned-to/:userId - Get all media assigned to a user
 */
export const getUserMediaController = (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    if (!userId || typeof userId !== 'string') {
      throw new AppError('Invalid user ID', 400);
    }
    getUserMedia(userId)
      .then((result) => successResponse(res, result))
      .catch((error) => errorResponse(res, error.message, error.statusCode || 500));
  } catch (error) {
    errorResponse(res, 'Internal server error', 500);
  }
};
