import redis from '../config/redis.js';
import AppError from '../exceptions/AppError.js';
import Course from '../models/Course.model.js';
import Lesson from '../models/Lesson.model.js';
import CourseModule from '../models/CourseModule.model.js';
import Progress from '../models/Progress.model.js';
import StudentCourse from '../models/StudentCourse.model.js';
import User from '../models/User.model.js';
import Badge from '../models/Badge.model.js';
import UserBadge from '../models/UserBadge.model.js';
import LearningHistory from '../models/LearningHistory.model.js';
import QuizAttempt from '../models/QuizAttempt.model.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

const dashboardKey = (userId) => `dashboard:me:${userId}`;
const progressKey = (userId, courseId) => `progress:course:${userId}:${courseId}`;
const myCoursesKey = (userId, status, page, limit) => `courses:me:${userId}:${status || 'all'}:${page}:${limit}`;
const continueLearningKey = (userId, limit) => `courses:continue:${userId}:${limit}`;

const completionStatus = (percent) => {
  if (percent >= 95) return 'completed';
  if (percent > 0) return 'in_progress';
  return 'not_started';
};

const recalcStreak = ({ lastLearningDate, currentStreakDays, now = new Date() }) => {
  if (!lastLearningDate) return 1;

  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfLast = new Date(lastLearningDate.getFullYear(), lastLearningDate.getMonth(), lastLearningDate.getDate());
  const diffDays = Math.floor((startOfToday.getTime() - startOfLast.getTime()) / (24 * 3600 * 1000));

  if (diffDays === 0) return currentStreakDays;
  if (diffDays === 1) return currentStreakDays + 1;
  return 1;
};

const upsertProgress = async ({ userId, entityType, entityId, courseId, moduleId = null, lessonId = null, data }) => {
  const update = {
    completionPercent: data.completionPercent,
    status: completionStatus(data.completionPercent),
    watchedSec: data.watchedSec ?? 0,
    quizBestScore: data.quizBestScore ?? 0,
    accumulatedSec: data.accumulatedSec ?? 0,
    lastAccessAt: new Date(),
    completedAt: data.completionPercent >= 95 ? new Date() : null,
    $inc: { version: 1 },
  };

  return Progress.findOneAndUpdate(
    { userId, entityType, entityId },
    {
      $set: update,
      $setOnInsert: {
        userId,
        entityType,
        entityId,
        courseId,
        moduleId,
        lessonId,
        version: 0,
      },
    },
    { upsert: true, new: true }
  );
};

const calcAveragePercent = (rows = []) => {
  if (!rows.length) return 0;
  const value = rows.reduce((sum, item) => sum + Number(item.completionPercent || 0), 0) / rows.length;
  return Number(value.toFixed(1));
};

const evaluateAndUnlockBadges = async (userId) => {
  const [badges, completedLessons, user, fretAttempts] = await Promise.all([
    Badge.find(),
    Progress.countDocuments({ userId, entityType: 'lesson', status: 'completed' }),
    User.findById(userId),
    QuizAttempt.find({ userId, status: 'submitted' }).sort({ createdAt: -1 }).limit(100),
  ]);

  const unlocked = [];

  for (const badge of badges) {
    const existed = await UserBadge.findOne({ userId, badgeId: badge._id });
    if (existed) continue;

    const config = badge.ruleConfig || {};
    let matched = false;

    if (badge.ruleType === 'streak') {
      const target = Number(config.days || 30);
      matched = Number(user?.currentStreakDays || 0) >= target;
    }

    if (badge.ruleType === 'lesson_count') {
      const target = Number(config.lessons || 50);
      matched = completedLessons >= target;
    }

    if (badge.ruleType === 'fretboard') {
      const targetScore = Number(config.score || 85);
      const minAttempts = Number(config.attempts || 5);
      const filtered = fretAttempts.filter((item) => item.score >= targetScore);
      matched = filtered.length >= minAttempts;
    }

    if (matched) {
      await UserBadge.create({ userId, badgeId: badge._id, source: 'system-rule' });
      await LearningHistory.create({
        userId,
        eventType: 'badge_unlocked',
        metadata: { badgeCode: badge.code },
      });
      unlocked.push({ code: badge.code, name: badge.name });
    }
  }

  return unlocked;
};

