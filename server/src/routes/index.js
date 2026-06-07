import { Router } from 'express';
import authRoutes from './auth.routes.js';
import expenseRoutes from './expense.routes.js';
import budgetRoutes from './budget.routes.js';
import goalRoutes from './goal.routes.js';
import placementRoutes from './placement.routes.js';
import noteRoutes from './note.routes.js';
import habitRoutes from './habit.routes.js';
import pomodoroRoutes from './pomodoro.routes.js';
import progressRoutes from './progress.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/expenses', expenseRoutes);
router.use('/budgets', budgetRoutes);
router.use('/goals', goalRoutes);
router.use('/placement', placementRoutes);
router.use('/notes', noteRoutes);
router.use('/habits', habitRoutes);
router.use('/pomodoro', pomodoroRoutes);
router.use('/progress', progressRoutes);

export default router;
