import AppError from '../exceptions/AppError.js';
import Lesson from '../models/Lesson.model.js';
import { toPagination } from '../utils/pagination.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

export const getLessons = async (query = {}) => {
  const { page, limit, skip } = toPagination(query);

  const where = { isPublished: true };
  if (query.lessonType) where.lessonType = query.lessonType;
  if (query.level) where.level = query.level;
  if (query.search) {
    where.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { summary: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [total, items] = await Promise.all([
    Lesson.countDocuments(where),
    Lesson.find(where).sort({ order: 1, createdAt: 1 }).skip(skip).limit(limit),
  ]);

  return {
    lessons: mapMongoDoc(items),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getLessonBySlug = async (slug) => {
  const lesson = await Lesson.findOne({ slug, isPublished: true });
  if (!lesson) {
    throw new AppError('Không tìm thấy bài học.', 404);
  }
  return mapMongoDoc(lesson);
};

export default { getLessons, getLessonBySlug };
