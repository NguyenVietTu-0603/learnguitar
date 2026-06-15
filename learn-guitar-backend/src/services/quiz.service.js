import slugify from 'slugify';

import AppError from '../exceptions/AppError.js';
import Quiz from '../models/Quiz.model.js';
import QuizQuestion from '../models/QuizQuestion.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js';
import LearningHistory from '../models/LearningHistory.model.js';
import Note from '../models/Note.model.js';
import NoteFretPosition from '../models/NoteFretPosition.model.js';
import Chord from '../models/Chord.model.js';
import { signQuizQuestionToken, verifyQuizQuestionToken } from '../utils/quizToken.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

const normalizeName = (value = '') => value.trim().toUpperCase();

const isEnharmonicMatch = (question, selectedOption, noteById) => {
  if (!question.noteId) return false;
  const note = noteById.get(String(question.noteId));
  if (!note) return false;

  const selected = normalizeName(selectedOption);
  const accepted = [note.canonicalName, ...(note.enharmonicNames || [])].map(normalizeName);
  return accepted.includes(selected);
};

const parseCorrectPositions = (question, positionsByNoteId) => {
  const answer = question.correctAnswer || {};
  if (Array.isArray(answer.positions) && answer.positions.length > 0) {
    return answer.positions;
  }

  if (!question.noteId) return [];
  return positionsByNoteId.get(String(question.noteId)) || [];
};

const calculateQuestionScore = ({ isCorrect, isPartial, difficultyWeight, responseTimeMs, streak }) => {
  const safeWeight = Number.isFinite(difficultyWeight) ? Math.max(0.5, difficultyWeight) : 1;
  const accuracy = isCorrect ? 100 : isPartial ? 70 : 0;
  const speedBonus = responseTimeMs && responseTimeMs > 0 ? Math.max(0, Math.min(15, ((6000 - responseTimeMs) / 6000) * 15)) : 0;
  const streakBonus = Math.min(10, Math.max(0, streak) * 2);

  return ((accuracy + speedBonus + streakBonus) * safeWeight) / 100;
};

