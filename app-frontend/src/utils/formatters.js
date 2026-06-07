// src/utils/formatters.js

/**
 * Format a number as Indian Rupees  ₹1,00,000
 */
export function formatINR(amount = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Short currency — strips "₹" symbol and returns just the formatted number
 */
export function formatINRShort(amount = 0) {
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`;
  }
  if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`;
  }
  return formatINR(amount);
}

/**
 * Format date to "7 Jun 2025" style
 */
export function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format date to "Today", "Yesterday", or "7 Jun"
 */
export function formatRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/**
 * Get percentage safely (avoids divide-by-zero)
 */
export function getPercent(value, total) {
  if (!total || total === 0) return 0;
  return Math.min(100, Math.round((value / total) * 100));
}

/**
 * Get initials from a name ("Raghav Bagdi" → "RB")
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}
