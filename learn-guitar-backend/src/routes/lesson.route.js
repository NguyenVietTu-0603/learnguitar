import express from 'express';
import { getLessons, getLessonBySlug } from '../controllers/lesson.controller.js';

const router = express.Router();

router.get('/', getLessons);
router.get('/:slug', getLessonBySlug);

export default router;
