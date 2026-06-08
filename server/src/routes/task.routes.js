import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { createTask, getTasks, updateTask, deleteTask, toggleComplete, getTasksToday } from '../controllers/task.controller.js';

const router = Router();
router.use(authenticate);

router.post('/',              createTask);
router.get('/',               getTasks);
router.get('/today',          getTasksToday);
router.patch('/:id',          updateTask);
router.patch('/:id/complete', toggleComplete);
router.delete('/:id',         deleteTask);

export default router;
