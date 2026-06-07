// src/api/client.js
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:8000/api/v1';

// ─── Token helpers ───────────────────────────────────────────────────────────
export const TOKEN_KEY = 'accessToken';
export const REFRESH_KEY = 'refreshToken';

export async function getAccessToken() {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function getRefreshToken() {
  return SecureStore.getItemAsync(REFRESH_KEY);
}
export async function saveTokens(access, refresh) {
  await SecureStore.setItemAsync(TOKEN_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}
export async function clearTokens() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_KEY);
}

// ─── Axios instance ───────────────────────────────────────────────────────────
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request: attach access token
api.interceptors.request.use(async (config) => {
  const token = await getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Track whether a refresh is already in-flight
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
}

// Response: on 401 → try refresh, then retry original request
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Queue this request until refresh resolves
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccess = data.data?.accessToken || data.accessToken;
        const newRefresh = data.data?.refreshToken || data.refreshToken || refreshToken;

        await saveTokens(newAccess, newRefresh);
        processQueue(null, newAccess);

        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        await clearTokens();
        // Signal to AuthContext to log out
        return Promise.reject({ ...refreshError, isAuthError: true });
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ─── API modules ──────────────────────────────────────────────────────────────

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  updateProfile: (data) => api.put('/auth/profile', data),
};

export const expenseAPI = {
  getAll: (params) => api.get('/expenses', { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  create: (data) => api.post('/expenses', data),
  update: (id, data) => api.put(`/expenses/${id}`, data),
  remove: (id) => api.delete(`/expenses/${id}`),
  getSummary: (params) => api.get('/expenses/summary', { params }),
};

export const budgetAPI = {
  getAll: (params) => api.get('/budgets', { params }),
  getOne: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const goalAPI = {
  getAll: () => api.get('/goals'),
  getOne: (id) => api.get(`/goals/${id}`),
  create: (data) => api.post('/goals', data),
  update: (id, data) => api.put(`/goals/${id}`, data),
  remove: (id) => api.delete(`/goals/${id}`),
  addContribution: (id, data) => api.post(`/goals/${id}/contribute`, data),
};

export const habitAPI = {
  getAll: () => api.get('/habits'),
  getOne: (id) => api.get(`/habits/${id}`),
  create: (data) => api.post('/habits', data),
  update: (id, data) => api.put(`/habits/${id}`, data),
  remove: (id) => api.delete(`/habits/${id}`),
  markComplete: (id, data) => api.post(`/habits/${id}/complete`, data),
};

export const noteAPI = {
  getAll: (params) => api.get('/notes', { params }),
  getOne: (id) => api.get(`/notes/${id}`),
  create: (data) => api.post('/notes', data),
  update: (id, data) => api.put(`/notes/${id}`, data),
  remove: (id) => api.delete(`/notes/${id}`),
};

export const placementAPI = {
  getTopics: () => api.get('/placement/topics'),
  getProgress: (params) => api.get('/placement/progress', { params }),
  updateProgress: (id, data) => api.put(`/placement/progress/${id}`, data),
  createProgress: (data) => api.post('/placement/progress', data),
};

export const pomodoroAPI = {
  getAll: (params) => api.get('/pomodoro', { params }),
  create: (data) => api.post('/pomodoro', data),
  update: (id, data) => api.put(`/pomodoro/${id}`, data),
  remove: (id) => api.delete(`/pomodoro/${id}`),
};

export default api;
