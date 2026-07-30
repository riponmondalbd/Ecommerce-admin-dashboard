import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import {
  CreateAttributeDto,
  UpdateAttributeDto,
  PartialUpdateAttributeDto,
  ListAttributeDto,
  CreateAttributeValueDto,
  UpdateAttributeValueDto,
  PartialUpdateAttributeValueDto,
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
 * Get all attributes with optional filtering and pagination
 */
export const getAttributes = async (input: unknown) => {
  const validated = validateInput(input, ListAttributeDto);

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

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  const [attributes, total] = await Promise.all([
    prisma.attribute.findMany({
      where,
      take: limit,
      skip,
      orderBy: { name: 'asc' },
      include: {
        attributeValues: {
          orderBy: { sortOrder: 'asc' },
          select: { id: true, slug: true, label: true, referenceValue: true, sortOrder: true },
        },
      },
    }),
    prisma.attribute.count({ where }),
  ]);

  return {
    data: attributes,
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
 * Get a single attribute by ID
 */
export const getAttributeById = async (id: string) => {
  const attribute = await prisma.attribute.findUnique({
    where: { id },
    include: {
      attributeValues: {
        orderBy: { sortOrder: 'asc' },
        select: { id: true, slug: true, label: true, referenceValue: true, sortOrder: true },
      },
    },
  });

  if (!attribute) {
    throw new AppError('Attribute not found', 404);
  }

  return attribute;
};

/**
 * Create a new attribute
 */
export const createAttribute = async (input: unknown) => {
  const validated = validateInput(input, CreateAttributeDto);

  // Check if attribute name already exists
  const existing = await prisma.attribute.findUnique({ where: { name: validated.name } });
  if (existing) {
    throw new AppError('Attribute with this name already exists', 409);
  }

  // Generate slug if not provided
  const slug = validated.slug || validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Check if slug already exists
  const existingSlug = await prisma.attribute.findUnique({ where: { slug: slug.toLowerCase() } });
  if (existingSlug) {
    throw new AppError('Slug must be unique', 409);
  }

  const attribute = await prisma.attribute.create({
    data: {
      name: validated.name,
      slug: slug.toLowerCase(),
      type: validated.type as any, // Cast to bypass type checking - Prisma handles numeric enums
      description: validated.description,
    },
    include: {
      attributeValues: { select: { id: true, label: true } },
    },
  });

  return attribute;
};

/**
 * Update an existing attribute (PUT - full replacement)
 */
export const updateAttribute = async (id: string, input: unknown) => {
  const validated = validateInput(input, UpdateAttributeDto);

  const attribute = await prisma.attribute.findUnique({ where: { id } });
  if (!attribute) {
    throw new AppError('Attribute not found', 404);
  }

  // Check if name conflicts with another attribute
  if (validated.name !== attribute.name) {
    const existing = await prisma.attribute.findUnique({ where: { name: validated.name } });
    if (existing) {
      throw new AppError('Attribute with this name already exists', 409);
    }
  }

  // Check if slug conflicts
  if (validated.slug && validated.slug !== attribute.slug) {
    const existingSlug = await prisma.attribute.findUnique({ where: { slug: validated.slug } });
    if (existingSlug) {
      throw new AppError('Slug must be unique', 409);
    }
  }

  return await prisma.attribute.update({
    where: { id },
    data: {
      name: validated.name,
      slug: validated.slug,
      type: validated.type as any, // Cast to bypass type checking
      description: validated.description,
    },
    include: {
      attributeValues: { select: { id: true, label: true } },
    },
  });
};

/**
 * Partially update an attribute (PATCH)
 */
export const partialUpdateAttribute = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdateAttributeDto);

  const attribute = await prisma.attribute.findUnique({ where: { id } });
  if (!attribute) {
    throw new AppError('Attribute not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) {
    if (validated.name !== attribute.name) {
      const existing = await prisma.attribute.findUnique({ where: { name: validated.name } });
      if (existing) throw new AppError('Attribute with this name already exists', 409);
    }
    updateData.name = validated.name;
  }

  if (validated.slug !== undefined) {
    if (validated.slug !== attribute.slug) {
      const existing = await prisma.attribute.findUnique({ where: { slug: validated.slug } });
      if (existing) throw new AppError('Slug must be unique', 409);
    }
    updateData.slug = validated.slug;
  }

  if (validated.type !== undefined) updateData.type = validated.type;
  if (validated.description !== undefined) updateData.description = validated.description;

  return await prisma.attribute.update({
    where: { id },
    data: updateData,
    include: {
      attributeValues: { select: { id: true, label: true } },
    },
  });
};

/**
 * Delete an attribute with safety guards (cannot delete if it has attribute values)
 */
export const deleteAttribute = async (id: string) => {
  const attribute = await prisma.attribute.findUnique({ where: { id } });
  if (!attribute) {
    throw new AppError('Attribute not found', 404);
  }

  // Safety guard: Cannot delete attribute if it has attribute values assigned
  const valueCount = await prisma.attributeValue.count({
    where: { attributeId: id },
  });

  if (valueCount > 0) {
    throw new AppError(`Cannot delete attribute: "${attribute.name}" has ${valueCount} attribute value(s)`, 400);
  }

  await prisma.attribute.delete({ where: { id } });
  return { success: true, message: 'Attribute deleted successfully' };
};

/**
 * Get all attribute values for an attribute
 */
export const getAttributeValues = async (attributeId: string) => {
  const attribute = await prisma.attribute.findUnique({ where: { id: attributeId } });
  if (!attribute) {
    throw new AppError('Attribute not found', 404);
  }

  const values = await prisma.attributeValue.findMany({
    where: { attributeId },
    orderBy: { sortOrder: 'asc' },
  });

  return values;
};

/**
 * Create a new attribute value
 */
export const createAttributeValue = async (attributeId: string, input: unknown) => {
  const validated = validateInput(input, CreateAttributeValueDto);

  // Verify attribute exists
  const attribute = await prisma.attribute.findUnique({ where: { id: attributeId } });
  if (!attribute) {
    throw new AppError('Attribute not found', 404);
  }

  // Generate slug if not provided
  const slug = validated.slug || validated.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Check if slug already exists
  const existingSlug = await prisma.attributeValue.findUnique({ where: { slug: slug.toLowerCase() } });
  if (existingSlug) {
    throw new AppError('Slug must be unique', 409);
  }

  const attributeValue = await prisma.attributeValue.create({
    data: {
      slug: slug.toLowerCase(),
      label: validated.label,
      referenceValue: validated.referenceValue,
      sortOrder: validated.sortOrder || 0,
      attributeId,
    },
  });

  return attributeValue;
};

/**
 * Update an existing attribute value
 */
export const updateAttributeValue = async (id: string, input: unknown) => {
  const validated = validateInput(input, UpdateAttributeValueDto);

  const attributeValue = await prisma.attributeValue.findUnique({ where: { id } });
  if (!attributeValue) {
    throw new AppError('Attribute value not found', 404);
  }

  // Check if slug conflicts
  if (validated.slug && validated.slug !== attributeValue.slug) {
    const existingSlug = await prisma.attributeValue.findUnique({ where: { slug: validated.slug } });
    if (existingSlug) {
      throw new AppError('Slug must be unique', 409);
    }
  }

  return await prisma.attributeValue.update({
    where: { id },
    data: {
      slug: validated.slug,
      label: validated.label,
      referenceValue: validated.referenceValue,
      sortOrder: validated.sortOrder,
    },
  });
};

/**
 * Partially update an attribute value (PATCH)
 */
export const partialUpdateAttributeValue = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdateAttributeValueDto);

  const attributeValue = await prisma.attributeValue.findUnique({ where: { id } });
  if (!attributeValue) {
    throw new AppError('Attribute value not found', 404);
  }

  const updateData: any = {};

  if (validated.slug !== undefined) {
    if (validated.slug !== attributeValue.slug) {
      const existing = await prisma.attributeValue.findUnique({ where: { slug: validated.slug } });
      if (existing) throw new AppError('Slug must be unique', 409);
    }
    updateData.slug = validated.slug;
  }

  if (validated.label !== undefined) updateData.label = validated.label;
  if (validated.referenceValue !== undefined) updateData.referenceValue = validated.referenceValue;
  if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;

  return await prisma.attributeValue.update({
    where: { id },
    data: updateData,
  });
};

/**
 * Delete an attribute value
 */
export const deleteAttributeValue = async (id: string) => {
  const attributeValue = await prisma.attributeValue.findUnique({ where: { id } });
  if (!attributeValue) {
    throw new AppError('Attribute value not found', 404);
  }

  await prisma.attributeValue.delete({ where: { id } });
  return { success: true, message: 'Attribute value deleted successfully' };
};
