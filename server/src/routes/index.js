import { Router } from 'express';
import authRoutes         from './auth.routes.js';
import expenseRoutes      from './expense.routes.js';
import budgetRoutes       from './budget.routes.js';
import goalRoutes         from './goal.routes.js';
import placementRoutes    from './placement.routes.js';
import noteRoutes         from './note.routes.js';
import habitRoutes        from './habit.routes.js';
import pomodoroRoutes     from './pomodoro.routes.js';
import progressRoutes     from './progress.routes.js';
// ── New: Todo & Productivity module ──
import taskRoutes         from './task.routes.js';
import eventRoutes        from './event.routes.js';
import sleepRoutes        from './sleep.routes.js';
import notificationRoutes from './notification.routes.js';
import reviewRoutes       from './review.routes.js';
import internshipRoutes   from './internship.routes.js';
import todoDashboardRoutes from './todoDashboard.routes.js';

const router = Router();

router.use('/auth',          authRoutes);
router.use('/expenses',      expenseRoutes);
router.use('/budgets',       budgetRoutes);
router.use('/goals',         goalRoutes);
router.use('/placement',     placementRoutes);
router.use('/notes',         noteRoutes);
router.use('/habits',        habitRoutes);
router.use('/pomodoro',      pomodoroRoutes);
router.use('/progress',      progressRoutes);
// ── New routes ──
router.use('/tasks',         taskRoutes);
router.use('/events',        eventRoutes);
router.use('/sleep',         sleepRoutes);
router.use('/notifications', notificationRoutes);
router.use('/review',        reviewRoutes);
router.use('/internship',    internshipRoutes);
router.use('/dashboard',     todoDashboardRoutes);

export default router;
