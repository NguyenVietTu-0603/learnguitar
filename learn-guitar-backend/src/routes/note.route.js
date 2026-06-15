import express from 'express';
import {
  getNotes,
  getRandomNotes,
  getNoteFretboardById,
  getNoteByFretPosition,
  createNote,
} from '../controllers/note.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getNotes);
router.get('/random', getRandomNotes);
router.get('/fretboard/position', getNoteByFretPosition);
router.get('/:noteId/fretboard', getNoteFretboardById);
router.post('/', protect, authorize('admin', 'teacher'), createNote);

export default router;
