export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'CATALOG_MANAGER' | 'SUPPORT_AGENT' | 'VIEWER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: {
    id: string;
    name: UserRole;
  };
}

// JWT Token storage
interface Tokens {
  accessToken: string;
  refreshToken: string;
}

// API Response structure
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
