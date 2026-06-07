import { Router } from 'express';
import { body, query } from 'express-validator';
import {
  createExpense, getExpenses, getExpense, updateExpense, deleteExpense,
  getMonthlyAnalytics, getYearlyAnalytics, getDashboardSummary, getAnalyticsRange
} from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { CATEGORIES, PAYMENT_METHODS } from '../models/Expense.js';


const router = Router();
router.use(authenticate);

const expenseBody = [
  body('title').trim().notEmpty().withMessage('Title is required').isLength({ max: 100 }),
  body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount required'),
  body('category').isIn(CATEGORIES).withMessage('Invalid category'),
  body('type').optional().isIn(['expense', 'income', 'investment']),
  body('paymentMethod').optional().isIn(PAYMENT_METHODS),
  body('date').optional().isISO8601().withMessage('Valid date required'),
  body('tags').optional().isArray(),
  body('notes').optional().trim().isLength({ max: 500 }),
  body('isRecurring').optional().isBoolean(),
];

router.post('/', expenseBody, validate, createExpense);
router.get('/', getExpenses);
router.get('/analytics/range', getAnalyticsRange);
router.get('/analytics/monthly', getMonthlyAnalytics);
router.get('/analytics/yearly', getYearlyAnalytics);
router.get('/dashboard', getDashboardSummary);
router.get('/:id', getExpense);
router.patch('/:id', expenseBody, validate, updateExpense);
router.delete('/:id', deleteExpense);

export default router;
