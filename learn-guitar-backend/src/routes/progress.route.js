import express from 'express';
import {
  updateLessonProgress,
  getMyDashboard,
  getMyProgress,
  getMyLearningHistory,
  getMyBadges,
  enrollInCourse,
  getMyCourses,
  getContinueLearning,
} from '../controllers/progress.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/dashboard/me', protect, getMyDashboard);
router.get('/me', protect, getMyProgress);
router.get('/courses/me', protect, getMyCourses);
router.get('/continue-learning/me', protect, getContinueLearning);
router.get('/history/me', protect, getMyLearningHistory);
router.get('/badges/me', protect, getMyBadges);
router.post('/courses/enroll', protect, enrollInCourse);
router.patch('/lessons/:lessonId', protect, updateLessonProgress);

export default router;
