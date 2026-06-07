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
