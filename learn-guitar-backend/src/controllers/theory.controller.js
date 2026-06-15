import { successResponse } from '../utils/apiResponse.js';
import theoryService from '../services/theory.service.js';
import { theoryQuerySchema, createTheoryBodySchema } from '../validators/module.validator.js';

export const getTheoryLessons = async (req, res, next) => {
  try {
    const query = theoryQuerySchema.parse(req.query);
    const result = await theoryService.getTheoryLessons(query);

    return successResponse(res, {
      data: result.items,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getTheoryLessonDetail = async (req, res, next) => {
  try {
    const data = await theoryService.getTheoryLessonBySlug(req.params.slug);
    return successResponse(res, { data });
  } catch (error) {
    return next(error);
  }
};

export const createTheoryLesson = async (req, res, next) => {
  try {
    const payload = createTheoryBodySchema.parse(req.body || {});
    const result = await theoryService.createTheoryLesson(payload);

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo bài học nhạc lý thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
