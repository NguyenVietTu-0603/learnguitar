import { successResponse } from '../utils/apiResponse.js';
import quizService from '../services/quiz.service.js';
import {
  createQuizBodySchema,
  createQuizQuestionBodySchema,
  startQuizBodySchema,
  submitQuizBodySchema,
  leaderboardQuerySchema,
} from '../validators/module.validator.js';

export const createQuiz = async (req, res, next) => {
  try {
    const payload = createQuizBodySchema.parse(req.body || {});
    const result = await quizService.createQuiz(payload);

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo quiz thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createQuizQuestion = async (req, res, next) => {
  try {
    const payload = createQuizQuestionBodySchema.parse(req.body || {});
    const result = await quizService.createQuizQuestion({
      quizId: req.params.quizId,
      payload,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo câu hỏi quiz thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const startQuiz = async (req, res, next) => {
  try {
    const payload = startQuizBodySchema.parse(req.body || {});
    const result = await quizService.startQuiz({
      quizId: req.params.quizId,
      mode: payload.mode,
      user: req.user,
    });

    return successResponse(res, {
      statusCode: 201,
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const submitQuiz = async (req, res, next) => {
  try {
    const payload = submitQuizBodySchema.parse(req.body || {});
    const result = await quizService.submitQuiz({
      quizId: req.params.quizId,
      payload,
      user: req.user,
    });

    return successResponse(res, {
      data: result,
      message: 'Nộp bài quiz thành công.',
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyAttempts = async (req, res, next) => {
  try {
    const result = await quizService.getMyAttempts({
      quizId: req.params.quizId,
      userId: String(req.user.id),
      page: Number(req.query.page || 1),
      limit: Number(req.query.limit || 10),
    });

    return successResponse(res, {
      data: result.items,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    return next(error);
  }
};

export const getLeaderboard = async (req, res, next) => {
  try {
    const query = leaderboardQuerySchema.parse(req.query);
    const result = await quizService.getLeaderboard({
      quizId: req.params.quizId,
      period: query.period,
      userId: String(req.user.id),
    });

    return successResponse(res, {
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
