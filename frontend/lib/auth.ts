import api from './api';

export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

export const getCurrentUser = (): any | null => {
  const accessToken = localStorage.getItem('accessToken');
  if (!accessToken) return null;

  try {
    const base64Url = accessToken.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = JSON.parse(atob(base64));
    return decoded;
  } catch (error) {
    return null;
  }
};

export const clearAuthState = (): void => {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userPermissions');
};

export const savePermissions = (permissions: string[]): void => {
  localStorage.setItem('userPermissions', JSON.stringify(permissions));
};

export const getUserPermissions = (): string[] => {
  const permissions = localStorage.getItem('userPermissions');
  return permissions ? JSON.parse(permissions) : [];
};

export const hasPermission = (permission: string): boolean => {
  const permissions = getUserPermissions();
  return permissions.includes(permission) || permissions.includes('*:*');
};
