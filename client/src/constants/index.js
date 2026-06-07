export const EXPENSE_CATEGORIES = [
  { value: 'food', label: 'Food & Dining', icon: '🍽️', color: '#f59e0b' },
  { value: 'transport', label: 'Transport', icon: '🚗', color: '#3b82f6' },
  { value: 'rent', label: 'Rent', icon: '🏠', color: '#8b5cf6' },
  { value: 'groceries', label: 'Groceries & Shopping', icon: '🛒', color: '#10b981' },
  { value: 'utilities', label: 'Utilities', icon: '⚡', color: '#f59e0b' },
  { value: 'entertainment', label: 'Entertainment', icon: '🎮', color: '#ec4899' },
  { value: 'health', label: 'Health', icon: '❤️', color: '#ef4444' },
  { value: 'education', label: 'Education', icon: '📚', color: '#6366f1' },
  { value: 'subscriptions', label: 'Subscriptions', icon: '📱', color: '#14b8a6' },
  { value: 'travel', label: 'Travel', icon: '✈️', color: '#0ea5e9' },
  { value: 'personal', label: 'Personal Care', icon: '👤', color: '#a855f7' },
  { value: 'emi', label: 'EMI / Loans', icon: '💳', color: '#dc2626' },
  { value: 'philanthropy', label: 'Philanthropy', icon: '🤝', color: '#10b981' },
  { value: 'family', label: 'Family', icon: '👨‍👩‍👧‍👦', color: '#f43f5e' },
  { value: 'grooming', label: 'Grooming', icon: '✂️', color: '#8b5cf6' },
  { value: 'other', label: 'Other', icon: '📦', color: '#6b7280' },
];

export const INCOME_CATEGORIES = [
  { value: 'salary', label: 'Salary', icon: '💼', color: '#059669' },
  { value: 'freelance', label: 'Freelance', icon: '💻', color: '#10b981' },
  { value: 'bonus', label: 'Bonus', icon: '🎁', color: '#22c55e' },
  { value: 'interest', label: 'Interest / Returns', icon: '🏦', color: '#14b8a6' },
  { value: 'other-income', label: 'Other Income', icon: '💰', color: '#6b7280' },
];

export const INVESTMENT_CATEGORIES = [
  { value: 'sip', label: 'SIP / Mutual Fund', icon: '📊', color: '#6366f1' },
  { value: 'stocks', label: 'Stocks', icon: '📈', color: '#3b82f6' },
  { value: 'fd', label: 'Fixed Deposit', icon: '🏦', color: '#8b5cf6' },
  { value: 'crypto', label: 'Crypto', icon: '🪙', color: '#f59e0b' },
  { value: 'gold', label: 'Gold', icon: '🥇', color: '#eab308' },
  { value: 'ppf', label: 'PPF / NPS', icon: '🏛️', color: '#0ea5e9' },
  { value: 'emergency-fund', label: 'Emergency Fund', icon: '🆘', color: '#dc2626' },
  { value: 'savings-account', label: 'Savings Account', icon: '💰', color: '#059669' },
];

export const CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES, ...INVESTMENT_CATEGORIES];

export const CATEGORIES_BY_TYPE = {
  expense: EXPENSE_CATEGORIES,
  income: INCOME_CATEGORIES,
  investment: INVESTMENT_CATEGORIES,
};

export const PAYMENT_METHODS = [
  { value: 'upi', label: 'UPI', icon: '📲' },
  { value: 'cash', label: 'Cash', icon: '💵' },
  { value: 'card', label: 'Card', icon: '💳' },
  { value: 'netbanking', label: 'Net Banking', icon: '🏦' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
  { value: 'other', label: 'Other', icon: '🔄' },
];

export const PLACEMENT_SUBJECTS = [
  { value: 'dsa', label: 'DSA', icon: '🔢', color: '#3b82f6' },
  { value: 'oops', label: 'OOP', icon: '🧱', color: '#8b5cf6' },
  { value: 'dbms', label: 'DBMS', icon: '🗄️', color: '#f59e0b' },
  { value: 'cn', label: 'Computer Networks', icon: '🌐', color: '#10b981' },
  { value: 'os', label: 'Operating Systems', icon: '💻', color: '#ef4444' },
  { value: 'system-design', label: 'System Design', icon: '🏗️', color: '#ec4899' },
  { value: 'projects', label: 'Projects', icon: '🚀', color: '#059669' },
];

export const MASTERY_LEVELS = [
  { value: 'not-started', label: 'Not Started', color: '#525252' },
  { value: 'learning', label: 'Learning', color: '#3b82f6' },
  { value: 'practicing', label: 'Practicing', color: '#f59e0b' },
  { value: 'confident', label: 'Confident', color: '#10b981' },
  { value: 'mastered', label: 'Mastered', color: '#059669' },
];

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  EXPENSES: '/expenses',
  ANALYTICS: '/analytics',
  GOALS: '/goals',
  PLACEMENT: '/placement',
  NOTES: '/notes',
  HABITS: '/habits',
  BUDGET: '/budget',
};

export const QUERY_KEYS = {
  USER: ['user'],
  EXPENSES: ['expenses'],
  EXPENSE_DASHBOARD: ['expenses', 'dashboard'],
  EXPENSE_MONTHLY: (y, m) => ['expenses', 'analytics', 'monthly', y, m],
  EXPENSE_YEARLY: (y) => ['expenses', 'analytics', 'yearly', y],
  BUDGETS: ['budgets'],
  GOALS: ['goals'],
  PLACEMENT: ['placement'],
  PLACEMENT_STATS: ['placement', 'stats'],
  PLACEMENT_PROGRESS: ['placement', 'progress'],
  PLACEMENT_TODO: ['placement', 'todo'],
  NOTES: ['notes'],
  HABITS: ['habits'],
  POMODORO_STATS: ['pomodoro', 'stats'],
  POMODORO_SESSIONS: ['pomodoro', 'sessions'],
};
