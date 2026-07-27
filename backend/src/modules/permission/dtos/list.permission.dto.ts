import { z } from 'zod';
import { PermissionGroup } from '../../../config/enums';

const PermissionGroupSchema = z.nativeEnum(PermissionGroup);

export const ListPermissionDto = z.object({
  page: z.number().optional().default(1).min(1),
  limit: z.number().optional().default(10).min(1).max(100),
  group: PermissionGroupSchema.optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type ListPermissionsInput = z.infer<typeof ListPermissionDto>;