import slugify from 'slugify';

import AppError from '../exceptions/AppError.js';
import QuizLessonTemplate from '../models/QuizLessonTemplate.model.js';
import Quiz from '../models/Quiz.model.js';
import QuizQuestion from '../models/QuizQuestion.model.js';
import Chord from '../models/Chord.model.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';
import { toPagination } from '../utils/pagination.js';

const shuffle = (items = []) => {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
};

const pickAudioUrl = (candidate, fallback) => {
  if (candidate && String(candidate).trim()) return String(candidate).trim();
  if (fallback && String(fallback).trim()) return String(fallback).trim();
  return '/static/audio/chords/default.mp3';
};

const normalizeSlug = (value) => slugify(value || '', { lower: true, strict: true });

const ensureUniqueSlugs = (correctSlug, wrongSlugs) => {
  const candidates = [correctSlug, ...wrongSlugs];
  const unique = new Set(candidates);
  if (unique.size !== 4) {
    throw new AppError('Mỗi quiz phải có 1 hợp âm đúng và 3 hợp âm sai không trùng nhau.', 400);
  }
};

export const createTemplate = async ({ payload, userId }) => {
  const created = await QuizLessonTemplate.create({
    slug: normalizeSlug(payload.slug),
    title: payload.title,
    summary: payload.summary,
    level: payload.level,
    lessonType: 'quiz_chord_guess',
    isPublished: payload.isPublished ?? true,
    createdBy: userId || null,
  });

  return mapMongoDoc(created);
};

export const getTemplates = async (query) => {
  const { page, limit, skip } = toPagination(query);
  const where = { lessonType: 'quiz_chord_guess', isPublished: true };
  if (query.level) where.level = query.level;
  if (query.search) {
    where.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { summary: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [total, items] = await Promise.all([
    QuizLessonTemplate.countDocuments(where),
    QuizLessonTemplate.find(where).sort({ createdAt: -1 }).skip(skip).limit(limit),
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

export const getTemplateById = async (templateId) => {
  const template = await QuizLessonTemplate.findOne({ _id: templateId, isPublished: true });
  if (!template) {
    throw new AppError('Không tìm thấy bài học quiz mẫu.', 404);
  }

  const quizzes = await Quiz.find({ lessonTemplateId: template._id }).sort({ createdAt: 1 });
  const quizIds = quizzes.map((item) => item._id);
  const questions = quizIds.length ? await QuizQuestion.find({ quizId: { $in: quizIds } }).sort({ createdAt: 1 }) : [];

  const questionByQuizId = new Map();
  mapMongoDoc(questions).forEach((question) => {
    if (!questionByQuizId.has(question.quizId)) questionByQuizId.set(question.quizId, []);
    questionByQuizId.get(question.quizId).push(question);
  });

  const mappedQuizzes = mapMongoDoc(quizzes).map((quiz) => ({
    ...quiz,
    questions: questionByQuizId.get(quiz.id) || [],
  }));

  return {
    ...mapMongoDoc(template),
    quizzes: mappedQuizzes,
  };
};

export const createChordGuessQuizzes = async ({ templateId, payload }) => {
  const template = await QuizLessonTemplate.findById(templateId);
  if (!template) {
    throw new AppError('Không tìm thấy bài học quiz mẫu để thêm quiz.', 404);
  }

  const normalizedRows = payload.quizzes.map((item, index) => ({
    index,
    title: String(item.title || `Quiz ${index + 1}`).trim(),
    prompt: item.prompt,
    level: item.level || template.level,
    correctChordSlug: normalizeSlug(item.correctChordSlug),
    wrongChordSlugs: item.wrongChordSlugs.map(normalizeSlug),
    audioUrl: item.audioUrl,
    difficultyWeight: item.difficultyWeight ?? 1,
  }));

  normalizedRows.forEach((row) => ensureUniqueSlugs(row.correctChordSlug, row.wrongChordSlugs));

  const allChordSlugs = [...new Set(normalizedRows.flatMap((row) => [row.correctChordSlug, ...row.wrongChordSlugs]))];
  const chords = await Chord.find({ slug: { $in: allChordSlugs } });
  const chordBySlug = new Map(chords.map((item) => [item.slug, item]));

  const missing = allChordSlugs.filter((slug) => !chordBySlug.has(slug));
  if (missing.length) {
    throw new AppError(`Không tìm thấy các hợp âm: ${missing.join(', ')}`, 404);
  }

  const createdQuizRows = [];

  for (const row of normalizedRows) {
    const slugBase = normalizeSlug(`${template.slug}-${row.title}`);
    const uniqueSlug = `${slugBase}-${Date.now()}-${row.index + 1}`;

    const quiz = await Quiz.create({
      slug: uniqueSlug,
      title: row.title,
      quizType: 'chord_identify',
      level: row.level,
      courseId: null,
      lessonId: null,
      lessonTemplateId: template._id,
      config: {
        questionCount: 1,
      },
      isPublished: true,
    });

    const correctChord = chordBySlug.get(row.correctChordSlug);
    const wrongChords = row.wrongChordSlugs.map((slug) => chordBySlug.get(slug));
    const options = shuffle([correctChord.displayName, ...wrongChords.map((item) => item.displayName)]);

    const question = await QuizQuestion.create({
      quizId: quiz._id,
      questionType: 'chord_name_mc',
      prompt: row.prompt,
      audioUrl: pickAudioUrl(row.audioUrl, correctChord.audioUrl),
      chordSlug: correctChord.slug,
      noteId: null,
      options,
      correctAnswer: {
        chordName: correctChord.displayName,
        aliases: correctChord.alias || [],
      },
      difficultyWeight: row.difficultyWeight,
    });

    createdQuizRows.push({
      quiz: mapMongoDoc(quiz),
      question: mapMongoDoc(question),
    });
  }

  await QuizLessonTemplate.updateOne(
    { _id: template._id },
    {
      $set: {
        quizCount: await Quiz.countDocuments({ lessonTemplateId: template._id }),
      },
    }
  );

  return {
    template: mapMongoDoc(template),
    createdCount: createdQuizRows.length,
    items: createdQuizRows,
  };
};

export default {
  createTemplate,
  getTemplates,
  getTemplateById,
  createChordGuessQuizzes,
};
