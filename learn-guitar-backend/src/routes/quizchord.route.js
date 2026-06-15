import express from 'express';
import { generateQuizChord, checkQuizChordAnswer } from '../controllers/quizChord.Controller.js';

const router = express.Router();

// GET /api/quiz-chord/generate?category=major&difficulty=beginner
router.get('/generate', generateQuizChord);

// POST /api/quiz-chord/check-answer
// body: { questionId, selectedId }
router.post('/check-answer', checkQuizChordAnswer);

export default router;