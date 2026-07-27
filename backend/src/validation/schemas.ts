import { z } from 'zod';
import { PermissionGroup, MediaType, MediaStatus } from '../config/enums';

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
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(10).optional(),
  group: PermissionGroupSchema.optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Export types for convenience
export type CreatePermissionInput = z.infer<typeof CreatePermissionDto>;
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionDto>;
export type PartialUpdatePermissionInput = z.infer<typeof PartialUpdatePermissionDto>;
export type ListPermissionsInput = z.infer<typeof ListPermissionDto>;

// Role DTOs
export const CreateRoleDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
});

export const UpdateRoleDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
});

export const PartialUpdateRoleDto = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters').optional(),
});

export const ListRoleDto = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(10).optional(),
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
  role: z.string().refine(val => ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'].includes(val as any), {
    message: 'Invalid role assigned',
  }).default('CATALOG_MANAGER'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional().default('ACTIVE'),
});

export const UpdateUserDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.string().refine(val => ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'].includes(val as any), {
    message: 'Invalid role assigned',
  }),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
});

export const PartialUpdateUserDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.string().refine(val => ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'].includes(val as any), {
    message: 'Invalid role assigned',
  }).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'LOCKED']).optional(),
});

export const ListUserDto = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(10).optional(),
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
  publicPath: z.string().min(1, 'Public path is required'),
  type: MediaTypeSchema,
  size: z.number().min(0, 'Size must be non-negative'),
  metadata: z.record(z.unknown()).optional(),
  uploadedById: z.string().min(1, 'Uploaded by ID is required'),
  status: MediaStatusSchema.default('PENDING'),
});

export const UpdateMediaDto = z.object({
  fileName: z.string().min(1, 'File name is required').optional(),
  filePath: z.string().min(1, 'File path is required').optional(),
  publicPath: z.string().min(1, 'Public path is required').optional(),
  type: MediaTypeSchema.optional(),
  size: z.number().min(0, 'Size must be non-negative').optional(),
  metadata: z.record(z.unknown()).optional(),
  status: MediaStatusSchema.optional(),
});

export const PartialUpdateMediaDto = z.object({
  fileName: z.string().min(1, 'File name is required').optional(),
  filePath: z.string().min(1, 'File path is required').optional(),
  publicPath: z.string().min(1, 'Public path is required').optional(),
  type: MediaTypeSchema.optional(),
  size: z.number().min(0, 'Size must be non-negative').optional(),
  metadata: z.record(z.unknown()).optional(),
  status: MediaStatusSchema.optional(),
});

export const ListMediaDto = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(10).optional(),
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
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens'),
  description: z.string().max(255).optional(),
  parentId: z.string().optional(), // Reference to parent category ID
});

export const UpdateCategoryDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters').regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(255).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const PartialUpdateCategoryDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug must be less than 100 characters').optional(),
  description: z.string().max(255).optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const ListCategoryDto = z.object({
  page: z.number().min(1).default(1).optional(),
  limit: z.number().min(1).max(100).default(10).optional(),
  search: z.string().optional(),
  parentId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof CreateCategoryDto>;
export type UpdateCategoryInput = z.infer<typeof UpdateCategoryDto>;
export type PartialUpdateCategoryInput = z.infer<typeof PartialUpdateCategoryDto>;
export type ListCategoriesInput = z.infer<typeof ListCategoryDto>;
