import { z } from 'zod';
import { PermissionGroup, MediaType, MediaStatus, AttributeType } from '../config/enums';

export const PermissionGroupSchema = z.nativeEnum(PermissionGroup);
export const MediaTypeSchema = z.nativeEnum(MediaType);
export const MediaStatusSchema = z.union([
  z.nativeEnum(MediaStatus),
  z.enum(['PENDING', 'PROCESSING', 'READY', 'ERROR']),
]);

// Permission DTOs with proper exports
export const CreatePermissionDto = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .max(50, 'Key must be less than 50 characters')
    .regex(/^[a-z_]+:[a-z_]+$/, 'Key must follow format "module:action" (e.g., "product:create")')
    .toLowerCase(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(255).optional(),
  group: PermissionGroupSchema,
  isActive: z.boolean().default(true),
});

const UpdateBase = {
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().max(255).optional(),
  group: PermissionGroupSchema.optional(),
 isActive: z.boolean().optional(),
};

export const UpdatePermissionDto = z.object({
  ...UpdateBase,
  key: z.string().min(1, 'Key is required').max(50).optional(),
});

export const PartialUpdatePermissionDto = z.object({
  ...UpdateBase,
  key: z.string().min(1, 'Key is required').max(50).optional(),
});

export const ListPermissionDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  group: PermissionGroupSchema.optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
  sort: z.enum(['key', 'name', 'group', 'isActive', 'createdAt']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});

// Export types for convenience
export type CreatePermissionInput = z.infer<typeof CreatePermissionDto>;
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionDto>;
export type PartialUpdatePermissionInput = z.infer<typeof PartialUpdatePermissionDto>;
export type ListPermissionsInput = z.infer<typeof ListPermissionDto>;

// Role DTOs
export const CreateRoleDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).optional().default([]),
});

export const UpdateRoleDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).optional(),
});

export const PartialUpdateRoleDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters').optional(),
  description: z.string().max(255).optional(),
  permissions: z.array(z.string()).optional(),
});

export const ListRoleDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
});

export type CreateRoleInput = z.infer<typeof CreateRoleDto>;
export type UpdateRoleInput = z.infer<typeof UpdateRoleDto>;
export type PartialUpdateRoleInput = z.infer<typeof PartialUpdateRoleDto>;
export type ListRolesInput = z.infer<typeof ListRoleDto>;

// User DTOs
export const CreateUserDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  role: z.string().refine(val => ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'].includes(val as any), {
    message: 'Invalid role assigned',
  }).default('CATALOG_MANAGER'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional().default('ACTIVE'),
});

export const UpdateUserDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  phone: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  role: z.string().refine(val => ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'].includes(val as any), {
    message: 'Invalid role assigned',
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
});

export const PartialUpdateUserDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  phone: z.string().max(20).optional(),
  gender: z.string().max(20).optional(),
  role: z.string().refine(val => ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'].includes(val as any), {
    message: 'Invalid role assigned',
  }).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
});

export const ListUserDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  roleId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserDto>;
export type UpdateUserInput = z.infer<typeof UpdateUserDto>;
export type PartialUpdateUserInput = z.infer<typeof PartialUpdateUserDto>;
export type ListUsersInput = z.infer<typeof ListUserDto>;

// Media DTOs (Task 8: Media Library)
export const CreateMediaDto = z.object({
  fileName: z.string().min(1, 'File name is required'),
  filePath: z.string().min(1, 'File path is required'),
  publicUrl: z.string().min(1, 'Public url is required'),
  type: MediaTypeSchema,
  mimeType: z.string().optional(),
  size: z.number().min(0, 'Size must be non-negative'),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnailPath: z.string().optional(),
  altText: z.string().optional(),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  uploadedById: z.string().min(1, 'Uploaded by ID is required'),
  status: MediaStatusSchema.default('PENDING'),
});

export const UpdateMediaDto = z.object({
  fileName: z.string().min(1, 'File name is required').optional(),
  filePath: z.string().min(1, 'File path is required').optional(),
  publicUrl: z.string().min(1, 'Public url is required').optional(),
  type: MediaTypeSchema.optional(),
  mimeType: z.string().optional(),
  size: z.number().min(0, 'Size must be non-negative').optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnailPath: z.string().optional(),
  altText: z.string().optional(),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: MediaStatusSchema.optional(),
});

