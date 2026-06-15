import express from 'express';
import { getTextQuizzes, getTextQuizBySlug } from '../controllers/textquiz.controller.js';

const router = express.Router();

router.get('/', getTextQuizzes);
router.get('/:slug', getTextQuizBySlug);

export default router;