const pickQuestions = (allQuestions, count = 10) => {
  const shuffled = [...allQuestions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
};

export const createQuiz = async (payload) => {
  const created = await Quiz.create({
    slug: slugify(payload.slug, { lower: true, strict: true }),
    title: payload.title,
    quizType: payload.quizType,
    level: payload.level,
    courseId: payload.courseId || null,
    lessonId: payload.lessonId || null,
    config: payload.config || {},
    isPublished: payload.isPublished ?? false,
  });

  return mapMongoDoc(created);
};

const buildChordQuestionPayload = async (payload) => {
  const chord = await Chord.findOne({ slug: String(payload.chordSlug || '').trim().toLowerCase() });
  if (!chord) {
    throw new AppError('Không tìm thấy hợp âm để tạo câu hỏi quiz.', 404);
  }

  const chordName = String(payload.correctAnswer?.chordName || chord.displayName || chord.name || '').trim();
  if (!chordName) {
    throw new AppError('Thiếu đáp án đúng chordName cho câu hỏi hợp âm.', 400);
  }

  const aliases = Array.isArray(payload.correctAnswer?.aliases) ? payload.correctAnswer.aliases : chord.alias || [];

  return {
    questionType: 'chord_name_mc',
    prompt: payload.prompt,
    audioUrl: payload.audioUrl,
    chordSlug: chord.slug,
    noteId: null,
    options: payload.options,
    correctAnswer: {
      chordName,
      aliases,
    },
    difficultyWeight: payload.difficultyWeight ?? 1,
  };
};

const buildQuestionPayload = async (payload) => {
  if (payload.questionType === 'chord_name_mc') {
    return buildChordQuestionPayload(payload);
  }

  return {
    questionType: payload.questionType,
    prompt: payload.prompt,
    audioUrl: payload.audioUrl,
    noteId: payload.noteId || null,
    chordSlug: payload.chordSlug || null,
    options: payload.options || null,
    correctAnswer: payload.correctAnswer || {},
    difficultyWeight: payload.difficultyWeight ?? 1,
  };
};

export const createQuizQuestion = async ({ quizId, payload }) => {
  const quiz = await Quiz.findById(quizId);
  if (!quiz) {
    throw new AppError('Không tìm thấy quiz để thêm câu hỏi.', 404);
  }

  const questionData = await buildQuestionPayload(payload);
  const created = await QuizQuestion.create({
    quizId: quiz._id,
    ...questionData,
  });

  return mapMongoDoc(created);
};

export const startQuiz = async ({ quizId, mode, user }) => {
  const quiz = await Quiz.findOne({ _id: quizId, isPublished: true });
  if (!quiz) {
    throw new AppError('Quiz không tồn tại hoặc chưa phát hành.', 404);
  }

  const allQuestions = await QuizQuestion.find({ quizId: quiz._id });
  if (!allQuestions.length) {
    throw new AppError('Quiz chưa có câu hỏi.', 400);
  }

  const questionCount = Number(quiz.config?.questionCount || (mode === 'exam' ? 12 : 8));
  const selectedQuestions = pickQuestions(allQuestions, questionCount);
  const mappedSelectedQuestions = mapMongoDoc(selectedQuestions);

  const chordSlugs = [...new Set(mappedSelectedQuestions.map((item) => item.chordSlug).filter(Boolean))];
  const chordRows = chordSlugs.length ? await Chord.find({ slug: { $in: chordSlugs } }) : [];
  const chordBySlug = new Map(mapMongoDoc(chordRows).map((item) => [item.slug, item]));

  const attempt = await QuizAttempt.create({
    quizId: quiz._id,
    userId: user.id,
    totalQuestions: selectedQuestions.length,
    answers: {
      questionIds: selectedQuestions.map((item) => String(item._id)),
    },
  });

  return {
    attemptId: String(attempt._id),
    quiz: mapMongoDoc(quiz),
    questions: mappedSelectedQuestions.map((item) => {
      const chord = item.chordSlug ? chordBySlug.get(item.chordSlug) : null;
      const correctOption = String(item.correctAnswer?.chordName || chord?.displayName || '').trim();
      const aliases = Array.isArray(item.correctAnswer?.aliases) ? item.correctAnswer.aliases : [];

      return {
        questionId: item.id,
        questionType: item.questionType,
        prompt: item.prompt,
        audioUrl: item.audioUrl,
        options: item.options,
        questionToken: signQuizQuestionToken({ questionId: item.id, quizId: String(quiz._id) }),
        chordSnapshot: chord
          ? {
              slug: chord.slug,
              displayName: chord.displayName,
              positions: chord.positions,
              fingers: chord.fingers || [],
              diagramSvg: chord.diagramSvg || null,
              audioUrl: chord.audioUrl || null,
            }
          : null,
        answerKey:
          mode === 'practice' && item.questionType === 'chord_name_mc' && correctOption
            ? {
                correctOption,
                aliases,
              }
            : null,
      };
    }),
  };
};

const assignAttemptOwner = async (attempt, userId) => {
  if (!attempt.userId) {
    attempt.userId = userId;
    await attempt.save();
  }

  if (String(attempt.userId) !== String(userId)) {
    throw new AppError('Không tìm thấy lượt làm quiz hợp lệ.', 404);
  }
};

export const submitQuiz = async ({ quizId, payload, user }) => {
  if (payload.idempotencyKey) {
    const existed = await QuizAttempt.findOne({ idempotencyKey: payload.idempotencyKey });
    if (existed && String(existed.userId) === String(user.id)) {
      return mapMongoDoc(existed);
    }
  }

  const attempt = await QuizAttempt.findById(payload.attemptId);
  if (!attempt || String(attempt.quizId) !== String(quizId)) {
    throw new AppError('Không tìm thấy lượt làm quiz hợp lệ.', 404);
  }

  await assignAttemptOwner(attempt, user.id);

  if (attempt.status === 'submitted') {
    return mapMongoDoc(attempt);
  }

  const questionIds = payload.answers.map((item) => item.questionId);
  const questions = await QuizQuestion.find({ _id: { $in: questionIds }, quizId });
  const questionById = new Map(questions.map((q) => [String(q._id), q]));

  const noteIds = questions.map((q) => q.noteId).filter(Boolean).map(String);
  const [notes, notePositions] = await Promise.all([
    noteIds.length ? Note.find({ _id: { $in: noteIds } }) : [],
    noteIds.length ? NoteFretPosition.find({ noteId: { $in: noteIds } }) : [],
  ]);

  const noteById = new Map(notes.map((item) => [String(item._id), mapMongoDoc(item)]));
  const positionsByNoteId = new Map();
  mapMongoDoc(notePositions).forEach((item) => {
    const key = item.noteId;
    if (!positionsByNoteId.has(key)) positionsByNoteId.set(key, []);
    positionsByNoteId.get(key).push({ stringNumber: item.stringNumber, fret: item.fret });
  });

  let correctCount = 0;
  let streak = 0;
  let weightedScoreSum = 0;
  let totalWeight = 0;

  const answerDetails = payload.answers.map((answer) => {
    const question = questionById.get(answer.questionId);
    if (!question) {
      throw new AppError(`Câu hỏi ${answer.questionId} không hợp lệ.`, 400);
    }

    const tokenPayload = verifyQuizQuestionToken(answer.questionToken);
    if (String(tokenPayload.questionId) !== String(question._id) || String(tokenPayload.quizId) !== String(quizId)) {
      throw new AppError('Question token không hợp lệ.', 400);
    }

    const expected = question.correctAnswer || {};
    let isCorrect = false;
    let isPartial = false;

    if (question.questionType === 'note_name_mc') {
      const selected = normalizeName(answer.selectedOption || '');
      const note = noteById.get(String(question.noteId));
      const canonical = normalizeName(expected.noteName || note?.canonicalName || '');
      if (selected && canonical && selected === canonical) {
        isCorrect = true;
      } else if (selected && isEnharmonicMatch(question, selected, noteById)) {
        isPartial = true;
      }
    }

    if (question.questionType === 'chord_name_mc') {
      const selected = normalizeName(answer.selectedOption || '');
      const accepted = [expected.chordName, ...(expected.aliases || [])].filter(Boolean).map(normalizeName);
      isCorrect = selected.length > 0 && accepted.includes(selected);
    }

    if (question.questionType === 'fret_select') {
      const selectedPos = answer.selectedPosition;
      const allowedPositions = parseCorrectPositions(question, positionsByNoteId);
      isCorrect = Boolean(
        selectedPos &&
          allowedPositions.some(
            (item) => Number(item.stringNumber) === Number(selectedPos.stringNumber) && Number(item.fret) === Number(selectedPos.fret)
          )
      );
    }

    if (isCorrect) {
      correctCount += 1;
      streak += 1;
    } else {
      streak = 0;
    }

    const questionPoint = calculateQuestionScore({
      isCorrect,
      isPartial,
      difficultyWeight: question.difficultyWeight,
      responseTimeMs: answer.responseTimeMs,
      streak,
    });

    weightedScoreSum += questionPoint;
    totalWeight += 1;

    return {
      questionId: String(question._id),
      questionType: question.questionType,
      selectedOption: answer.selectedOption ?? null,
      selectedPosition: answer.selectedPosition ?? null,
      isCorrect,
      isPartial,
      responseTimeMs: answer.responseTimeMs ?? null,
      point: Number(questionPoint.toFixed(2)),
    };
  });

  const normalizedScore = totalWeight > 0 ? Number(((weightedScoreSum / totalWeight) * 100).toFixed(1)) : 0;
  const startedAt = attempt.startedAt || new Date();
  const finishedAt = new Date();
  const durationSec = Math.max(1, Math.floor((finishedAt.getTime() - new Date(startedAt).getTime()) / 1000));

  attempt.totalQuestions = answerDetails.length;
  attempt.correctCount = correctCount;
  attempt.score = normalizedScore;
  attempt.answers = answerDetails;
  attempt.status = 'submitted';
  attempt.finishedAt = finishedAt;
  attempt.durationSec = durationSec;
  if (payload.idempotencyKey) {
    attempt.idempotencyKey = payload.idempotencyKey;
  }
  await attempt.save();

  await LearningHistory.create({
    userId: user.id,
    eventType: 'quiz_submitted',
    quizId,
    metadata: {
      attemptId: String(attempt._id),
      score: attempt.score,
      correctCount,
    },
  });

  return {
    ...mapMongoDoc(attempt),
    breakdown: {
      accuracy: answerDetails.length ? Number(((correctCount / answerDetails.length) * 100).toFixed(1)) : 0,
      speedBonus: 0,
      streakBonus: 0,
    },
  };
};

export const getMyAttempts = async ({ quizId, userId, page = 1, limit = 10 }) => {
  const safePage = Number.isFinite(page) ? Number(page) : 1;
  const safeLimit = Number.isFinite(limit) ? Math.min(Number(limit), 50) : 10;
  const skip = (safePage - 1) * safeLimit;

  const where = { quizId, userId };
  const [total, items] = await Promise.all([
    QuizAttempt.countDocuments(where),
    QuizAttempt.find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit),
  ]);

  return {
    items: mapMongoDoc(items),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total,
      pages: Math.ceil(total / safeLimit) || 1,
    },
  };
};