export const PartialUpdateMediaDto = z.object({
  fileName: z.string().min(1, 'File name is required').optional(),
  filePath: z.string().min(1, 'File path is required').optional(),
  publicUrl: z.string().min(1, 'Public url is required').optional(),
  type: MediaTypeSchema.optional(),
  mimeType: z.string().optional(),
  size: z.number().min(0, 'Size must be non-negative').optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  thumbnailPath: z.string().optional(),
  altText: z.string().optional(),
  title: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  status: MediaStatusSchema.optional(),
});

export const ListMediaDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  type: MediaTypeSchema.optional(),
  status: MediaStatusSchema.optional(),
  uploadedBy: z.string().optional(),
});

export type CreateMediaInput = z.infer<typeof CreateMediaDto>;
export type UpdateMediaInput = z.infer<typeof UpdateMediaDto>;
export type PartialUpdateMediaInput = z.infer<typeof PartialUpdateMediaDto>;
export type ListMediaInput = z.infer<typeof ListMediaDto>;

// Category DTOs (Task 9: Category System)
export const CreateCategoryDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(255).optional(),
  parentId: z.string().optional(),
  mediaId: z.string().optional(),
  sortOrder: z.number().optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export const UpdateCategoryDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(255).optional(),
  parentId: z.string().optional(),
  mediaId: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const PartialUpdateCategoryDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters').optional(),
  description: z.string().max(255).optional(),
  parentId: z.string().optional(),
  mediaId: z.string().optional(),
  sortOrder: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const ListCategoryDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryDto>;
export type PartialUpdateCategoryInput = z.infer<typeof PartialUpdateCategoryDto>;
export type ListCategoriesInput = z.infer<typeof ListCategoryDto>;

// Brand DTOs (Task 10: Brand System)
export const CreateBrandDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  mediaId: z.string().optional(), // Optional reference to a Media item for logo
});

export const UpdateBrandDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(100).optional(),
  description: z.string().max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  mediaId: z.string().optional(),
});

export const PartialUpdateBrandDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(100).optional(),
  description: z.string().max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  mediaId: z.string().optional(),
});

export const ListBrandDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export type CreateBrandInput = z.infer<typeof CreateBrandDto>;
export type UpdateBrandInput = z.infer<typeof UpdateBrandDto>;
export type PartialUpdateBrandInput = z.infer<typeof PartialUpdateBrandDto>;
export type ListBrandsInput = z.infer<typeof ListBrandDto>;

// Product DTOs (Task 12: Product Module)
export const ProductStatusEnum = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const TransactionTypeEnum = z.enum(['CREATE', 'UPDATE', 'SELL', 'RESTOCK', 'ADJUST', 'TRANSFER']);

export const CreateProductDto = z
  .object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(255).optional(),
    sku: z.string().max(50).optional(),
    shortDescription: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    hasVariants: z.boolean().optional().default(false),
    price: z.number().min(0, 'Price must be non-negative'),
    salePrice: z.number().min(0).optional(),
    stock: z.number().min(0).optional().default(0),
    stockStatus: z.string().optional(),
    weight: z.number().min(0).optional(),
    isActive: z.boolean().optional().default(true),
    isFeatured: z.boolean().optional().default(false),
    sortOrder: z.number().optional().default(0),
    brandId: z.string().optional(),
    status: ProductStatusEnum.default('DRAFT'),
    categories: z.array(z.string()).optional(),
    mediaIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => data.salePrice === undefined || data.salePrice <= data.price,
    { message: 'Sale price must not exceed price', path: ['salePrice'] },
  );

export const UpdateProductDto = z
  .object({
    name: z.string().min(1, 'Name is required').max(255).optional(),
    slug: z.string().min(1, 'Slug is required').max(255).optional(),
    sku: z.string().max(50).optional(),
    shortDescription: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    hasVariants: z.boolean().optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    salePrice: z.number().min(0).optional(),
    stock: z.number().min(0).optional(),
    stockStatus: z.string().optional(),
    weight: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    sortOrder: z.number().optional(),
    brandId: z.string().optional(),
    status: ProductStatusEnum.optional(),
    categories: z.array(z.string()).optional(),
    mediaIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => data.salePrice === undefined || data.price === undefined || data.salePrice <= data.price,
    { message: 'Sale price must not exceed price', path: ['salePrice'] },
  );

export const PartialUpdateProductDto = UpdateProductDto;

export const ListProductDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  status: ProductStatusEnum.optional(),
});

