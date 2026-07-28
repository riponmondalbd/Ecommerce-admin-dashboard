import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  permissions: string[];
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshAccessToken: () => Promise<void>;
  getUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Get tokens from httpOnly cookies (stored by backend)
  const getCookie = (name: string): string | null => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || null;
    return null;
  };

  // Check if user is already logged in on component mount
  useEffect(() => {
    getUser().finally(() => setIsLoading(false));
  }, []);

  // Fetch user profile from backend
  const getUser = async () => {
    try {
      const response = await axios.get('/api/auth/me');
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
    }
  };

  // Login with credentials
  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      // Tokens are stored in httpOnly cookies by backend
      await getUser();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    }
  };

  // Logout - clear session
  const logout = async () => {
    try {
      await axios.post('/api/auth/logout');
      setUser(null);
      navigate('/login');
    } catch (err) {
      setError('Logout failed');
      setUser(null);
      navigate('/login');
    }
  };

  // Refresh access token using refresh token cookie
  const refreshAccessToken = async () => {
    try {
      await axios.post('/api/auth/refresh');
      await getUser();
    } catch (err) {
      setError('Token refresh failed');
      await logout();
    }
  };

  // Value passed to context
  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    refreshAccessToken,
    getUser,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};