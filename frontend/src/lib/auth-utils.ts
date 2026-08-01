/**
 * Auth Utilities - Token handling and validation helpers
 * These functions manage access and refresh tokens stored in localStorage.
 * NOTE: For production, consider using httpOnly cookies for higher security.
 */

// Save tokens to localStorage
export const saveTokens = (accessToken: string, refreshToken: string) => {
  localStorage.setItem('access_token', accessToken);
  localStorage.setItem('refresh_token', refreshToken);
};

// Get access token from localStorage
export const getAccessToken = (): string | null => {
  return localStorage.getItem('access_token');
};

// Get refresh token from localStorage
export const getRefreshToken = (): string | null => {
  return localStorage.getItem('refresh_token');
};

// Clear all tokens from localStorage
export const clearTokens = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
};

/**
 * Check if access token exists and is not expired
 * Uses simple JWT payload inspection (exp field)
 */
export const isAuthenticated = (): boolean => {
  const token = getAccessToken();
  if (!token) return false;

  try {
    // Split token into parts (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    const payloadBase64 = parts[1];
    if (!payloadBase64) return false;

    // Decode base64 (handles padding issues)
    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    // Properly add padding
    const paddingNeeded = (4 - (padded.length % 4)) % 4;
    const decodedAtob = atob(padded + '='.repeat(paddingNeeded));
    const payload = JSON.parse(decodedAtob);

    // Check expiration (exp is in seconds, convert to ms)
    return Date.now() < (payload.exp || 0) * 1000;
  } catch (error) {
    console.warn('Error decoding token:', error);
    return false;
  }
};

/**
 * Get remaining time in seconds before token expires
 * Returns 0 if token is invalid/expired
 */
export const getRemainingTime = (): number => {
  const token = getAccessToken();
  if (!token) return 0;

  try {
    const parts = token.split('.');
    if (parts.length !== 3) return 0;

    const payloadBase64 = parts[1];
    if (!payloadBase64) return 0;

    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (4 - (padded.length % 4)) % 4;
    const decodedAtob = atob(padded + '='.repeat(paddingNeeded));
    const payload = JSON.parse(decodedAtob);

    const expSeconds = payload.exp || 0;
    const remainingSeconds = Math.floor((expSeconds * 1000 - Date.now()) / 1000);

    return Math.max(0, remainingSeconds);
  } catch (error) {
    console.warn('Error calculating token expiry:', error);
    return 0;
  }
};

/**
 * Refresh the access token using the refresh token
 * This makes an API call to /auth/refresh endpoint
 */
export const refreshToken = async (api: any): Promise<{ accessToken: string; refreshToken: string }> => {
  const refreshTokenValue = getRefreshToken();
  if (!refreshTokenValue) throw new Error('No refresh token available');

  const response = await api.post('/auth/refresh', { refreshToken: refreshTokenValue });
  saveTokens(response.data.accessToken, response.data.refreshToken);
  return { accessToken: response.data.accessToken, refreshToken: response.data.refreshToken };
};

/**
 * Decode JWT payload (for debugging/display purposes only)
 */
export const decodeToken = (token: string): any => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const payloadBase64 = parts[1];
    const padded = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const paddingNeeded = (4 - (padded.length % 4)) % 4;
    const decodedAtob = atob(padded + '='.repeat(paddingNeeded));
    return JSON.parse(decodedAtob);
  } catch (error) {
    console.warn('Could not decode token:', error);
    return null;
  }
};

export default {
  saveTokens,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
  getRemainingTime,
  refreshToken,
  decodeToken,
};
