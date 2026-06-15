import express from 'express';
import { getNoteByFretPosition } from '../controllers/note.controller.js';

const router = express.Router();

router.get('/position', getNoteByFretPosition);

export default router;
