export type ProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type HistoryEventType =
  | 'lesson_viewed'
  | 'lesson_completed'
  | 'quiz_submitted'
  | 'streak_updated'
  | 'badge_unlocked';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface DashboardSummary {
  totalLearningMinutes: number;
  currentStreakDays: number;
  completedLessons: number;
  overallProgressPercent: number;
}

export interface ProgressByLevel {
  beginner: number;
  intermediate: number;
  advanced: number;
}

export interface BadgeItem {
  code: string;
  name: string;
  description?: string;
  iconUrl?: string | null;
  unlockedAt: string;
}

export interface HistoryItem {
  id: string;
  eventType: HistoryEventType;
  eventAt: string;
  metadata?: Record<string, unknown>;
}

export interface DashboardData {
  summary: DashboardSummary;
  progressByLevel: ProgressByLevel;
  recentBadges: BadgeItem[];
  recentHistory: HistoryItem[];
}

export interface CourseProgressRow {
  courseId: string;
  title?: string;
  percent: number;
  status: ProgressStatus;
}

export interface ModuleProgressRow {
  moduleId: string;
  title?: string;
  percent: number;
  status: ProgressStatus;
}

export interface LessonProgressRow {
  lessonId: string;
  title?: string;
  slug?: string;
  percent: number;
  status: ProgressStatus;
  updatedAt?: string;
}

export interface MyProgressData {
  courseProgress: CourseProgressRow[];
  moduleProgress: ModuleProgressRow[];
  lessonProgress: LessonProgressRow[];
}

export interface LessonProgressPayload {
  watchedSec?: number;
  markCompleted?: boolean;
  quizBestScore?: number;
  accumulatedSec?: number;
}

export interface LessonProgressResult {
  lessonProgress: number;
  moduleProgress: number;
  courseProgress: number;
  currentStreakDays: number;
  unlockedBadges: Array<{ code: string; name: string }>;
}

export interface ContinueLearningCourseRef {
  id: string;
  slug: string;
  title: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  thumbnailUrl?: string | null;
}

export interface ContinueLearningItem {
  course: ContinueLearningCourseRef;
  progressPercent: number;
  lesson: {
    id: string;
    slug: string;
    title: string;
    lessonType: 'video' | 'theory' | 'quiz';
    durationSec?: number;
    percent: number;
  };
  lastAccessAt: string;
}

export interface HistoryQuery {
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
  eventType?: HistoryEventType | '';
}

export interface DataResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
  };
}
