import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import {
  CreateBrandDto,
  UpdateBrandDto,
  PartialUpdateBrandDto,
  ListBrandDto,
} from '../../../validation/schemas';

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
 * Get all brands with optional filtering and pagination
 */
export const getBrands = async (input: unknown) => {
  const validated = validateInput(input, ListBrandDto);

  const where: any = {};

  if (validated.search !== undefined && validated.search !== '') {
    where.name = {
      contains: validated.search,
      mode: 'insensitive',
    };
  }

  if (validated.status !== undefined) {
    where.status = validated.status;
  }

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      where,
      take: limit,
      skip,
      orderBy: { name: 'asc' },
      include: {
        media: { select: { id: true, fileName: true, publicPath: true } },
      },
    }),
    prisma.brand.count({ where }),
  ]);

  return {
    data: brands,
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
 * Get a single brand by ID
 */
export const getBrandById = async (id: string) => {
  const brand = await prisma.brand.findUnique({
    where: { id },
    include: {
      media: { select: { id: true, fileName: true, publicPath: true } },
    },
  });

  if (!brand) {
    throw new AppError('Brand not found', 404);
  }

  return brand;
};

/**
 * Create a new brand
 */
export const createBrand = async (input: unknown) => {
  const validated = validateInput(input, CreateBrandDto);

  // Check if brand name already exists
  const existing = await prisma.brand.findUnique({ where: { name: validated.name } });
  if (existing) {
    throw new AppError('Brand with this name already exists', 409);
  }

  // If mediaId is provided, verify the media exists
  if (validated.mediaId) {
    const media = await prisma.media.findUnique({ where: { id: validated.mediaId } });
    if (!media) {
      throw new AppError('Media not found', 404);
    }
  }

  const brand = await prisma.brand.create({
    data: {
      name: validated.name,
      description: validated.description,
      status: validated.status,
      mediaId: validated.mediaId || undefined,
    },
    include: { media: { select: { id: true, fileName: true } } },
  });

  return brand;
};

/**
 * Update an existing brand (PUT - full replacement)
 */
export const updateBrand = async (id: string, input: unknown) => {
  const validated = validateInput(input, UpdateBrandDto);

  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }

  // Check if new name conflicts with another brand
  if (validated.name !== brand.name) {
    const existing = await prisma.brand.findUnique({ where: { name: validated.name } });
    if (existing) {
      throw new AppError('Brand with this name already exists', 409);
    }
  }

  // If mediaId is provided, verify the media exists
  if (validated.mediaId) {
    const media = await prisma.media.findUnique({ where: { id: validated.mediaId } });
    if (!media) {
      throw new AppError('Media not found', 404);
    }
  }

  return await prisma.brand.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description,
      status: validated.status,
      mediaId: validated.mediaId || undefined,
    },
    include: { media: { select: { id: true, fileName: true } } },
  });
};

/**
 * Partially update a brand (PATCH)
 */
export const partialUpdateBrand = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdateBrandDto);

  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) {
    if (validated.name !== brand.name) {
      const existing = await prisma.brand.findUnique({ where: { name: validated.name } });
      if (existing) throw new AppError('Brand with this name already exists', 409);
    }
    updateData.name = validated.name;
  }

  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.status !== undefined) updateData.status = validated.status;
  if (validated.mediaId !== undefined) {
    if (validated.mediaId) {
      const media = await prisma.media.findUnique({ where: { id: validated.mediaId } });
      if (!media) throw new AppError('Media not found', 404);
    }
    updateData.mediaId = validated.mediaId || null;
  }

  return await prisma.brand.update({
    where: { id },
    data: updateData,
    include: { media: { select: { id: true, fileName: true } } },
  });
};

/**
 * Delete a brand
 */
export const deleteBrand = async (id: string) => {
  const brand = await prisma.brand.findUnique({ where: { id } });
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }

  await prisma.brand.delete({ where: { id } });
  return { success: true, message: 'Brand deleted successfully' };
};

/**
 * Assign media (logo) to a brand
 */
export const assignBrandMedia = async (brandId: string, mediaId: string) => {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) {
    throw new AppError('Media not found', 404);
  }

  return await prisma.brand.update({
    where: { id: brandId },
    data: { mediaId },
    include: { media: { select: { id: true, fileName: true } } },
  });
};

/**
 * Remove media (logo) from a brand
 */
export const removeBrandMedia = async (brandId: string) => {
  const brand = await prisma.brand.findUnique({ where: { id: brandId } });
  if (!brand) {
    throw new AppError('Brand not found', 404);
  }

  return await prisma.brand.update({
    where: { id: brandId },
    data: { mediaId: null },
  });
};

/**
 * Get all brands with their media attached
 */
export const getBrandsWithMedia = async () => {
  return await prisma.brand.findMany({
    include: { media: true },
  });
};
