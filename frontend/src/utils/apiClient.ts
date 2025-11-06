// frontend/src/utils/apiClient.ts

import axios, { AxiosError } from 'axios';
import type { AxiosInstance } from 'axios';

// Dynamically determine the API base URL based on the current environment
const getBaseURL = (): string => {
  // Use environment variable if explicitly set (production)
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  // Check if running on GitHub Codespaces
  const hostname = window.location.hostname;
  
  if (hostname.includes('.app.github.dev')) {
    // GitHub Codespaces: Replace frontend port with backend port
    const baseURL = `https://${hostname.replace('-5173.', '-3000.')}/api`;
    return baseURL;
  }

  // Local development fallback - use environment variable or default
  return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
};

const baseURL = getBaseURL();

const apiClient: AxiosInstance = axios.create({
  baseURL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // Handle 401 and attempt to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          // Clear auth and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          return Promise.reject(error);
        }

        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);

        // Retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API utility functions
export const api = {
  // Auth
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  logout: () => apiClient.post('/auth/logout'),
  getMe: () => apiClient.get('/auth/me'),
  refreshToken: (refreshToken: string) => apiClient.post('/auth/refresh', { refreshToken }),

  // API Keys
  getApiKeys: () => apiClient.get('/user/api-keys'),
  createApiKey: (name: string) => apiClient.post('/user/api-keys', { name }),
  revokeApiKey: (id: string) => apiClient.delete(`/user/api-keys/${id}`),
  rotateApiKey: (id: string) => apiClient.post(`/user/api-keys/${id}/rotate`),

  // Usage
  getUsageSummary: (days?: number) => apiClient.get('/user/usage/summary', { params: { days } }),
  getDetailedUsage: (page?: number, pageSize?: number) =>
    apiClient.get('/user/usage/detailed', { params: { page, pageSize } }),
  getMonthlyUsage: (year: number, month: number) =>
    apiClient.get(`/user/usage/monthly/${year}/${month}`),
  getQuotaStatus: () => apiClient.get('/user/usage/quota'),
  getUsageByEndpoint: (days?: number) =>
    apiClient.get('/user/usage/by-endpoint', { params: { days } }),

  // Subscriptions
  getCurrentSubscription: () => apiClient.get('/user/subscription'),
  getPlans: () => apiClient.get('/user/subscription/plans'),
  upgradePlan: (planId: string) => apiClient.post('/user/subscription/upgrade', { planId }),
  downgradePlan: (planId: string) => apiClient.post('/user/subscription/downgrade', { planId }),
  cancelSubscription: (reason?: string) =>
    apiClient.post('/user/subscription/cancel', { reason }),

  // Billing
  getInvoices: (page?: number, pageSize?: number) =>
    apiClient.get('/user/billing/invoices', { params: { page, pageSize } }),
  getPaymentMethods: () => apiClient.get('/user/billing/payment-methods'),
  addPaymentMethod: (data: any) => apiClient.post('/user/billing/payment-methods', data),
  deletePaymentMethod: (id: string) => apiClient.delete(`/user/billing/payment-methods/${id}`),
  setDefaultPaymentMethod: (id: string) =>
    apiClient.post(`/user/billing/payment-methods/${id}/set-default`),
  getBillingOverview: () => apiClient.get('/user/billing/overview'),

  // Admin routes
  getUsers: (page?: number, pageSize?: number, search?: string) =>
    apiClient.get('/admin/users', { params: { page, pageSize, search } }),
  getUser: (id: string) => apiClient.get(`/admin/users/${id}`),
  suspendUser: (id: string, reason?: string) =>
    apiClient.post(`/admin/users/${id}/suspend`, { reason }),
  reactivateUser: (id: string) => apiClient.post(`/admin/users/${id}/reactivate`),
  makeUserAdmin: (id: string) => apiClient.post(`/admin/users/${id}/make-admin`),
  removeUserAdmin: (id: string) => apiClient.post(`/admin/users/${id}/remove-admin`),

  // Admin Plans
  getPlansAdmin: () => apiClient.get('/admin/plans'),
  getPlanAdmin: (id: string) => apiClient.get(`/admin/plans/${id}`),
  createPlan: (data: any) => apiClient.post('/admin/plans', data),
  updatePlan: (id: string, data: any) => apiClient.put(`/admin/plans/${id}`, data),
  deletePlan: (id: string) => apiClient.delete(`/admin/plans/${id}`),

  // Admin Analytics
  getRevenueAnalytics: (months?: number) =>
    apiClient.get('/admin/analytics/revenue', { params: { months } }),
  getApiAnalytics: (days?: number) =>
    apiClient.get('/admin/analytics/api', { params: { days } }),
  getUserAnalytics: () => apiClient.get('/admin/analytics/users'),
  getTopUsers: (limit?: number, days?: number) =>
    apiClient.get('/admin/analytics/top-users', { params: { limit, days } })
};

export default apiClient;
