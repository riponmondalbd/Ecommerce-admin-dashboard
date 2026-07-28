'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { User } from '@/types/user';

interface AuthContextType {
  user: User | null;
  permissions: string[];
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = getCurrentUser();
        const storedPermissions = getUserPermissions();

        if (storedUser && storedPermissions.length > 0) {
          setUser(storedUser);
          setPermissions(storedPermissions);
        } else {
          const response = await api.get('/api/auth/me');
          if (response.data.success) {
            const userData = response.data.data;
            setUser(userData);
            setPermissions(userData.permissions || ['*:*']);
          }
        }
      } catch (err) {
        console.error('Auth initialization error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Login with credentials
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/login', { email, password });
      if (response.data.success) {
        localStorage.setItem('accessToken', 'dummy-jwt-token');
        localStorage.setItem('refreshToken', 'dummy-refresh-token');
        setUser(response.data.data.user);
        setPermissions(response.data.data.user.permissions || ['*:*']);
        setError(null);
        router.push('/');
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Register new user
  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/auth/register', { name, email, password });
      if (response.data.success) {
        await login(email, password);
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/api/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearTokens();
      setUser(null);
      setPermissions([]);
      setError(null);
      router.push('/auth/login');
    }
  };

  // Auth utility functions (local storage based)
  const getCurrentUser = (): User | null => {
    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) return null;

    try {
      const base64Url = accessToken.split('.')[1];
      if (!base64Url) return null;
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decoded = JSON.parse(atob(base64));

      return {
        id: decoded.sub || decoded.id,
        name: decoded.name || 'User',
        email: decoded.email || 'user@example.com',
        role: {
          id: decoded.roleId || '',
          name: decoded.roleName || 'User',
          description: '',
          isSystem: false,
          isActive: true,
        },
        status: 'ACTIVE',
        createdAt: decoded.iat,
        updatedAt: decoded.nbf,
      };
    } catch (error) {
      return null;
    }
  };

  const getUserPermissions = (): string[] => {
    const permissions = localStorage.getItem('userPermissions');
    return permissions ? JSON.parse(permissions) : [];
  };

  const savePermissions = (permissions: string[]): void => {
    localStorage.setItem('userPermissions', JSON.stringify(permissions));
  };

  const clearTokens = (): void => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userPermissions');
  };

  // Provide context value
  const value = {
    user,
    permissions,
    isLoading,
    error,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
