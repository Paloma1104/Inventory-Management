import axios from 'axios';
import type {
  Analytics,
  AuditLog,
  AuthResponse,
  Category,
  DashboardStats,
  Product,
  Transaction,
  User,
  ProductRequest,
  StockRunwayPrediction,
} from '../types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRequest = error.config?.url?.includes('/auth/login')
      || error.config?.url?.includes('/auth/register');

    if (error.response?.status === 401 && !isAuthRequest) {
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('name');
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }),
  register: (data: { name: string; email: string; password: string; confirm_password: string }) =>
    api.post<AuthResponse>('/auth/register', data),
};

export const usersApi = {
  list: () => api.get<User[]>('/users/'),
  create: (data: { name: string; email: string; password: string; role: string }) =>
    api.post<User>('/users/', data),
  update: (id: number, data: Partial<User>) => api.put<User>(`/users/${id}`, data),
  delete: (id: number, hard: boolean = false) => api.delete(`/users/${id}?hard=${hard}`),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post<{ message: string }>('/users/change-password', data),
};

export const productsApi = {
  list: () => api.get<Product[]>('/products'),
  get: (id: number) => api.get<Product>(`/products/${id}`),
  create: (data: Omit<Product, 'product_id' | 'created_at' | 'updated_at' | 'status' | 'category_name'>) =>
    api.post<Product>('/products', data),
  update: (id: number, data: Partial<Product>) => api.put<Product>(`/products/${id}`, data),
  delete: (id: number) => api.delete(`/products/${id}`),
};

export const categoriesApi = {
  list: () => api.get<Category[]>('/categories'),
  create: (category_name: string) => api.post<Category>('/categories', { category_name }),
};

export const transactionsApi = {
  list: () => api.get<Transaction[]>('/transactions/'),
  create: (data: { product_id: number; transaction_type: string; quantity: number; remarks?: string; ordered_at?: string }) =>
    api.post<Transaction>('/transactions/', data),
};

export const auditLogsApi = {
  list: () => api.get<AuditLog[]>('/audit-logs/'),
};

export const dashboardApi = {
  stats: () => api.get<DashboardStats>('/dashboard/stats'),
  analytics: () => api.get<Analytics>('/dashboard/analytics'),
};

export const productRequestsApi = {
  list: () => api.get<ProductRequest[]>('/product-requests'),
  create: (data: {
    product_id?: number;
    product_name: string;
    category_id?: number;
    quantity: number;
    remarks?: string;
  }) => api.post<ProductRequest>('/product-requests', data),
  update: (id: number, data: { status: 'approved' | 'rejected'; remarks?: string }) =>
    api.put<ProductRequest>(`/product-requests/${id}`, data),
};

export const aiApi = {
  getPredictions: () => api.get<StockRunwayPrediction[]>('/ai/all-predictions'),
};

export const chatbotApi = {
  chat: (message: string) => api.post<{ response: string }>('/chatbot/', { message }),
};

export default api;

