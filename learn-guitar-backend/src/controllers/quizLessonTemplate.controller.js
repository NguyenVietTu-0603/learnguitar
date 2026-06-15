import { successResponse } from '../utils/apiResponse.js';
import quizLessonTemplateService from '../services/quizLessonTemplate.service.js';
import {
  listQuizLessonTemplateQuerySchema,
  createQuizLessonTemplateBodySchema,
  createChordGuessQuizBatchBodySchema,
} from '../validators/module.validator.js';

export const listQuizLessonTemplates = async (req, res, next) => {
  try {
    const query = listQuizLessonTemplateQuerySchema.parse(req.query || {});
    const result = await quizLessonTemplateService.getTemplates(query);

    return successResponse(res, {
      data: result.items,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    return next(error);
  }
};

export const getQuizLessonTemplateDetail = async (req, res, next) => {
  try {
    const result = await quizLessonTemplateService.getTemplateById(req.params.templateId);
    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};

export const createQuizLessonTemplate = async (req, res, next) => {
  try {
    const payload = createQuizLessonTemplateBodySchema.parse(req.body || {});
    const result = await quizLessonTemplateService.createTemplate({
      payload,
      userId: req.user?.id,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo bài học quiz mẫu thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createChordGuessQuizzesForTemplate = async (req, res, next) => {
  try {
    const payload = createChordGuessQuizBatchBodySchema.parse(req.body || {});
    const result = await quizLessonTemplateService.createChordGuessQuizzes({
      templateId: req.params.templateId,
      payload,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo các quiz đoán hợp âm thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
