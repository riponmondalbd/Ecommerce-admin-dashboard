import axios from 'axios';
import { Toast } from '@/components/ui/Toast'; // Assuming a toast component for error messages

// Base URL from environment variable (public - safe to use in browser)
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
});

// Request interceptor: inject access token from localStorage
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Always set content-type for JSON
    config.headers['Content-Type'] = 'application/json';
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor: handle errors globally
api.interceptors.response.use(
  response => response,
  error => {
    // Handle unauthenticated/authorization errors
    if (error.response?.status === 401) {
      // Token expired or invalid — clear tokens and redirect to login
      clearTokens();
      // In a real app, you might show a "session expired" toast
      Toast.error('Session expired. Please log in again.');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Handle forbidden (insufficient permissions)
    if (error.response?.status === 403) {
      Toast.error('Insufficient permissions to perform this action.');
      return Promise.reject(error);
    }

    // Handle validation errors from backend
    if (error.response?.status === 400 && error.response?.data?.message) {
      Toast.error(error.response.data.message);
      return Promise.reject(error);
    }

    // For other errors, show a generic toast (but not for network errors already caught elsewhere)
    if (error.response && error.response.status >= 500) {
      Toast.error('Server error. Please try again later.');
    } else if (!error.response) {
      // Network error — could be offline or CORS issue
      Toast.error('Network error. Check your connection or API server.');
    }

    return Promise.reject(error);
  }
);

// Helper: Clear stored tokens
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

// Export types for usage
export interface ApiError {
  message: string;
  statusCode?: number;
  data?: any;
}

export default api;
