import { z } from 'zod';
import { PermissionGroup } from '../../../config/enums';

const PermissionGroupSchema = z.nativeEnum(PermissionGroup);

export const UpdatePermissionDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().optional().max(255),
  group: PermissionGroupSchema.optional(),
  isActive: z.boolean().optional(),
});

// Create a partial update type that allows updating any subset of fields
export const PartialUpdatePermissionDto = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters').optional(),
  description: z.string().optional().max(255).optional(),
  group: PermissionGroupSchema.optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePermissionInput = z.infer<typeof UpdatePermissionDto>;
export type PartialUpdatePermissionInput = z.infer<typeof PartialUpdatePermissionDto>;