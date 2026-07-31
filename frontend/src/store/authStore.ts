import { create } from 'zustand';
import api from '@/lib/axios-client';
import { saveTokens, getAccessToken, getRefreshToken, clearTokens, isAuthenticated, refreshToken as refreshFn } from '@/lib/auth-utils';

interface UserState {
  user: any | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  getUser: () => Promise<any>;
  setTemporaryUser: (user: any) => void;
}

export const useAuthStore = create<UserState>((set) => ({
  user: null,
  loading: false,
  error: null,

  async login(email, password) {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });

      if (res.data.accessToken && res.data.refreshToken) {
        saveTokens(res.data.accessToken, res.data.refreshToken);
      }

      set({ user: res.data.user, loading: false });
      return res.data;
    } catch (err: any) {
      set({
        loading: false,
        error: err.response?.data?.message || 'Login failed. Please check your credentials.'
      });
      throw err;
    }
  },

  async logout() {
    try {
      // Call backend to revoke tokens (if accessible with current token)
      const token = getAccessToken();
      if (token) {
        await api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      // Continue even if logout API fails — we're clearing tokens locally anyway
      console.warn('Logout API error:', err);
    } finally {
      clearTokens();
      set({ user: null, loading: false, error: null });
      window.location.href = '/login';
    }
  },

  async refreshAccessToken() {
    const token = getAccessToken();
    const refreshToken = getRefreshToken();

    // If we have a refresh token but no access token (or it's expired), try to refresh
    if (!token && refreshToken) {
      try {
        const res = await api.post('/auth/refresh', { refreshToken: refreshToken });
        saveTokens(res.data.accessToken, res.data.refreshToken);
        set({ user: res.data.user });
        return res.data;
      } catch (err) {
        clearTokens();
        throw new Error('Failed to refresh session. Please log in again.');
      }
    } else if (token && !isAuthenticated()) {
      // Access token is expired but still in storage — try refresh
      try {
        const res = await api.post('/auth/refresh', { refreshToken: refreshToken || '' });
        saveTokens(res.data.accessToken, res.data.refreshToken || '');
        set({ user: res.data });
        return res.data;
      } catch (err) {
        clearTokens();
        throw new Error('Session expired. Please log in again.');
      }
    }
  },

  async getUser() {
    // First, check if token is valid and we already have user data
    if (isAuthenticated() && this.user) {
      return this.user;
    }

    // Try to refresh first if needed
    try {
      await this.refreshAccessToken();
    } catch (err) {
      // Refresh failed — fall back to /me if token exists
      const token = getAccessToken();
      if (token) {
        try {
          const res = await api.get('/auth/me');
          set({ user: res.data, loading: false });
          return res.data;
        } catch (meErr) {
          clearTokens();
          throw meErr;
        }
      }
      throw new Error('No active session');
    }

    return this.user;
  },

  setTemporaryUser: (user: any) => set({ user }),
}));

// Helper hook to check authentication status directly
export const useIsAuthenticated = (): boolean => {
  const { user } = useAuthStore();
  return !!user && isAuthenticated();
};
