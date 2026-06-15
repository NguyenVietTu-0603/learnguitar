import { successResponse } from '../utils/apiResponse.js';
import progressService from '../services/progress.service.js';
import {
  lessonProgressBodySchema,
  historyQuerySchema,
  enrollCourseBodySchema,
  myCoursesQuerySchema,
  continueLearningQuerySchema,
} from '../validators/module.validator.js';

export const updateLessonProgress = async (req, res, next) => {
  try {
    const payload = lessonProgressBodySchema.parse(req.body || {});
    const result = await progressService.updateLessonProgress({
      lessonId: req.params.lessonId,
      payload,
      user: req.user,
    });

    return successResponse(res, {
      data: result,
      message: 'Cập nhật tiến độ bài học thành công.',
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyDashboard = async (req, res, next) => {
  try {
    const result = await progressService.getDashboard(req.user);
    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};

export const getMyProgress = async (req, res, next) => {
  try {
    const result = await progressService.getProgressByCourse({
      user: req.user,
      courseId: req.query.courseId,
    });

    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};

export const getMyLearningHistory = async (req, res, next) => {
  try {
    const query = historyQuerySchema.parse(req.query || {});
    const result = await progressService.getLearningHistory({
      user: req.user,
      query,
    });

    return successResponse(res, {
      data: result.items,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyBadges = async (req, res, next) => {
  try {
    const result = await progressService.getMyBadges(req.user);
    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};

export const enrollInCourse = async (req, res, next) => {
  try {
    const payload = enrollCourseBodySchema.parse(req.body || {});
    const result = await progressService.enrollCourse({
      user: req.user,
      courseId: payload.courseId,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Đăng ký khóa học thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getMyCourses = async (req, res, next) => {
  try {
    const query = myCoursesQuerySchema.parse(req.query || {});
    const result = await progressService.getMyCourses({ user: req.user, query });
    return successResponse(res, {
      data: result.items,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    return next(error);
  }
};

export const getContinueLearning = async (req, res, next) => {
  try {
    const query = continueLearningQuerySchema.parse(req.query || {});
    const result = await progressService.getContinueLearning({ user: req.user, query });
    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};
