import express from 'express';
import {
  getCourses,
  getCourseDetail,
  getCourseLessonsByLevel,
  createCourse,
  createCourseModule,
  createLesson,
} from '../controllers/course.controller.js';
import { authorize, protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', getCourses);
router.get('/:slug', getCourseDetail);
router.get('/:slug/lessons', getCourseLessonsByLevel);
router.post('/', protect, authorize('admin', 'teacher'), createCourse);
router.post('/:courseId/modules', protect, authorize('admin', 'teacher'), createCourseModule);
router.post('/:courseId/modules/:moduleId/lessons', protect, authorize('admin', 'teacher'), createLesson);

export default router;
