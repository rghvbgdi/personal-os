import { Router } from 'express';
import { createHabit, getHabits, checkInHabit, updateHabit, deleteHabit } from '../controllers/habit.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/', createHabit);
router.get('/', getHabits);
router.patch('/:id', updateHabit);
router.post('/:id/checkin', checkInHabit);
router.delete('/:id', deleteHabit);

export default router;
