import { successResponse } from '../utils/apiResponse.js';
import textquizService from '../services/textquiz.service.js';

export const getTextQuizzes = async (req, res, next) => {
  try {
    const result = await textquizService.getTextQuizzes({
      page: req.query.page,
      limit: req.query.limit,
      level: req.query.level,
      search: req.query.search,
    });

    return successResponse(res, {
      data: result.quizzes,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    return next(error);
  }
};

export const getTextQuizBySlug = async (req, res, next) => {
  try {
    const result = await textquizService.getTextQuizBySlug(req.params.slug);
    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};
