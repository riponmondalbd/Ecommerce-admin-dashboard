import axios from 'axios';

// Create API instance with baseURL and interceptors
const api = axios.create({
  baseURL: '/api',
  withCredentials: true, // Important for sending cookies (JWT refresh token)
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // You can add auth headers here if needed
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 Unauthorized errors (token expired or invalid)
    if (error.response?.status === 401) {
      // Trigger refresh token flow
      console.error('Token expired or invalid. Refreshing...');
    }
    return Promise.reject(error);
  }
);

export default api;