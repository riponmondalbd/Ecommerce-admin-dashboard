import api from './api';

interface LoginPayload {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  // Login - stores tokens in httpOnly cookies via backend
  async login(email: string, password: string) {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  }

  // Logout - revokes refresh token
  async logout() {
    await api.post('/auth/logout');
  }

  // Refresh access token using refresh token cookie
  async refresh() {
    const response = await api.post('/auth/refresh');
    return response.data;
  }

  // Get current user profile
  async getMe() {
    const response = await api.get('/me');
    return response.data;
  }
}

export default new AuthService();