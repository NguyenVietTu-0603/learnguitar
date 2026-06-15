import express from 'express';
import {
  createQuiz,
  createQuizQuestion,
  startQuiz,
  submitQuiz,
  getMyAttempts,
  getLeaderboard,
} from '../controllers/quiz.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/', protect, authorize('admin', 'teacher'), createQuiz);
router.post('/:quizId/questions', protect, authorize('admin', 'teacher'), createQuizQuestion);
router.post('/:quizId/start', protect, startQuiz);
router.post('/:quizId/submit', protect, submitQuiz);
router.get('/:quizId/attempts/me', protect, getMyAttempts);
router.get('/:quizId/leaderboard', protect, getLeaderboard);

export default router;
