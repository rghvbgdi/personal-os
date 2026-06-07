import { Router } from 'express';
import { createGoal, getGoals, updateGoal, deleteGoal } from '../controllers/goal.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { body } from 'express-validator';
import { validate } from '../middleware/validate.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/', [
  body('title').trim().notEmpty().isLength({ max: 80 }),
  body('targetAmount').isFloat({ min: 1 }),
  body('type').optional().isIn(['savings', 'emergency', 'investment', 'purchase', 'travel', 'other']),
], validate, createGoal);
router.get('/', getGoals);
router.patch('/:id', updateGoal);
router.delete('/:id', deleteGoal);

export default router;