export type CreateProductInput = z.infer<typeof CreateProductDto>;
export type UpdateProductInput = z.infer<typeof UpdateProductDto>;
export type PartialUpdateProductInput = z.infer<typeof PartialUpdateProductDto>;
export type ListProductsInput = z.infer<typeof ListProductDto>;

export const CreateProductVariantDto = z
  .object({
    productId: z.string(),
    sku: z.string().max(50).optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    salePrice: z.number().min(0).optional(),
    inventory: z.number().min(0, 'Inventory must be non-negative').default(0),
    stockStatus: z.string().optional(),
    lowStockThreshold: z.number().optional().default(5),
    weight: z.number().min(0).optional(),
    dimensions: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional().default(true),
    attributeValueIds: z.array(z.string()).optional(),
    mediaIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => data.salePrice === undefined || data.price === undefined || data.salePrice <= data.price,
    { message: 'Sale price must not exceed price', path: ['salePrice'] },
  );

export const UpdateProductVariantDto = z
  .object({
    sku: z.string().max(50).optional(),
    price: z.number().min(0, 'Price must be non-negative').optional(),
    salePrice: z.number().min(0).optional(),
    inventory: z.number().min(0, 'Inventory must be non-negative').optional(),
    stockStatus: z.string().optional(),
    lowStockThreshold: z.number().optional(),
    weight: z.number().min(0).optional(),
    dimensions: z.record(z.unknown()).optional(),
    isActive: z.boolean().optional(),
    attributeValueIds: z.array(z.string()).optional(),
    mediaIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => data.salePrice === undefined || data.price === undefined || data.salePrice <= data.price,
    { message: 'Sale price must not exceed price', path: ['salePrice'] },
  );

export type CreateProductVariantInput = z.infer<typeof CreateProductVariantDto>;
export type UpdateProductVariantInput = z.infer<typeof UpdateProductVariantDto>;

export const ProductTransactionDto = z.object({
  variantId: z.string().optional(),
  type: TransactionTypeEnum,
  quantity: z.number(),
  priceAtTime: z.number(),
  notes: z.string().max(500).optional(),
});


// Attribute Type Schema
export const AttributeTypeSchema = z.nativeEnum(AttributeType);

// Attribute DTOs (Task 11: Attribute System)
export const CreateAttributeDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  slug: z.string().min(1, 'Slug is required').max(50).optional(),
  type: AttributeTypeSchema,
  description: z.string().max(255).optional(),
});

export const UpdateAttributeDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(50).optional(),
  type: AttributeTypeSchema.optional(),
  description: z.string().max(255).optional(),
});

export const PartialUpdateAttributeDto = UpdateAttributeDto;

export const ListAttributeDto = z.object({
  page: z.coerce.number().min(1).default(1).optional(),
  limit: z.coerce.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  type: AttributeTypeSchema.optional(),
});

export type CreateAttributeInput = z.infer<typeof CreateAttributeDto>;
export type UpdateAttributeInput = z.infer<typeof UpdateAttributeDto>;
export type PartialUpdateAttributeInput = z.infer<typeof PartialUpdateAttributeDto>;
export type ListAttributesInput = z.infer<typeof ListAttributeDto>;

// Attribute Value DTOs (belong to an Attribute)
export const CreateAttributeValueDto = z.object({
  attributeId: z.string().min(1, 'Attribute ID is required'),
  slug: z.string().min(1, 'Slug is required').max(100).optional(),
  label: z.string().min(1, 'Label is required').max(100),
  referenceValue: z.string().max(50).optional(), // e.g., "#FF0000" for colors, "L" for sizes
  sortOrder: z.number().min(0).default(0),
});

export const UpdateAttributeValueDto = z.object({
  slug: z.string().min(1, 'Slug is required').max(100).optional(),
  label: z.string().min(1, 'Label is required').max(100).optional(),
  referenceValue: z.string().max(50).optional(),
  sortOrder: z.number().min(0).optional(),
});

export const PartialUpdateAttributeValueDto = UpdateAttributeValueDto;

export type CreateAttributeValueInput = z.infer<typeof CreateAttributeValueDto>;
export type UpdateAttributeValueInput = z.infer<typeof UpdateAttributeValueDto>;
export type PartialUpdateAttributeValueInput = z.infer<typeof PartialUpdateAttributeValueDto>;

