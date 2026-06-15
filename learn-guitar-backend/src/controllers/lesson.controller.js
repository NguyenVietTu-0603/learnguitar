import { successResponse } from '../utils/apiResponse.js';
import lessonService from '../services/lesson.service.js';

export const getLessons = async (req, res, next) => {
  try {
    const result = await lessonService.getLessons({
      page: req.query.page,
      limit: req.query.limit,
      lessonType: req.query.lessonType,
      level: req.query.level,
      search: req.query.search,
    });

    return successResponse(res, {
      data: result.lessons,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    return next(error);
  }
};

export const getLessonBySlug = async (req, res, next) => {
  try {
    const result = await lessonService.getLessonBySlug(req.params.slug);
    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};
