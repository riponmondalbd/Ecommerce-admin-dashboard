import { z } from 'zod';
import { PermissionGroup } from '../config/enums';

export const PermissionGroupSchema = z.nativeEnum(PermissionGroup);

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