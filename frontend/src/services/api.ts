import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

// Request interceptor: inject token for authenticated admin endpoints
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('cricket_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle unauthorized errors gracefully
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized and currently in admin section, clean token
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        localStorage.removeItem('cricket_admin_token');
        localStorage.removeItem('cricket_admin_user');
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);
