import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import { CreateMediaDto, UpdateMediaDto, PartialUpdateMediaDto, ListMediaDto } from '../../../validation/schemas';
import { MediaType } from '@prisma/client';
import multer from 'multer';
import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';
import { env } from '../../../config/env';

/**
 * Resolve a writable upload directory for the current environment.
 * - In serverless / containerized production (e.g. Vercel), process.cwd() may be read-only.
 * - Fall back to /tmp/uploads which is always writable, otherwise use env.uploadDir.
 */
const resolveUploadDir = (): string => {
  // Try env.uploadDir first (e.g. ./uploads or /data/uploads)
  if (env.uploadDir) {
    return env.uploadDir;
  }
  // Default: use a platform-appropriate writable directory
  try {
    const fallback = path.join(process.cwd(), 'uploads');
    return fallback;
  } catch {
    return '/tmp/uploads';
  }
};

const uploadDir = resolveUploadDir();

// Ensure the upload directory exists before multer starts
void fs.mkdir(uploadDir, { recursive: true }).catch((err) => {
  console.warn('[media] Failed to create upload dir:', err?.message);
});

// Configure storage - use disk storage for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    void fs.mkdir(uploadDir, { recursive: true })
      .then(() => cb(null, uploadDir))
      .catch(() => cb(null, uploadDir));
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueName = `${basename}-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

// File size limit (10MB matching app.ts config)
const fileFilter = (_req: any, file: any, cb: any) => {
  // Accept common image, video, and document types
  const acceptedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 'image/webp',
    'video/mp4', 'video/quicktime',
    'application/pdf', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (acceptedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('File type not supported', 400));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Validate the input against Zod schemas
const validateInput = <T>(input: unknown, schema: z.Schema<T>): T => {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    const issues = parsed.error.issues.map(i => i.message).join(', ');
    throw new AppError(`Validation failed: ${issues}`, 400);
  }
  return parsed.data;
};

/**
 * Generate a thumbnail using Sharp
 */
const generateThumbnail = async (filePath: string, width = 300, height = 300): Promise<string> => {
  try {
    const thumbnailPath = filePath + '.thumb';
    await sharp(filePath)
      .resize(width, height, { fit: 'cover' })
      .toFormat('jpeg')
      .toFile(thumbnailPath);
    return thumbnailPath;
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    // If thumbnail generation fails, don't fail the main upload
    return filePath;
  }
};

/**
 * Get all media with optional filtering and pagination
 */
export const getMedia = async (input: unknown) => {
  const validated = validateInput(input, ListMediaDto);

  const where: any = {};

  if (validated.search !== undefined && validated.search !== '') {
    where.name = {
      contains: validated.search,
      mode: 'insensitive',
    };
  }

  if (validated.type !== undefined) {
    where.type = validated.type;
  }

  if (validated.status !== undefined) {
    where.status = validated.status;
  }

  if (validated.uploadedBy !== undefined && validated.uploadedBy !== '') {
    where.uploadedById = validated.uploadedBy;
  }

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  const [media, total] = await Promise.all([
    prisma.media.findMany({
      where,
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
      include: {
        uploadedBy: { select: { name: true, email: true } },
      },
    }),
    prisma.media.count({ where }),
  ]);

  return {
    data: media,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Get a single media by ID
 */
export const getMediaById = async (id: string) => {
  const media = await prisma.media.findUnique({
    where: { id },
    include: {
      uploadedBy: { select: { name: true, email: true } },
    },
  });

  if (!media) {
    throw new AppError('Media not found', 404);
  }

  return media;
};

/**
 * Create a new media item (after file is uploaded)
 */
export const createMedia = async (uploadedFile: any, requestBody: unknown) => {
  // Extract file details from uploaded multer file
  const fileName = uploadedFile.filename;
  const filePath = uploadedFile.path;
  const size = uploadedFile.size;

  // Determine media type based on file extension
  const ext = path.extname(fileName).toLowerCase();
  const typeMap: Record<string, MediaType> = {
    '.jpeg': MediaType.IMAGE,
    '.jpg': MediaType.IMAGE,
    '.png': MediaType.IMAGE,
    '.gif': MediaType.IMAGE,
    '.webp': MediaType.IMAGE,
    '.mp4': MediaType.VIDEO,
    '.mov': MediaType.VIDEO,
    '.pdf': MediaType.DOCUMENT,
    '.doc': MediaType.DOCUMENT,
    '.docx': MediaType.DOCUMENT,
    '.txt': MediaType.DOCUMENT,
    '.other': MediaType.OTHER,
  };

  let type: MediaType;
  if (ext && typeMap[ext]) {
    type = typeMap[ext];
  } else {
    type = MediaType.OTHER;
  }
  
  const publicUrl = `${env.baseUrl}/uploads/${fileName}`;

  const fullData = {
    ...(typeof requestBody === 'object' && requestBody !== null ? requestBody : {}),
    fileName,
    filePath,
    publicUrl,
    type,
    size,
    status: 'PROCESSING',
  };

  const validated = validateInput(fullData, CreateMediaDto);

  const media = await prisma.media.create({
    data: {
      fileName: validated.fileName,
      filePath: validated.filePath,
      publicUrl: validated.publicUrl,
      type: validated.type,
      size: validated.size,
      metadata: { originalName: uploadedFile.originalname, size } as any,
      uploadedById: validated.uploadedById,
      status: validated.status,
    },
    include: { uploadedBy: { select: { name: true, email: true } } },
  });

  // Generate thumbnail in background (non-blocking)
  generateThumbnail(media.filePath, 300, 300).then(() => {
    // Update status to READY after thumbnail generation
    prisma.media.update({
      where: { id: media.id },
      data: { status: 'READY' },
    }).catch(console.error);
  });

  return media;
};

/**
 * Update an existing media item (PUT - full replacement)
 */
export const updateMedia = async (id: string, input: unknown) => {
  const validated = validateInput(input, UpdateMediaDto);

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    throw new AppError('Media not found', 404);
  }

  const updateData: any = {};

  if (validated.fileName !== undefined) updateData.fileName = validated.fileName;
  if (validated.filePath !== undefined) updateData.filePath = validated.filePath;
  if (validated.publicUrl !== undefined) updateData.publicUrl = validated.publicUrl;
  if (validated.type !== undefined) updateData.type = validated.type;
  if (validated.size !== undefined) updateData.size = validated.size;
  if (validated.metadata !== undefined) updateData.metadata = validated.metadata;
  if (validated.status !== undefined) updateData.status = validated.status;

  return await prisma.media.update({
    where: { id },
    data: updateData,
    include: { uploadedBy: { select: { name: true, email: true } } },
  });
};

/**
 * Partially update a media item (PATCH)
 */
export const partialUpdateMedia = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdateMediaDto);

  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    throw new AppError('Media not found', 404);
  }

  const updateData: any = {};

  if (validated.fileName !== undefined) updateData.fileName = validated.fileName;
  if (validated.filePath !== undefined) updateData.filePath = validated.filePath;
  if (validated.publicUrl !== undefined) updateData.publicUrl = validated.publicUrl;
  if (validated.type !== undefined) updateData.type = validated.type;
  if (validated.size !== undefined) updateData.size = validated.size;
  if (validated.metadata !== undefined) updateData.metadata = validated.metadata;
  if (validated.status !== undefined) updateData.status = validated.status;

  return await prisma.media.update({
    where: { id },
    data: updateData,
    include: { uploadedBy: { select: { name: true, email: true } } },
  });
};

/**
 * Delete a media item with cleanup of files.
 * Refuses deletion while the asset is attached to any product, variant, brand, or category.
 */
export const deleteMedia = async (id: string) => {
  const media = await prisma.media.findUnique({ where: { id } });
  if (!media) {
    throw new AppError('Media not found', 404);
  }

  // Safety guard: refuse deletion while still referenced by any product, variant, brand, or category
  const [productCount, variantCount, brandCount, categoryCount] = await Promise.all([
    prisma.productMedia.count({ where: { mediaId: id } }),
    prisma.variantMedia.count({ where: { mediaId: id } }),
    prisma.brand.count({ where: { mediaId: id } }),
    prisma.category.count({ where: { mediaId: id } }),
  ]);

  const totalReferences = productCount + variantCount + brandCount + categoryCount;
  if (totalReferences > 0) {
    throw new AppError(
      `Cannot delete media: "${media.fileName}" is still referenced by ${totalReferences} resource(s) (products: ${productCount}, variants: ${variantCount}, brands: ${brandCount}, categories: ${categoryCount}). Remove the references first.`,
      400,
    );
  }

  // Delete from filesystem (files are stored in uploads directory)
  try {
    await fs.unlink(media.filePath);
    // Also delete thumbnail if it exists
    const thumbPath = media.filePath + '.thumb';
    try {
      await fs.unlink(thumbPath);
    } catch {
      // If thumbnail doesn't exist or can't be deleted, ignore it
    }
  } catch (err) {
    console.warn('Could not delete file from filesystem:', err);
    // Don't fail the operation if file deletion fails
  }

  await prisma.media.delete({ where: { id } });
  return { success: true, message: 'Media deleted successfully' };
};

/**
 * Get media assigned to a specific user
 */
export const getUserMedia = async (userId: string) => {
  const media = await prisma.media.findMany({
    where: { uploadedById: userId },
    orderBy: { createdAt: 'desc' },
    include: {
      uploadedBy: { select: { name: true, email: true } },
    },
  });

  return media;
};
