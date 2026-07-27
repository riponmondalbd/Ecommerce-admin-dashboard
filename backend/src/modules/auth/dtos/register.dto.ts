import { z } from 'zod';

/**
 * Supported user roles for assignment.
 */
const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'CATALOG_MANAGER', 'SUPPORT_AGENT', 'VIEWER'] as const;
type ValidRole = typeof VALID_ROLES[number];

/**
 * User registration DTO using Zod for validation.
 * Includes name, email, password, and optional role assignment (for admin).
 */
export const RegisterDto = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.string().refine(val => VALID_ROLES.includes(val as ValidRole), {
    message: 'Invalid role assigned',
  }).default('CATALOG_MANAGER'),
});

export type RegisterInput = z.infer<typeof RegisterDto>;