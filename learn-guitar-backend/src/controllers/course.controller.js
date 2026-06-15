import { successResponse } from '../utils/apiResponse.js';
import courseService from '../services/course.service.js';
import {
  listCourseQuerySchema,
  listLessonQuerySchema,
  createCourseBodySchema,
  createModuleBodySchema,
  createLessonBodySchema,
} from '../validators/module.validator.js';

export const getCourses = async (req, res, next) => {
  try {
    const query = listCourseQuerySchema.parse(req.query);
    const result = await courseService.getCourses(query);

    return successResponse(res, {
      data: result.courses,
      meta: { pagination: result.pagination },
    });
  } catch (error) {
    return next(error);
  }
};

export const getCourseDetail = async (req, res, next) => {
  try {
    const result = await courseService.getCourseDetailBySlug(req.params.slug);
    return successResponse(res, { data: result });
  } catch (error) {
    return next(error);
  }
};

export const getCourseLessonsByLevel = async (req, res, next) => {
  try {
    const query = listLessonQuerySchema.parse(req.query);
    const result = await courseService.getCourseLessonsByLevel(req.params.slug, query.level);

    return successResponse(res, {
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createCourse = async (req, res, next) => {
  try {
    const payload = createCourseBodySchema.parse(req.body || {});
    const result = await courseService.createCourse(payload);
    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo khóa học thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createCourseModule = async (req, res, next) => {
  try {
    const payload = createModuleBodySchema.parse(req.body || {});
    const result = await courseService.createCourseModule({
      courseId: req.params.courseId,
      payload,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo module thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createLesson = async (req, res, next) => {
  try {
    const payload = createLessonBodySchema.parse(req.body || {});
    const result = await courseService.createLesson({
      courseId: req.params.courseId,
      moduleId: req.params.moduleId,
      payload,
    });

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo bài học thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
