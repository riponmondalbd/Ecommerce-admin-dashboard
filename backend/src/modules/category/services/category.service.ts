import { prisma } from '../../../database/prisma';
import { AppError } from '../../../utils/appError';
import * as z from 'zod';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  PartialUpdateCategoryDto,
  ListCategoryDto,
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
 * Generate a slug from a name - unique and URL-safe
 */
const generateSlug = (name: string, existingSlugs: Set<string>): string => {
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // If slug exists or is empty, add a counter
  if (!slug || existingSlugs.has(slug)) {
    let counter = 1;
    const base = slug;
    while (existingSlugs.has(slug)) {
      slug = `${base}-${counter}`;
      counter++;
    }
  }

  return slug;
};

/**
 * Check if there's a cycle in the category hierarchy when setting a parent
 */
const checkCycle = async (childId: string, parentId: string): Promise<boolean> => {
  if (childId === parentId) return true;

  let currentId = parentId;
  const visited = new Set<string>();

  while (currentId) {
    if (visited.has(currentId)) break;
    visited.add(currentId);

    const parent = await prisma.category.findUnique({
      where: { id: currentId },
      select: { parentId: true },
    });

    if (!parent || !parent.parentId) return false;
    currentId = parent.parentId;
  }

  return visited.has(childId);
};

/**
 * Get all categories with their full hierarchy (tree structure)
 */
export const getCategories = async (input: unknown) => {
  const validated = validateInput(input, ListCategoryDto);

  const where: any = {};

  if (validated.search !== undefined && validated.search !== '') {
    where.name = {
      contains: validated.search,
      mode: 'insensitive',
    };
  }

  if (validated.parentId !== undefined && validated.parentId !== '') {
    where.parentId = validated.parentId;
  }

  if (validated.isActive !== undefined) {
    where.isActive = validated.isActive;
  }

  const page = validated.page || 1;
  const limit = validated.limit || 10;
  const skip = (page - 1) * limit;

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      take: limit,
      skip,
      orderBy: { name: 'asc' },
      include: {
        children: {
          select: { id: true, name: true },
        },
      },
    }),
    prisma.category.count({ where }),
  ]);

  return {
    data: categories,
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
 * Get a single category by ID
 */
export const getCategoryById = async (id: string) => {
  const category = await prisma.category.findUnique({
    where: { id },
    include: {
      children: {
        select: { id: true, name: true, slug: true },
      },
    },
  });

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return category;
};

/**
 * Build a flat list of all category IDs for duplicate checking during slug generation
 */
const getAllCategoryIds = async (): Promise<{ id: string; slug: string }[]> => {
  return await prisma.category.findMany({
    select: { id: true, slug: true },
  });
};

/**
 * Create a new category with cycle detection and slug validation
 */
export const createCategory = async (input: unknown) => {
  const validated = validateInput(input, CreateCategoryDto);

  // Get all existing slugs for duplicate checking
  const allCategories = await getAllCategoryIds();
  const existingSlugs = new Set(allCategories.map(c => c.slug));

  // Generate unique slug if not provided
  const slug = validated.slug || generateSlug(validated.name, existingSlugs);

  // First ensure parent exists (if provided)
  if (validated.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: validated.parentId } });
    if (!parent) {
      throw new AppError('Parent category not found', 404);
    }
  }

  // Check if slug already exists (different case-insensitive)
  const existing = await prisma.category.findUnique({
    where: { slug: slug.toLowerCase() },
  });
  if (existing) {
    throw new AppError('Slug must be unique', 409);
  }

  const category = await prisma.category.create({
    data: {
      name: validated.name,
      slug,
      description: validated.description,
      parentId: validated.parentId || undefined,
      mediaId: validated.mediaId || null,
      sortOrder: validated.sortOrder,
      isActive: validated.isActive,
    },
    include: {
      children: {
        select: { id: true, name: true },
      },
    },
  });

  // Verify no cycle was created
  if (validated.parentId) {
    const hasCycle = await checkCycle(category.id, validated.parentId);
    if (hasCycle) {
      await prisma.category.delete({ where: { id: category.id } });
      throw new AppError('Cannot create circular category reference', 400);
    }
  }

  return category;
};

/**
 * Update an existing category (PUT - full replacement)
 */
