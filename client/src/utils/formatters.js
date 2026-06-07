import { format, formatDistanceToNow, startOfMonth, endOfMonth } from 'date-fns';

export const formatCurrency = (amount, currency = 'INR') =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount);

export const formatDate = (date, fmt = 'MMM d, yyyy') =>
  format(new Date(date), fmt);

export const formatRelativeTime = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const formatPercent = (value, total) =>
  total === 0 ? 0 : Math.round((value / total) * 100);

export const getMonthRange = (date = new Date()) => ({
  start: startOfMonth(date),
  end: endOfMonth(date),
});

export const truncate = (str, n = 30) =>
  str?.length > n ? `${str.slice(0, n)}…` : str;

export const getInitials = (name = '') =>
  name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase();

export const changePercent = (current, previous) => {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
};
