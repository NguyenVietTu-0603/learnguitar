import slugify from 'slugify';

import AppError from '../exceptions/AppError.js';
import Course from '../models/Course.model.js';
import CourseModule from '../models/CourseModule.model.js';
import Lesson from '../models/Lesson.model.js';
import Quiz from '../models/Quiz.model.js';
import QuizQuestion from '../models/QuizQuestion.model.js';
import QuizLessonTemplate from '../models/QuizLessonTemplate.model.js';
import { toPagination } from '../utils/pagination.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

const cloneTemplateQuizzesToLesson = async ({ templateId, lesson, courseId, level, isPublished }) => {
  const template = await QuizLessonTemplate.findById(templateId);
  if (!template) {
    throw new AppError('Không tìm thấy bài học quiz mẫu để gắn vào lesson.', 404);
  }

  const templateQuizzes = await Quiz.find({ lessonTemplateId: template._id }).sort({ createdAt: 1 });
  if (!templateQuizzes.length) {
    return { importedQuizCount: 0, importedQuestionCount: 0 };
  }

  const templateQuizIds = templateQuizzes.map((item) => item._id);
  const templateQuestions = await QuizQuestion.find({ quizId: { $in: templateQuizIds } }).sort({ createdAt: 1 });

  const quizIdMap = new Map();
  let importedQuestionCount = 0;

  for (let index = 0; index < templateQuizzes.length; index += 1) {
    const item = templateQuizzes[index];
    const cloned = await Quiz.create({
      slug: `${slugify(item.slug, { lower: true, strict: true })}-${String(lesson._id).slice(-6)}-${index + 1}`,
      title: item.title,
      quizType: item.quizType,
      level: level || item.level,
      courseId,
      lessonId: lesson._id,
      lessonTemplateId: template._id,
      config: item.config || {},
      isPublished: isPublished ?? item.isPublished,
    });
    quizIdMap.set(String(item._id), cloned._id);
  }

  const questionCreates = templateQuestions.map((item) => ({
    quizId: quizIdMap.get(String(item.quizId)),
    questionType: item.questionType,
    prompt: item.prompt,
    audioUrl: item.audioUrl,
    noteId: item.noteId,
    chordSlug: item.chordSlug,
    correctAnswer: item.correctAnswer,
    options: item.options,
    difficultyWeight: item.difficultyWeight,
  }));

  if (questionCreates.length) {
    await QuizQuestion.insertMany(questionCreates);
    importedQuestionCount = questionCreates.length;
  }

  return {
    importedQuizCount: templateQuizzes.length,
    importedQuestionCount,
  };
};

export const getCourses = async (query) => {
  const { page, limit, skip } = toPagination(query);

  const where = { isPublished: true };
  if (query.level) where.level = query.level;
  if (query.search) {
    where.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [total, items] = await Promise.all([
    Course.countDocuments(where),
    Course.find(where)
      .sort({ order: 1, createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    courses: mapMongoDoc(items),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getCourseDetailBySlug = async (slug) => {
  const course = await Course.findOne({ slug, isPublished: true });
  if (!course) {
    throw new AppError('Không tìm thấy khóa học.', 404);
  }

  const modules = await CourseModule.find({ courseId: course._id }).sort({ order: 1, createdAt: 1 });
  const moduleIds = modules.map((item) => item._id);
  const lessons = await Lesson.find({
    moduleId: { $in: moduleIds },
    isPublished: true,
  }).sort({ order: 1, createdAt: 1 });

  const mappedLessons = mapMongoDoc(lessons);
  const mappedModules = mapMongoDoc(modules).map((mod) => ({
    ...mod,
    lessons: mappedLessons.filter((lesson) => lesson.moduleId === mod.id),
  }));

  return {
    ...mapMongoDoc(course),
    modules: mappedModules,
  };
};

export const getCourseLessonsByLevel = async (slug, level) => {
  const course = await Course.findOne({ slug, isPublished: true });
  if (!course) {
    throw new AppError('Không tìm thấy khóa học.', 404);
  }

  const where = { courseId: course._id, isPublished: true };
  if (level) where.level = level;

  const lessons = await Lesson.find(where).sort({ order: 1, createdAt: 1 });

  return {
    course: mapMongoDoc(course),
    level: level || null,
    lessons: mapMongoDoc(lessons),
  };
};

export const createCourse = async (payload) => {
  const created = await Course.create({
    slug: slugify(payload.slug, { lower: true, strict: true }),
    title: payload.title,
    description: payload.description,
    level: payload.level,
    thumbnailUrl: payload.thumbnailUrl,
    isPublished: payload.isPublished ?? false,
    order: payload.order ?? 0,
  });

  return mapMongoDoc(created);
};

export const createCourseModule = async ({ courseId, payload }) => {
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Không tìm thấy khóa học để thêm module.', 404);
  }

  const created = await CourseModule.create({
    courseId,
    title: payload.title,
    description: payload.description,
    order: payload.order ?? 0,
  });

  return mapMongoDoc(created);
};

export const createLesson = async ({ courseId, moduleId, payload }) => {
  const [course, module] = await Promise.all([
    Course.findById(courseId),
    CourseModule.findById(moduleId),
  ]);

  if (!course) {
    throw new AppError('Không tìm thấy khóa học.', 404);
  }

  if (!module || String(module.courseId) !== String(course._id)) {
    throw new AppError('Module không thuộc khóa học đã chọn.', 400);
  }

  const created = await Lesson.create({
    courseId,
    moduleId,
    slug: slugify(payload.slug, { lower: true, strict: true }),
    title: payload.title,
    summary: payload.summary,
    lessonType: payload.lessonType,
    level: payload.level,
    videoUrlHls: payload.videoUrlHls,
    videoThumbnailUrl: payload.videoThumbnailUrl,
    durationSec: payload.durationSec,
    tags: payload.tags || [],
    isPublished: payload.isPublished ?? false,
    order: payload.order ?? 0,
  });

  if (payload.quizLessonTemplateId && payload.lessonType === 'quiz') {
    const result = await cloneTemplateQuizzesToLesson({
      templateId: payload.quizLessonTemplateId,
      lesson: created,
      courseId,
      level: payload.level,
      isPublished: payload.isPublished ?? false,
    });

    return {
      ...mapMongoDoc(created),
      importedQuizCount: result.importedQuizCount,
      importedQuestionCount: result.importedQuestionCount,
      quizLessonTemplateId: payload.quizLessonTemplateId,
    };
  }

  return mapMongoDoc(created);
};

export default {
  getCourses,
  getCourseDetailBySlug,
  getCourseLessonsByLevel,
  createCourse,
  createCourseModule,
  createLesson,
};
