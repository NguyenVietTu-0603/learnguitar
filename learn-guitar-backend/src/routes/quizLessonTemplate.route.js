import express from 'express';
import {
  listQuizLessonTemplates,
  getQuizLessonTemplateDetail,
  createQuizLessonTemplate,
  createChordGuessQuizzesForTemplate,
} from '../controllers/quizLessonTemplate.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', listQuizLessonTemplates);
router.get('/:templateId', getQuizLessonTemplateDetail);
router.post('/', protect, authorize('admin', 'teacher'), createQuizLessonTemplate);
router.post('/:templateId/chord-quizzes', protect, authorize('admin', 'teacher'), createChordGuessQuizzesForTemplate);

export default router;
