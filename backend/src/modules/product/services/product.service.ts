import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import { TransactionType } from '@prisma/client';
import {
  CreateProductDto,
  UpdateProductDto,
  PartialUpdateProductDto,
  ListProductDto,
  CreateProductVariantDto,
  UpdateProductVariantDto,
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
 * Generate a SKU for a product or variant
 */
const generateSKU = (prefix: string, length: number = 6): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ01234589';
  let sku = prefix;
  for (let i = 0; i < length; i++) {
    sku += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return sku;
};

/**
 * Get all products with optional filtering and pagination
 */
export const getProducts = async (input: unknown) => {
  const validated = validateInput(input, ListProductDto);

  const where: any = {};

  if (validated.search !== undefined && validated.search !== '') {
    where.name = {
      contains: validated.search,
      mode: 'insensitive',
    };
  }

  if (validated.categoryId) {
    where.categories = { some: { id: validated.categoryId } };
  }

  if (validated.brandId) {
    where.brandId = validated.brandId;
  }

  if (validated.status) {
    where.status = validated.status;
  }

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      take: limit,
      skip,
      orderBy: { name: 'asc' },
      include: {
        categories: { select: { name: true } },
        brand: { select: { name: true } },
        variants: {
          select: { id: true, sku: true, inventory: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
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
 * Get a single product by ID
 */
export const getProductById = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: { select: { name: true, slug: true } },
      brand: { select: { name: true } },
      variants: {
        include: {
          attributeValues: {
            include: {
              attributeValue: { select: { label: true, referenceValue: true } },
            },
          },
          mediaAttachments: {
            include: { media: true },
          },
        },
      }
    },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return product;
};

/**
 * Create a new product
 */
export const createProduct = async (input: unknown, createdBy: string | null = null) => {
  const validated = validateInput(input, CreateProductDto);

  // Check if SKU already exists
  if (validated.sku) {
    const existing = await prisma.product.findUnique({ where: { sku: validated.sku } });
    if (existing) {
      throw new AppError('SKU must be unique', 409);
    }
  }

  // Generate slug if not provided
  const slug = validated.slug || validated.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Check if slug already exists
  const existingSlug = await prisma.product.findUnique({ where: { slug: slug.toLowerCase() } });
  if (existingSlug) {
    throw new AppError('Slug must be unique', 409);
  }

  const product = await prisma.product.create({
    data: {
      name: validated.name,
      slug: slug.toLowerCase(),
      shortDescription: validated.shortDescription,
      description: validated.description,
      hasVariants: validated.hasVariants,
      price: Number(Number(validated.price).toFixed(2)),
      salePrice: validated.salePrice !== undefined ? Number(Number(validated.salePrice).toFixed(2)) : undefined,
      stock: validated.stock,
      stockStatus: validated.stockStatus,
      weight: validated.weight !== undefined ? Number(Number(validated.weight).toFixed(3)) : undefined,
      isActive: validated.isActive,
      isFeatured: validated.isFeatured,
      sortOrder: validated.sortOrder,
      sku: validated.sku || generateSKU('PROD'),
      status: validated.status || 'DRAFT',
      categories: validated.categories ? { connect: validated.categories.map(id => ({ id })) } : undefined,
      brandId: validated.brandId || null,
      mediaAttachments: validated.mediaIds ? { create: validated.mediaIds.map((id, idx) => ({ mediaId: id, sortOrder: idx })) } : undefined,
    },
    include: {
      categories: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  // Log product creation transaction
  await logProductTransaction(product.id, null, TransactionType.CREATE, 1, validated.price, 'Product created', createdBy);

  return product;
};

/**
 * Update an existing product (PUT - full replacement)
 */
export const updateProduct = async (id: string, input: unknown, createdBy: string | null = null) => {
  const validated = validateInput(input, UpdateProductDto);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if new SKU conflicts with another product (excluding current)
  if (validated.sku && validated.sku !== product.sku) {
    const existing = await prisma.product.findUnique({ where: { sku: validated.sku } });
    if (existing) {
      throw new AppError('SKU must be unique', 409);
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name: validated.name,
      slug: validated.slug,
      shortDescription: validated.shortDescription,
      description: validated.description,
      hasVariants: validated.hasVariants,
      price: Number(Number(validated.price).toFixed(2)),
      salePrice: validated.salePrice !== undefined ? Number(Number(validated.salePrice).toFixed(2)) : null,
      stock: validated.stock,
      stockStatus: validated.stockStatus,
      weight: validated.weight !== undefined ? Number(Number(validated.weight).toFixed(3)) : null,
      isActive: validated.isActive,
      isFeatured: validated.isFeatured,
      sortOrder: validated.sortOrder,
      sku: validated.sku,
      status: validated.status,
      categories: validated.categories ? { set: validated.categories.map(id => ({ id })) } : undefined,
      brandId: validated.brandId || null,
      mediaAttachments: validated.mediaIds ? { deleteMany: {}, create: validated.mediaIds.map((id, idx) => ({ mediaId: id, sortOrder: idx })) } : undefined,
    },
    include: {
      categories: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  // Log product update transaction
  await logProductTransaction(updatedProduct.id, null, TransactionType.UPDATE, 1, Number(updatedProduct.price), 'Product updated', createdBy);

  return updatedProduct;
};

/**
 * Partially update a product (PATCH)
 */
export const partialUpdateProduct = async (id: string, input: unknown, createdBy: string | null = null) => {
  const validated = validateInput(input, PartialUpdateProductDto);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.slug !== undefined) updateData.slug = validated.slug;
  if (validated.shortDescription !== undefined) updateData.shortDescription = validated.shortDescription;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.hasVariants !== undefined) updateData.hasVariants = validated.hasVariants;
  if (validated.price !== undefined) updateData.price = Number(validated.price);
  if (validated.salePrice !== undefined) updateData.salePrice = Number(validated.salePrice);
  if (validated.stock !== undefined) updateData.stock = validated.stock;
  if (validated.stockStatus !== undefined) updateData.stockStatus = validated.stockStatus;
  if (validated.weight !== undefined) updateData.weight = Number(validated.weight);
  if (validated.isActive !== undefined) updateData.isActive = validated.isActive;
  if (validated.isFeatured !== undefined) updateData.isFeatured = validated.isFeatured;
  if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;
  if (validated.sku !== undefined) updateData.sku = validated.sku;
  if (validated.status !== undefined) updateData.status = validated.status;
  if (validated.categories !== undefined) {
    updateData.categories = { set: validated.categories.map(id => ({ id })) };
  }
  if (validated.brandId !== undefined) {
    updateData.brandId = validated.brandId || null;
  }
  if (validated.mediaIds !== undefined) {
    updateData.mediaAttachments = { deleteMany: {}, create: validated.mediaIds.map((id, idx) => ({ mediaId: id, sortOrder: idx })) };
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      categories: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  // Log product update if fields changed
  if (Object.keys(updateData).length > 0) {
    await logProductTransaction(updatedProduct.id, null, TransactionType.UPDATE, 1, Number(updatedProduct.price), 'Product partially updated', createdBy);
  }

  return updatedProduct;
};

/**
 * Delete a product. Variants and media attachments cascade via Prisma onDelete: Cascade.
 * Media assets themselves survive (they may be shared with other products).
 * Transactions are left as an audit trail and are not deleted.
 */
export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  await prisma.product.delete({ where: { id } });

  return { success: true, message: 'Product deleted successfully' };
};

/**
 * Get all variants for a product
 */
export const getProductVariants = async (productId: string) => {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const variants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      attributeValues: {
        include: {
          attributeValue: { select: { label: true, referenceValue: true } },
        },
      },
      mediaAttachments: {
        include: { media: true }
      },
    },
  });

  return variants;
};

/**
 * Create a new product variant
 */
export const createProductVariant = async (productId: string, input: unknown, createdBy: string | null = null) => {
  const validated = validateInput(input, CreateProductVariantDto);

  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Check if SKU already exists for this product or globally
  if (validated.sku) {
    const existing = await prisma.productVariant.findUnique({ where: { sku: validated.sku } });
    if (existing) {
      throw new AppError('SKU must be unique', 409);
    }
  }

  // Create variant with attribute associations
  const variant = await prisma.productVariant.create({
    data: {
      productId,
      sku: validated.sku || generateSKU('VAR'),
      price: validated.price !== undefined ? Number(validated.price) : Number(product.price),
      salePrice: validated.salePrice !== undefined ? Number(validated.salePrice) : undefined,
      inventory: validated.inventory !== undefined ? validated.inventory : 0,
      stockStatus: validated.stockStatus,
      lowStockThreshold: validated.lowStockThreshold !== undefined ? validated.lowStockThreshold : 5,
      weight: validated.weight !== undefined ? Number(validated.weight) : undefined,
      dimensions: (validated.dimensions as any) || undefined,
      isActive: validated.isActive !== undefined ? validated.isActive : true,
      attributeValues: {
        create: validated.attributeValueIds?.map(attrValId => ({
          attributeValueId: attrValId,
        })) || [],
      },
      mediaAttachments: validated.mediaIds ? {
        create: validated.mediaIds.map((id, idx) => ({ mediaId: id, sortOrder: idx }))
      } : undefined,
    },
    include: {
      attributeValues: {
        include: {
          attributeValue: { select: { label: true, referenceValue: true } },
        },
      },
      mediaAttachments: {
        include: { media: true }
      },
    },
  });

  // Log variant creation transaction
  await logProductTransaction(productId, variant.id, TransactionType.CREATE, validated.inventory || 0, Number(variant.price), `Variant created with SKU: ${variant.sku}`, createdBy);

  return variant;
};

/**
 * Update an existing product variant
 */
export const updateProductVariant = async (id: string, input: unknown, createdBy: string | null = null) => {
  const validated = validateInput(input, UpdateProductVariantDto);

  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  // Check if SKU already exists (excluding current variant)
  if (validated.sku && validated.sku !== variant.sku) {
    const existing = await prisma.productVariant.findUnique({ where: { sku: validated.sku } });
    if (existing) {
      throw new AppError('SKU must be unique', 409);
    }
  }

  // Update variant (replace attribute values with new set)
  const updatedVariant = await prisma.productVariant.update({
    where: { id },
    data: {
      sku: validated.sku || variant.sku,
      price: validated.price !== undefined ? Number(validated.price) : Number(variant.price),
      salePrice: validated.salePrice !== undefined ? Number(validated.salePrice) : variant.salePrice,
      inventory: validated.inventory !== undefined ? validated.inventory : variant.inventory,
      stockStatus: validated.stockStatus !== undefined ? validated.stockStatus : variant.stockStatus,
      lowStockThreshold: validated.lowStockThreshold !== undefined ? validated.lowStockThreshold : variant.lowStockThreshold,
      weight: validated.weight !== undefined ? Number(validated.weight) : variant.weight,
      dimensions: validated.dimensions !== undefined ? (validated.dimensions as any) : variant.dimensions,
      isActive: validated.isActive !== undefined ? validated.isActive : variant.isActive,
      attributeValues: validated.attributeValueIds ? {
        deleteMany: {},
        create: validated.attributeValueIds.map(attrValId => ({
          attributeValueId: attrValId,
        }))
      } : undefined,
      mediaAttachments: validated.mediaIds ? {
        deleteMany: {},
        create: validated.mediaIds.map((id, idx) => ({ mediaId: id, sortOrder: idx }))
      } : undefined,
    },
    include: {
      attributeValues: {
        include: {
          attributeValue: { select: { label: true, referenceValue: true } },
        },
      },
      mediaAttachments: {
        include: { media: true }
      },
    },
  });

  // Log inventory changes separately if inventory was modified
  if (validated.inventory !== undefined && validated.inventory !== variant.inventory) {
    await logProductTransaction(variant.productId, id, TransactionType.UPDATE, validated.inventory - variant.inventory, Number(updatedVariant.price), `Inventory updated from ${variant.inventory} to ${validated.inventory}`, createdBy);
  }

  // Log variant update transaction
  await logProductTransaction(variant.productId, id, TransactionType.UPDATE, validated.inventory !== undefined ? validated.inventory : variant.inventory, Number(updatedVariant.price), 'Variant updated', createdBy);

  return updatedVariant;
};

/**
 * Delete a product variant
 */
export const deleteProductVariant = async (id: string) => {
  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  await prisma.productVariant.delete({ where: { id } });

  return { success: true, message: 'Variant deleted successfully' };
};

/**
 * Add inventory to a product variant (restock) - FIXED: Use atomic increment
 */
export const restockProductVariant = async (id: string, quantity: number, createdBy: string | null = null) => {
  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  if (quantity <= 0) {
    throw new AppError('Restock quantity must be positive', 400);
  }

  // FIX: Use atomic increment instead of read-modify-write to prevent race conditions
  const updatedVariant = await prisma.productVariant.update({
    where: { id },
    data: {
      inventory: { increment: quantity }
    },
  });

  // Log restock transaction
  await logProductTransaction(variant.productId, id, TransactionType.RESTOCK, quantity, Number(updatedVariant.price), `Restocked ${quantity} units`, createdBy);

  return updatedVariant;
};

/**
 * Deduct inventory from a product variant (sell) - FIXED: Use atomic decrement
 */
export const sellProductVariant = async (id: string, quantity: number, createdBy: string | null = null) => {
  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  if (quantity <= 0) {
    throw new AppError('Sell quantity must be positive', 400);
  }

  if (variant.inventory < quantity) {
    throw new AppError('Insufficient inventory', 400);
  }

  // FIX: Use atomic decrement instead of read-modify-write to prevent race conditions
  const updatedVariant = await prisma.productVariant.update({
    where: { id },
    data: {
      inventory: { decrement: quantity }
    }
  });

  // Log sale transaction
  await logProductTransaction(variant.productId, id, TransactionType.SELL, -quantity, Number(updatedVariant.price), `Sold ${quantity} units`, createdBy);

  return updatedVariant;
};

/**
 * Log a product transaction - FIXED: Added createdBy parameter
 */
const logProductTransaction = async (
  productId: string,
  variantId: string | null,
  type: TransactionType,
  quantity: number,
  price: number,
  notes: string,
  createdBy: string | null, // Added createdBy parameter
) => {
  await prisma.productTransaction.create({
    data: {
      productId,
      variantId: variantId || null,
      type,
      quantity,
      priceAtTime: price,
      notes,
      createdBy: createdBy || null, // Populate createdBy field
    },
  });
};

/**
 * Get product transaction history for a product or variant
 */
export const getProductTransactions = async (productId?: string, variantId?: string, limit?: number, page?: number) => {
  const where: any = {};

  if (productId) where.productId = productId;
  if (variantId) where.variantId = variantId;

  const take = limit || 50;
  const skip = (page || 1) - 1;

  const transactions = await prisma.productTransaction.findMany({
    where,
      take,
      skip,
    orderBy: { createdAt: 'desc' },
    include: {
      variant: { select: { sku: true, inventory: true } },
      product: { select: { name: true } },
    },
  });

  return transactions;
};
