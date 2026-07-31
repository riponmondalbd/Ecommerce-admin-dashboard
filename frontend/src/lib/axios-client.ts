import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Token refresh lock to prevent parallel refresh attempts
let refreshPromise: Promise<void> | null = null;

// Request interceptor: inject access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 with token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't already retried, try token refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it
        if (refreshPromise) {
          await refreshPromise;
        } else {
          refreshPromise = (async () => {
            try {
              const refreshToken = localStorage.getItem('refresh_token');
              if (!refreshToken) return;

              const res = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
              const data = res.data.data || res.data;
              if (data.accessToken && data.refreshToken) {
                localStorage.setItem('access_token', data.accessToken);
                localStorage.setItem('refresh_token', data.refreshToken);
              }
            } catch {
              // Refresh failed — clear tokens
              localStorage.removeItem('access_token');
              localStorage.removeItem('refresh_token');
              window.location.href = '/login';
            }
          })();
          await refreshPromise;
          refreshPromise = null;
        }

        // Retry the original request with the new token
        const newToken = localStorage.getItem('access_token');
        if (newToken) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return axios(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 with a clear message
    if (error.response?.status === 403) {
      console.warn('Permission denied:', error.response?.data?.message);
    }

    return Promise.reject(error);
  }
);

export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

export interface ApiError {
  message: string;
  statusCode?: number;
  data?: any;
}

export default api;
