import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
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
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
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
    where.categoryId = validated.categoryId;
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
        category: { select: { name: true } },
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
      category: { select: { name: true, slug: true } },
      brand: { select: { name: true } },
      variants: {
        include: {
          attributeValues: {
            include: {
              attributeValue: { select: { label: true, valueCode: true } },
            },
          },
        },
      },
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
export const createProduct = async (input: unknown) => {
  const validated = validateInput(input, CreateProductDto);

  // Check if SKU already exists
  if (validated.sku) {
    const existing = await prisma.product.findUnique({ where: { sku: validated.sku } });
    if (existing) {
      throw new AppError('SKU must be unique', 409);
    }
  }

  // Verify category exists if provided
  if (validated.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  // Verify brand exists if provided
  if (validated.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: validated.brandId } });
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
  }

  const product = await prisma.product.create({
    data: {
      name: validated.name,
      description: validated.description,
      price: Number(validated.price),
      sku: validated.sku || generateSKU('PROD'),
      status: validated.status || 'DRAFT',
      categoryId: validated.categoryId || null,
      brandId: validated.brandId || null,
    },
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  // Log product creation transaction
  await logProductTransaction(product.id, null, 'CREATE', 1, validated.price, 'Product created');

  return product;
};

/**
 * Update an existing product (PUT - full replacement)
 */
export const updateProduct = async (id: string, input: unknown) => {
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

  // Verify category exists if provided and changed
  if (validated.categoryId && validated.categoryId !== product.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
  }

  // Verify brand exists if provided and changed
  if (validated.brandId && validated.brandId !== product.brandId) {
    const brand = await prisma.brand.findUnique({ where: { id: validated.brandId } });
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      name: validated.name,
      description: validated.description,
      price: Number(validated.price),
      sku: validated.sku,
      status: validated.status,
      categoryId: validated.categoryId || null,
      brandId: validated.brandId || null,
    },
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  // Log product update transaction
  await logProductTransaction(updatedProduct.id, null, 'UPDATE', 1, Number(updatedProduct.price), 'Product updated');

  return updatedProduct;
};

/**
 * Partially update a product (PATCH)
 */
export const partialUpdateProduct = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdateProductDto);

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.price !== undefined) updateData.price = Number(validated.price);
  if (validated.sku !== undefined) updateData.sku = validated.sku;
  if (validated.status !== undefined) updateData.status = validated.status;
  if (validated.categoryId !== undefined) {
    if (validated.categoryId) {
      const category = await prisma.category.findUnique({ where: { id: validated.categoryId } });
      if (!category) throw new AppError('Category not found', 404);
    }
    updateData.categoryId = validated.categoryId || null;
  }
  if (validated.brandId !== undefined) {
    if (validated.brandId) {
      const brand = await prisma.brand.findUnique({ where: { id: validated.brandId } });
      if (!brand) throw new AppError('Brand not found', 404);
    }
    updateData.brandId = validated.brandId || null;
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      category: { select: { name: true } },
      brand: { select: { name: true } },
    },
  });

  // Log product update if fields changed
  if (Object.keys(updateData).length > 0) {
    await logProductTransaction(updatedProduct.id, null, 'UPDATE', 1, Number(updatedProduct.price), 'Product partially updated');
  }

  return updatedProduct;
};

/**
 * Delete a product with safety guards
 */
export const deleteProduct = async (id: string) => {
  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Safety guard: Cannot delete if it has variants
  const variantCount = await prisma.productVariant.count({
    where: { productId: id },
  });

  if (variantCount > 0) {
    throw new AppError(`Cannot delete product: "${product.name}" has ${variantCount} variant(s)`, 400);
  }

  await prisma.product.delete({ where: { id } });

  // Log deletion
  await logProductTransaction(id, null, 'DELETE', 0, Number(product.price), 'Product deleted');

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
          attributeValue: { select: { label: true, valueCode: true } },
        },
      },
    },
  });

  return variants;
};

/**
 * Create a new product variant
 */
export const createProductVariant = async (productId: string, input: unknown) => {
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
      inventory: validated.inventory !== undefined ? validated.inventory : 0,
      weight: validated.weight,
      dimensions: (validated.dimensions as any) || undefined,
      attributeValues: {
        create: validated.attributeValueIds?.map(attrValId => ({
          attributeValueId: attrValId,
        })) || [],
      },
    },
    include: {
      attributeValues: {
        include: {
          attributeValue: { select: { label: true, valueCode: true } },
        },
      },
    },
  });

  // Log variant creation transaction
  await logProductTransaction(productId, variant.id, 'CREATE', validated.inventory || 0, Number(variant.price), `Variant created with SKU: ${variant.sku}`);

  return variant;
};

/**
 * Update an existing product variant
 */
export const updateProductVariant = async (id: string, input: unknown) => {
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
      inventory: validated.inventory !== undefined ? validated.inventory : variant.inventory,
      weight: validated.weight,
      dimensions: (validated.dimensions as any) || undefined,
      attributeValues: {
        deleteMany: {}, // Remove existing associations
        create: validated.attributeValueIds?.map(attrValId => ({
          attributeValueId: attrValId,
        })) || [],
      },
    },
    include: {
      attributeValues: {
        include: {
          attributeValue: { select: { label: true, valueCode: true } },
        },
      },
    },
  });

  // Log variant update transaction
  await logProductTransaction(variant.productId, id, 'UPDATE', validated.inventory !== undefined ? validated.inventory : variant.inventory, Number(updatedVariant.price), 'Variant updated');

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

  // Log deletion
  await logProductTransaction(variant.productId, id, 'DELETE', 0, Number(variant.price), 'Variant deleted');

  return { success: true, message: 'Variant deleted successfully' };
};

/**
 * Add inventory to a product variant (restock)
 */
export const restockProductVariant = async (id: string, quantity: number) => {
  const variant = await prisma.productVariant.findUnique({ where: { id } });
  if (!variant) {
    throw new AppError('Product variant not found', 404);
  }

  if (quantity <= 0) {
    throw new AppError('Restock quantity must be positive', 400);
  }

  const newInventory = variant.inventory + quantity;

  const updatedVariant = await prisma.productVariant.update({
    where: { id },
    data: { inventory: newInventory },
  });

  // Log restock transaction
  await logProductTransaction(variant.productId, id, 'RESTOCK', quantity, Number(updatedVariant.price), `Restocked ${quantity} units`);

  return updatedVariant;
};

/**
 * Deduct inventory from a product variant (sell)
 */
export const sellProductVariant = async (id: string, quantity: number) => {
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

  const newInventory = variant.inventory - quantity;

  const updatedVariant = await prisma.productVariant.update({
    where: { id },
    data: { inventory: newInventory },
  });

  // Log sale transaction
  await logProductTransaction(variant.productId, id, 'SELL', -quantity, Number(updatedVariant.price), `Sold ${quantity} units`);

  return updatedVariant;
};

/**
 * Log a product transaction
 */
const logProductTransaction = async (
  productId: string,
  variantId: string | null,
  type: any,
  quantity: number,
  price: number,
  notes: string,
) => {
  await prisma.productTransaction.create({
    data: {
      productId,
      variantId: variantId || null,
      type,
      quantity,
      priceAtTime: price,
      notes,
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
