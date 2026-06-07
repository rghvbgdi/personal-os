import { Router } from 'express';
import { createNote, getNotes, updateNote, deleteNote } from '../controllers/note.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = Router();
router.use(authenticate);

router.post('/', createNote);
router.get('/', getNotes);
router.patch('/:id', updateNote);
router.delete('/:id', deleteNote);

export default router;
