export { authApi } from './auth.api.js';
export { expensesApi } from './expenses.api.js';

import api from './client.js';

export const budgetApi = {
  get: (params) => api.get('/budgets', { params }),
  upsert: (data) => api.put('/budgets', data),
};

export const goalApi = {
  create: (data) => api.post('/goals', data),
  getAll: (params) => api.get('/goals', { params }),
  update: (id, data) => api.patch(`/goals/${id}`, data),
  delete: (id) => api.delete(`/goals/${id}`),
};

export const placementApi = {
  create: (data) => api.post('/placement', data),
  getAll: (params) => api.get('/placement', { params }),
  getStats: () => api.get('/placement/stats'),
  update: (id, data) => api.patch(`/placement/${id}`, data),
  markRevision: (id) => api.patch(`/placement/${id}/revise`),
  delete: (id) => api.delete(`/placement/${id}`),
};

export const noteApi = {
  create: (data) => api.post('/notes', data),
  getAll: (params) => api.get('/notes', { params }),
  update: (id, data) => api.patch(`/notes/${id}`, data),
  delete: (id) => api.delete(`/notes/${id}`),
};

export const habitApi = {
  create: (data) => api.post('/habits', data),
  getAll: () => api.get('/habits'),
  checkIn: (id) => api.post(`/habits/${id}/checkin`),
  update: (id, data) => api.patch(`/habits/${id}`, data),
  delete: (id) => api.delete(`/habits/${id}`),
};

export const pomodoroApi = {
  log: (data) => api.post('/pomodoro', data),
  getSessions: (params) => api.get('/pomodoro', { params }),
  getStats: () => api.get('/pomodoro/stats'),
};

export const progressApi = {
  getAll: () => api.get('/progress'),
  upsert: (data) => api.put('/progress', data),
  getStats: () => api.get('/progress/stats'),
};

// ── Todo Module APIs ──────────────────────────────────────────────────────────

export const taskApi = {
  create: (data) => api.post('/tasks', data),
  getAll: (params) => api.get('/tasks', { params }),
  getToday: () => api.get('/tasks/today'),
  update: (id, data) => api.patch(`/tasks/${id}`, data),
  toggleComplete: (id) => api.patch(`/tasks/${id}/complete`),
  delete: (id) => api.delete(`/tasks/${id}`),
};

export const eventApi = {
  create: (data) => api.post('/events', data),
  getAll: (params) => api.get('/events', { params }),
  getOne: (id) => api.get(`/events/${id}`),
  update: (id, data) => api.patch(`/events/${id}`, data),
  delete: (id) => api.delete(`/events/${id}`),
};

export const sleepApi = {
  log: (data) => api.post('/sleep', data),
  getLogs: (params) => api.get('/sleep', { params }),
  getInsights: () => api.get('/sleep/insights'),
};

export const notificationApi = {
  getVapidKey: () => api.get('/notifications/vapid-key'),
  subscribe: (subscription) => api.post('/notifications/subscribe', { subscription }),
  sendTest: () => api.post('/notifications/test'),
  getPending: () => api.get('/notifications/pending'),
};

export const reviewApi = {
  upsert: (data) => api.post('/review', data),
  get: (params) => api.get('/review', { params }),
};

export const internshipApi = {
  save: (data) => api.post('/internship', data),
  get: () => api.get('/internship'),
};

export const todoDashboardApi = {
  getToday: () => api.get('/dashboard/today'),
};