const getPeriodDate = (period) => {
  const now = new Date();
  const from = new Date(now);
  if (period === 'daily') from.setDate(now.getDate() - 1);
  else if (period === 'weekly') from.setDate(now.getDate() - 7);
  else if (period === 'monthly') from.setMonth(now.getMonth() - 1);
  else return null;
  return from;
};

export const getLeaderboard = async ({ quizId, period, userId }) => {
  const fromDate = getPeriodDate(period);
  const where = {
    quizId,
    status: 'submitted',
    ...(fromDate ? { createdAt: { $gte: fromDate } } : {}),
  };

  const attempts = await QuizAttempt.find(where)
    .sort({ score: -1, durationSec: 1, createdAt: 1 })
    .limit(200)
    .populate('userId', 'name avatar');

  const bestByUser = new Map();
  attempts.forEach((item) => {
    const uid = String(item.userId?._id || item.userId);
    if (!bestByUser.has(uid)) bestByUser.set(uid, item);
  });

  const rows = [...bestByUser.values()];
  const items = rows.slice(0, 20).map((row, index) => ({
    rank: index + 1,
    user: {
      id: String(row.userId?._id || row.userId),
      name: row.userId?.name || 'Học viên',
      avatar: row.userId?.avatar || null,
    },
    bestScore: row.score,
    durationSec: row.durationSec,
  }));

  const myRankIndex = rows.findIndex((row) => String(row.userId?._id || row.userId) === String(userId));

  return {
    items,
    myRank: myRankIndex >= 0 ? myRankIndex + 1 : null,
  };
};

export default {
  createQuiz,
  createQuizQuestion,
  startQuiz,
  submitQuiz,
  getMyAttempts,
  getLeaderboard,
};
