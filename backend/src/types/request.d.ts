import { User } from '@prisma/client';

declare module 'express' {
  interface Request {
    userId?: string;
    email?: string;
    role?: string;
    user?: User;
  }
}
