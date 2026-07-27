import { z } from 'zod';
import { PermissionGroup } from '../../../config/enums';

const PermissionGroupSchema = z.nativeEnum(PermissionGroup);

export const CreatePermissionDto = z.object({
  key: z.string()
    .min(1, 'Key is required')
    .max(50, 'Key must be less than 50 characters')
    .regex(/^[a-z_]+:[a-z_]+$/, 'Key must follow format "module:action" (e.g., "product:create")')
    .toLowerCase(),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().optional().max(255),
  group: PermissionGroupSchema,
  isActive: z.boolean().default(true),
});

export type CreatePermissionInput = z.infer<typeof CreatePermissionDto>;