export const updateCategory = async (id: string, input: unknown) => {
  const validated = validateInput(input, UpdateCategoryDto);

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Get all existing slugs for duplicate checking (excluding current category)
  const allCategories = await getAllCategoryIds();
  const existingSlugs = new Set(allCategories.map(c => c.slug));
  existingSlugs.delete(category.slug);

  // Generate/update slug
  let slug: string;
  if (validated.slug) {
    slug = validated.slug;
  } else {
    slug = generateSlug(category.name, existingSlugs);
  }

  // Check if slug already exists (different from current)
  if (slug !== category.slug.toLowerCase()) {
    const existing = await prisma.category.findUnique({
      where: { slug: slug.toLowerCase() },
    });
    if (existing) {
      throw new AppError('Slug must be unique', 409);
    }
  }

  // Handle parent change - check for cycle if parent is being changed
  if (validated.parentId !== undefined) {
    const newParentId = validated.parentId || null;

    if (newParentId) {
      const parent = await prisma.category.findUnique({ where: { id: newParentId } });
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }

      // Check for cycle
      const hasCycle = await checkCycle(id, newParentId);
      if (hasCycle) {
        throw new AppError('Cannot create circular category reference', 400);
      }
    }
  }

  const updateData: any = {
    name: validated.name !== undefined ? validated.name : category.name,
    slug: slug,
    description: validated.description !== undefined ? validated.description : category.description,
    isActive: validated.isActive !== undefined ? validated.isActive : category.isActive,
    sortOrder: validated.sortOrder !== undefined ? validated.sortOrder : category.sortOrder,
  };

  if (validated.parentId !== undefined) {
    updateData.parentId = validated.parentId || null;
  }
  if (validated.mediaId !== undefined) {
    updateData.mediaId = validated.mediaId || null;
  }

  return await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      children: {
        select: { id: true, name: true },
      },
    },
  });
};

/**
 * Partially update a category (PATCH)
 */
export const partialUpdateCategory = async (id: string, input: unknown) => {
  const validated = validateInput(input, PartialUpdateCategoryDto);

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  const updateData: any = {};

  if (validated.name !== undefined) updateData.name = validated.name;
  if (validated.slug !== undefined) updateData.slug = validated.slug;
  if (validated.description !== undefined) updateData.description = validated.description;
  if (validated.parentId !== undefined) updateData.parentId = validated.parentId || null;
  if (validated.mediaId !== undefined) updateData.mediaId = validated.mediaId || null;
  if (validated.sortOrder !== undefined) updateData.sortOrder = validated.sortOrder;
  if (validated.isActive !== undefined) updateData.isActive = validated.isActive;

  // Special handling for slug uniqueness
  if (updateData.slug) {
    const allCategories = await getAllCategoryIds();
    const existingSlugs = new Set(allCategories.map(c => c.slug));
    existingSlugs.delete(category.slug);

    if (existingSlugs.has(updateData.slug.toLowerCase())) {
      throw new AppError('Slug must be unique', 409);
    }
  }

  // Check for cycle if parentId is being changed to a new value
  if (validated.parentId !== undefined && validated.parentId !== category.parentId) {
    const newParentId = validated.parentId || null;
    if (newParentId) {
      const parent = await prisma.category.findUnique({ where: { id: newParentId } });
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }

      // Only check for cycle if we're setting a new parent (not removing parent)
      if (validated.parentId) {
        const hasCycle = await checkCycle(id, validated.parentId);
        if (hasCycle) {
          throw new AppError('Cannot create circular category reference', 400);
        }
      }
    }
  }

  return await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      children: {
        select: { id: true, name: true },
      },
    },
  });
};

/**
 * Delete a category with safety guards
 */
export const deleteCategory = async (id: string) => {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new AppError('Category not found', 404);
  }

  // Safety guard: Cannot delete if it has children (or if other modules depend on it)
  const childCount = await prisma.category.count({
    where: { parentId: id },
  });

  if (childCount > 0) {
    throw new AppError(`Cannot delete category: "${category.name}" has ${childCount} child(ren)`, 400);
  }

  await prisma.category.delete({ where: { id } });
  return { success: true, message: 'Category deleted successfully' };
};

/**
 * Get all categories as a hierarchical tree with unlimited nesting depth.
 * Uses a two-step approach: fetch all categories flat, then build the tree in memory.
 */
export const getCategoriesTree = async (activeOnly: boolean = true) => {
  const categories = await prisma.category.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      parentId: true,
      isActive: true,
      sortOrder: true,
      media: { select: { id: true, fileName: true, publicUrl: true, altText: true } },
    },
  });

  // Build an index by id for O(1) lookups
  const index = new Map<string, any>();
  for (const cat of categories) {
    index.set(cat.id, { ...cat, children: [] });
  }

  const roots: any[] = [];
  for (const cat of categories) {
    const node = index.get(cat.id)!;
    if (cat.parentId && index.has(cat.parentId)) {
      index.get(cat.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  // Sort children at each level by sortOrder then name
  const sortNode = (node: any) => {
    node.children.sort((a: any, b: any) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
    for (const child of node.children) sortNode(child);
  };
  for (const root of roots) sortNode(root);

  return roots;
};

/**
 * Get all ancestors of a category (for breadcrumb navigation)
 */
export const getCategoryAncestors = async (categoryId: string) => {
  const ancestors: any[] = [];
  let currentId = categoryId;

  while (currentId) {
    const category = await prisma.category.findUnique({
      where: { id: currentId },
      select: { id: true, name: true, slug: true, parentId: true },
    });

    if (!category || !category.parentId) {
      break;
    }

    ancestors.push(category);
    currentId = category.parentId;
  }

  return ancestors.reverse(); // Return from root to parent
};
