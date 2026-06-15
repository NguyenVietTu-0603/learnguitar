import slugify from 'slugify';

import AppError from '../exceptions/AppError.js';
import TheoryLesson from '../models/TheoryLesson.model.js';
import { toPagination } from '../utils/pagination.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

export const getTheoryLessons = async (query) => {
  const { page, limit, skip } = toPagination(query);

  const where = {
    isPublished: true,
    ...(query.topic ? { topic: query.topic } : {}),
    ...(query.level ? { level: query.level } : {}),
  };

  const [total, items] = await Promise.all([
    TheoryLesson.countDocuments(where),
    TheoryLesson.find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    items: mapMongoDoc(items),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getTheoryLessonBySlug = async (slug) => {
  const item = await TheoryLesson.findOne({ slug, isPublished: true });
  if (!item) {
    throw new AppError('Không tìm thấy bài học nhạc lý.', 404);
  }

  return mapMongoDoc(item);
};

export const createTheoryLesson = async (payload) => {
  const created = await TheoryLesson.create({
    slug: slugify(payload.slug, { lower: true, strict: true }),
    title: payload.title,
    topic: payload.topic,
    level: payload.level,
    contentRichText: payload.contentRichText,
    coverImageUrl: payload.coverImageUrl,
    embeddedVideoUrl: payload.embeddedVideoUrl,
    tags: payload.tags || [],
    isPublished: payload.isPublished ?? false,
  });

  return mapMongoDoc(created);
};

export default {
  getTheoryLessons,
  getTheoryLessonBySlug,
  createTheoryLesson,
};