const clearUserCaches = async (userId, courseId) => {
  const keys = [dashboardKey(userId)];
  if (courseId) {
    keys.push(progressKey(userId, courseId));
  }

  const patterns = [`courses:me:${userId}:*`, `courses:continue:${userId}:*`];
  for (const pattern of patterns) {
    const matchedKeys = await redis.keys(pattern);
    if (matchedKeys.length > 0) {
      keys.push(...matchedKeys);
    }
  }

  if (keys.length > 0) {
    await redis.del(...new Set(keys));
  }
};

export const updateLessonProgress = async ({ lessonId, payload, user }) => {
  const lesson = await Lesson.findOne({ _id: lessonId, isPublished: true });
  if (!lesson) {
    throw new AppError('Không tìm thấy bài học.', 404);
  }

  await StudentCourse.findOneAndUpdate(
    { userId: user.id, courseId: lesson.courseId },
    {
      $set: {
        status: 'enrolled',
        lastAccessAt: new Date(),
      },
      $setOnInsert: {
        userId: user.id,
        courseId: lesson.courseId,
        enrolledAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  const watchedRatio = lesson.durationSec > 0 ? Math.min(1, payload.watchedSec / lesson.durationSec) : 0;
  const videoComponent = watchedRatio * 60;
  const quizComponent = Math.min(1, Number(payload.quizBestScore || 0) / 100) * 30;
  const practiceComponent = Math.min(1, Number(payload.accumulatedSec || 0) / Math.max(1, lesson.durationSec)) * 10;

  let lessonPercent = Number((videoComponent + quizComponent + practiceComponent).toFixed(1));
  if (payload.markCompleted) lessonPercent = 100;

  await upsertProgress({
    userId: user.id,
    entityType: 'lesson',
    entityId: lesson._id,
    courseId: lesson.courseId,
    moduleId: lesson.moduleId,
    lessonId: lesson._id,
    data: {
      completionPercent: lessonPercent,
      watchedSec: payload.watchedSec,
      quizBestScore: payload.quizBestScore,
      accumulatedSec: payload.accumulatedSec,
    },
  });

  await LearningHistory.create({
    userId: user.id,
    eventType: lessonPercent >= 95 ? 'lesson_completed' : 'lesson_viewed',
    courseId: lesson.courseId,
    moduleId: lesson.moduleId,
    lessonId: lesson._id,
    metadata: { completionPercent: lessonPercent, watchedSec: payload.watchedSec },
  });

  const moduleLessons = await Lesson.find({ moduleId: lesson.moduleId, isPublished: true }).select('_id');
  const moduleLessonIds = moduleLessons.map((item) => item._id);

  const moduleLessonProgress = await Progress.find({
    userId: user.id,
    entityType: 'lesson',
    entityId: { $in: moduleLessonIds },
  }).select('completionPercent');

  const modulePercent = calcAveragePercent(moduleLessonProgress);

  await upsertProgress({
    userId: user.id,
    entityType: 'module',
    entityId: lesson.moduleId,
    courseId: lesson.courseId,
    moduleId: lesson.moduleId,
    data: {
      completionPercent: modulePercent,
      accumulatedSec: payload.accumulatedSec,
    },
  });

  const courseModules = await CourseModule.find({ courseId: lesson.courseId }).select('_id');
  const moduleIds = courseModules.map((item) => item._id);

  const moduleProgresses = await Progress.find({
    userId: user.id,
    entityType: 'module',
    entityId: { $in: moduleIds },
  }).select('completionPercent');

  const coursePercent = calcAveragePercent(moduleProgresses);

  await upsertProgress({
    userId: user.id,
    entityType: 'course',
    entityId: lesson.courseId,
    courseId: lesson.courseId,
    data: {
      completionPercent: coursePercent,
      accumulatedSec: payload.accumulatedSec,
    },
  });

  await StudentCourse.findOneAndUpdate(
    { userId: user.id, courseId: lesson.courseId },
    {
      $set: {
        status: coursePercent >= 95 ? 'completed' : 'enrolled',
        lastAccessAt: new Date(),
        completedAt: coursePercent >= 95 ? new Date() : null,
      },
    },
    { new: true }
  );

  const currentUser = await User.findById(user.id);
  const nextStreak = recalcStreak({
    lastLearningDate: currentUser?.lastLearningDate,
    currentStreakDays: currentUser?.currentStreakDays || 0,
  });

  await User.updateOne(
    { _id: user.id },
    { $set: { currentStreakDays: nextStreak, lastLearningDate: new Date() } }
  );

  if (nextStreak !== (currentUser?.currentStreakDays || 0)) {
    await LearningHistory.create({
      userId: user.id,
      eventType: 'streak_updated',
      metadata: { streak: nextStreak },
    });
  }

  const unlockedBadges = await evaluateAndUnlockBadges(user.id);
  await clearUserCaches(String(user.id), String(lesson.courseId));

  return {
    lessonProgress: lessonPercent,
    moduleProgress: modulePercent,
    courseProgress: coursePercent,
    currentStreakDays: nextStreak,
    unlockedBadges,
  };
};

export const getDashboard = async (user) => {
  const key = dashboardKey(user.id);
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const [courseProgresses, completedLessons, recentBadges, histories, currentUser] = await Promise.all([
    Progress.find({ userId: user.id, entityType: 'course' }).populate('courseId', 'title level'),
    Progress.countDocuments({ userId: user.id, entityType: 'lesson', status: 'completed' }),
    UserBadge.find({ userId: user.id }).sort({ unlockedAt: -1 }).limit(6).populate('badgeId'),
    LearningHistory.find({ userId: user.id }).sort({ eventAt: -1 }).limit(30),
    User.findById(user.id),
  ]);

  const totalLearningSec = histories.reduce((sum, item) => sum + Number(item.metadata?.watchedSec || 0), 0);

  const byLevel = { beginner: [], intermediate: [], advanced: [] };
  courseProgresses.forEach((item) => {
    const lvl = item.courseId?.level;
    if (lvl && byLevel[lvl]) byLevel[lvl].push(Number(item.completionPercent || 0));
  });

  const avg = (arr) => (arr.length ? Number((arr.reduce((s, i) => s + i, 0) / arr.length).toFixed(1)) : 0);
  const levelProgress = {
    beginner: avg(byLevel.beginner),
    intermediate: avg(byLevel.intermediate),
    advanced: avg(byLevel.advanced),
  };

  const overallProgressPercent = Number(
    (levelProgress.beginner * 0.3 + levelProgress.intermediate * 0.4 + levelProgress.advanced * 0.3).toFixed(1)
  );

  const payload = {
    summary: {
      totalLearningMinutes: Math.floor(totalLearningSec / 60),
      currentStreakDays: currentUser?.currentStreakDays || 0,
      completedLessons,
      overallProgressPercent,
    },
    progressByLevel: levelProgress,
    recentBadges: mapMongoDoc(recentBadges).map((item) => ({
      ...(item.badgeId || {}),
      unlockedAt: item.unlockedAt,
    })),
    recentHistory: mapMongoDoc(histories).slice(0, 10),
  };

  await redis.set(key, JSON.stringify(payload), 'EX', 300);
  return payload;
};

export const getProgressByCourse = async ({ user, courseId }) => {
  const key = progressKey(user.id, courseId || 'all');
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const whereBase = {
    userId: user.id,
    ...(courseId ? { courseId } : {}),
  };

  const [courseRows, moduleRows, lessonRows] = await Promise.all([
    Progress.find({ ...whereBase, entityType: 'course' }).populate('courseId', 'title level'),
    Progress.find({ ...whereBase, entityType: 'module' }).populate('moduleId', 'title'),
    Progress.find({ ...whereBase, entityType: 'lesson' }).populate('lessonId', 'title slug').sort({ updatedAt: -1 }),
  ]);

  const payload = {
    courseProgress: mapMongoDoc(courseRows).map((item) => ({
      courseId: item.courseId?.id || item.courseId,
      title: item.courseId?.title,
      percent: item.completionPercent,
      status: item.status,
    })),
    moduleProgress: mapMongoDoc(moduleRows).map((item) => ({
      moduleId: item.moduleId?.id || item.moduleId,
      title: item.moduleId?.title,
      percent: item.completionPercent,
      status: item.status,
    })),
    lessonProgress: mapMongoDoc(lessonRows).map((item) => ({
      lessonId: item.lessonId?.id || item.lessonId,
      title: item.lessonId?.title,
      slug: item.lessonId?.slug,
      percent: item.completionPercent,
      status: item.status,
      updatedAt: item.updatedAt,
    })),
  };

  await redis.set(key, JSON.stringify(payload), 'EX', 180);
  return payload;
};

export const getLearningHistory = async ({ user, query }) => {
  const page = Number(query.page || 1);
  const limit = Math.min(Number(query.limit || 20), 50);
  const skip = (page - 1) * limit;

  const where = {
    userId: user.id,
    ...(query.eventType ? { eventType: query.eventType } : {}),
  };

  if (query.from || query.to) {
    where.eventAt = {};
    if (query.from) where.eventAt.$gte = new Date(query.from);
    if (query.to) where.eventAt.$lte = new Date(query.to);
  }

  const [total, items] = await Promise.all([
    LearningHistory.countDocuments(where),
    LearningHistory.find(where).sort({ eventAt: -1 }).skip(skip).limit(limit),
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

export const getMyBadges = async (user) => {
  const items = await UserBadge.find({ userId: user.id }).sort({ unlockedAt: -1 }).populate('badgeId');

  return mapMongoDoc(items).map((item) => ({
    code: item.badgeId?.code,
    name: item.badgeId?.name,
    description: item.badgeId?.description,
    iconUrl: item.badgeId?.iconUrl,
    unlockedAt: item.unlockedAt,
  }));
};

export const enrollCourse = async ({ user, courseId }) => {
  const course = await Course.findOne({ _id: courseId, isPublished: true });
  if (!course) {
    throw new AppError('Không tìm thấy khóa học công khai để đăng ký.', 404);
  }

  const record = await StudentCourse.findOneAndUpdate(
    { userId: user.id, courseId: course._id },
    {
      $set: {
        status: 'enrolled',
        lastAccessAt: new Date(),
      },
      $setOnInsert: {
        userId: user.id,
        courseId: course._id,
        enrolledAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );

  await clearUserCaches(String(user.id), String(course._id));

  return {
    course: {
      id: String(course._id),
      slug: course.slug,
      title: course.title,
      level: course.level,
      description: course.description,
      thumbnailUrl: course.thumbnailUrl,
    },
    status: record.status,
    enrolledAt: record.enrolledAt,
    lastAccessAt: record.lastAccessAt,
  };
};

export const getMyCourses = async ({ user, query }) => {
  const page = Number(query.page || 1);
  const limit = Math.min(Number(query.limit || 12), 50);
  const key = myCoursesKey(String(user.id), query.status, page, limit);
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const where = {
    userId: user.id,
    ...(query.status ? { status: query.status } : {}),
  };
  const skip = (page - 1) * limit;

  const [total, rows] = await Promise.all([
    StudentCourse.countDocuments(where),
    StudentCourse.find(where)
      .populate('courseId')
      .sort({ lastAccessAt: -1, enrolledAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const items = await Promise.all(
    rows.map(async (row) => {
      const course = row.courseId;
      if (!course) {
        return null;
      }

      const [modules, lessons, courseProgress] = await Promise.all([
        CourseModule.find({ courseId: course._id }).select('_id title').sort({ order: 1, createdAt: 1 }),
        Lesson.find({ courseId: course._id, isPublished: true }).select('_id slug title moduleId durationSec lessonType').sort({ order: 1, createdAt: 1 }),
        Progress.findOne({ userId: user.id, entityType: 'course', entityId: course._id }).select('completionPercent status updatedAt'),
      ]);

      const lessonIds = lessons.map((lesson) => lesson._id);
      const lessonProgressRows = lessonIds.length
        ? await Progress.find({ userId: user.id, entityType: 'lesson', entityId: { $in: lessonIds } })
            .select('lessonId completionPercent status lastAccessAt updatedAt')
            .sort({ updatedAt: -1 })
        : [];

      const lessonProgressMap = new Map(
        lessonProgressRows.map((item) => [String(item.lessonId), item])
      );

      const completedLessons = lessonProgressRows.filter((item) => Number(item.completionPercent || 0) >= 95).length;
      const nextLessonDoc = lessons.find((lesson) => {
        const progress = lessonProgressMap.get(String(lesson._id));
        return !progress || Number(progress.completionPercent || 0) < 95;
      });
      const lastLessonProgress = lessonProgressRows[0] || null;
      const lastLessonDoc = lastLessonProgress
        ? lessons.find((lesson) => String(lesson._id) === String(lastLessonProgress.lessonId)) || null
        : null;
      const resumeLessonDoc =
        (lastLessonDoc && Number(lastLessonProgress?.completionPercent || 0) > 0 && Number(lastLessonProgress?.completionPercent || 0) < 95
          ? lastLessonDoc
          : null) || nextLessonDoc || lessons[0] || null;
      const resumeLessonProgress = resumeLessonDoc
        ? lessonProgressMap.get(String(resumeLessonDoc._id)) || null
        : null;

      return {
        id: String(row._id),
        status: row.status,
        enrolledAt: row.enrolledAt,
        lastAccessAt: row.lastAccessAt,
        completedAt: row.completedAt,
        course: {
          id: String(course._id),
          slug: course.slug,
          title: course.title,
          description: course.description,
          level: course.level,
          thumbnailUrl: course.thumbnailUrl,
        },
        summary: {
          totalModules: modules.length,
          totalLessons: lessons.length,
          completedLessons,
          progressPercent: Number(courseProgress?.completionPercent || 0),
        },
        resumeLesson: resumeLessonDoc
          ? {
              id: String(resumeLessonDoc._id),
              slug: resumeLessonDoc.slug,
              title: resumeLessonDoc.title,
              lessonType: resumeLessonDoc.lessonType,
              durationSec: resumeLessonDoc.durationSec,
              percent: Number(resumeLessonProgress?.completionPercent || 0),
            }
          : null,
        nextLesson: nextLessonDoc
          ? {
              id: String(nextLessonDoc._id),
              slug: nextLessonDoc.slug,
              title: nextLessonDoc.title,
              lessonType: nextLessonDoc.lessonType,
              durationSec: nextLessonDoc.durationSec,
            }
          : null,
      };
    })
  );

  const payload = {
    items: items.filter(Boolean),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };

  await redis.set(key, JSON.stringify(payload), 'EX', 180);
  return payload;
};

export const getContinueLearning = async ({ user, query }) => {
  const limit = Math.min(Number(query.limit || 3), 12);
  const key = continueLearningKey(String(user.id), limit);
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);

  const rows = await StudentCourse.find({ userId: user.id, status: { $in: ['enrolled', 'paused'] } })
    .populate('courseId')
    .sort({ lastAccessAt: -1, enrolledAt: -1 })
    .limit(limit * 3);

  const items = [];

  for (const row of rows) {
    if (items.length >= limit) break;
    const course = row.courseId;
    if (!course) continue;

    const lessons = await Lesson.find({ courseId: course._id, isPublished: true })
      .select('_id slug title durationSec lessonType')
      .sort({ order: 1, createdAt: 1 });
    if (!lessons.length) continue;

    const lessonProgressRows = await Progress.find({
      userId: user.id,
      entityType: 'lesson',
      entityId: { $in: lessons.map((lesson) => lesson._id) },
    })
      .select('lessonId completionPercent updatedAt')
      .sort({ updatedAt: -1 });

    const progressMap = new Map(lessonProgressRows.map((item) => [String(item.lessonId), item]));
    const courseProgress = await Progress.findOne({ userId: user.id, entityType: 'course', entityId: course._id }).select('completionPercent');

    const nextLessonDoc = lessons.find((lesson) => Number(progressMap.get(String(lesson._id))?.completionPercent || 0) < 95) || lessons[0];
    const resumeProgress = progressMap.get(String(nextLessonDoc._id)) || null;

    items.push({
      course: {
        id: String(course._id),
        slug: course.slug,
        title: course.title,
        level: course.level,
        thumbnailUrl: course.thumbnailUrl,
      },
      progressPercent: Number(courseProgress?.completionPercent || 0),
      lesson: {
        id: String(nextLessonDoc._id),
        slug: nextLessonDoc.slug,
        title: nextLessonDoc.title,
        lessonType: nextLessonDoc.lessonType,
        durationSec: nextLessonDoc.durationSec,
        percent: Number(resumeProgress?.completionPercent || 0),
      },
      lastAccessAt: row.lastAccessAt,
    });
  }

  await redis.set(key, JSON.stringify(items), 'EX', 180);
  return items;
};

export default {
  updateLessonProgress,
  getDashboard,
  getProgressByCourse,
  getLearningHistory,
  getMyBadges,
  enrollCourse,
  getMyCourses,
  getContinueLearning,
};
