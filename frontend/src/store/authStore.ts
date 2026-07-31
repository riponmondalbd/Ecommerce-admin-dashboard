import { create } from 'zustand';
import api from '@/lib/axios-client';
import { saveTokens, getAccessToken, getRefreshToken, clearTokens, isAuthenticated } from '@/lib/auth-utils';

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

export const useAuthStore = create<UserState>((set, get) => ({
  user: null,
  loading: false,
  error: null,

  async login(email, password) {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const data = res.data.data || res.data;

      if (data.accessToken && data.refreshToken) {
        saveTokens(data.accessToken, data.refreshToken);
      }

      // Fetch full user profile after login
      const profile = await api.get('/auth/me');
      const user = profile.data.data || profile.data;

      set({ user, loading: false, error: null });
      return user;
    } catch (err: any) {
      const message = err.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ loading: false, error: message });
      throw err;
    }
  },

  async logout() {
    try {
      const token = getAccessToken();
      if (token) {
        await api.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } });
      }
    } catch (err) {
      console.warn('Logout API error:', err);
    } finally {
      clearTokens();
      set({ user: null, loading: false, error: null });
      window.location.href = '/login';
    }
  },

  async refreshAccessToken() {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    try {
      const res = await api.post('/auth/refresh', { refreshToken });
      const data = res.data.data || res.data;
      if (data.accessToken && data.refreshToken) {
        saveTokens(data.accessToken, data.refreshToken);
      }
      return data;
    } catch (err) {
      clearTokens();
      throw new Error('Failed to refresh session. Please log in again.');
    }
  },

  async getUser() {
    if (isAuthenticated() && get().user) {
      return get().user;
    }

    try {
      await get().refreshAccessToken();
    } catch (err) {
      const token = getAccessToken();
      if (token) {
        try {
          const res = await api.get('/auth/me');
          const user = res.data.data || res.data;
          set({ user, loading: false });
          return user;
        } catch (meErr: any) {
          if (meErr.response?.status === 401 || meErr.response?.status === 403) {
            clearTokens();
          }
          throw meErr;
        }
      }
      throw new Error('No active session');
    }

    // After refresh, fetch user profile
    try {
      const res = await api.get('/auth/me');
      const user = res.data.data || res.data;
      set({ user, loading: false });
      return user;
    } catch {
      return get().user;
    }
  },

  setTemporaryUser: (user: any) => set({ user }),
}));

export const useIsAuthenticated = (): boolean => {
  const { user } = useAuthStore();
  return !!user && isAuthenticated();
};
