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