import { z } from 'zod';

/**
 * Login request DTO using Zod for validation.
 * Ensures email format and required password field.
 */
export const LoginDto = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof LoginDto>;