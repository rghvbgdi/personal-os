import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, refresh, logout, getMe, updateProfile } from '../controllers/auth.controller.js';
import { validate } from '../middleware/validate.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimiter.middleware.js';

const router = Router();

router.post('/register',
  authLimiter,
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 60 }),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  ],
  validate,
  register
);

router.post('/login',
  authLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  login
);

router.post('/refresh', refresh);
router.post('/logout', authenticate, logout);
router.get('/me', authenticate, getMe);
router.patch('/me', authenticate, [
  body('name').optional().trim().isLength({ min: 1, max: 60 }),
  body('monthlyBudget').optional().isFloat({ min: 0 }),
], validate, updateProfile);

export default router;
