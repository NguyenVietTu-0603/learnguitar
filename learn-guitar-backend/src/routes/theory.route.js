import express from 'express';
import {
  getTheoryLessons,
  getTheoryLessonDetail,
  createTheoryLesson,
} from '../controllers/theory.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getTheoryLessons);
router.get('/:slug', getTheoryLessonDetail);
router.post('/', protect, authorize('admin', 'teacher'), createTheoryLesson);

export default router;
