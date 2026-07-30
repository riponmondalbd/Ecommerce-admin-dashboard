import { authenticate } from '../../../middleware/auth.middleware';

/**
 * JWT authentication middleware - uses centralized auth handler.
 * This middleware ensures the user is authenticated before proceeding.
 */
export const jwtAuthMiddleware = authenticate;
