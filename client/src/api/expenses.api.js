import api from './client.js';

export const expensesApi = {
  create: (data) => api.post('/expenses', data),
  getAll: (params) => api.get('/expenses', { params }),
  getOne: (id) => api.get(`/expenses/${id}`),
  update: (id, data) => api.patch(`/expenses/${id}`, data),
  delete: (id) => api.delete(`/expenses/${id}`),
  getDashboard: (params) => api.get('/expenses/dashboard', { params }),
  getAnalyticsRange: (params) => api.get('/expenses/analytics/range', { params }),
  getMonthlyAnalytics: (params) => api.get('/expenses/analytics/monthly', { params }),
  getYearlyAnalytics: (params) => api.get('/expenses/analytics/yearly', { params }),
};
