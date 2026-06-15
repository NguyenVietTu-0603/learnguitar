import AppError from '../exceptions/AppError.js';
import TextQuiz from '../models/TextQuiz.model.js';
import { toPagination } from '../utils/pagination.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

export const getTextQuizzes = async (query = {}) => {
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
    TextQuiz.countDocuments(where),
    TextQuiz.find(where)
      .select('-questions')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  return {
    quizzes: mapMongoDoc(items),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getTextQuizBySlug = async (slug) => {
  const quiz = await TextQuiz.findOne({ slug, isPublished: true });
  if (!quiz) {
    throw new AppError('Không tìm thấy quiz.', 404);
  }
  return mapMongoDoc(quiz);
};

export default { getTextQuizzes, getTextQuizBySlug };
