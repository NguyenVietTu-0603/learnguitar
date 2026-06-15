export type CourseLevel = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'video' | 'theory' | 'quiz';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  level: CourseLevel;
  thumbnailUrl?: string | null;
  isPublished?: boolean;
}

export interface CourseEnrollmentResult {
  course: CourseListItem;
  status: 'enrolled' | 'completed' | 'paused';
  enrolledAt: string;
  lastAccessAt: string;
}

export interface MyCourseSummary {
  totalModules: number;
  totalLessons: number;
  completedLessons: number;
  progressPercent: number;
}

export interface MyCourseLessonRef {
  id: string;
  slug: string;
  title: string;
  lessonType: LessonType;
  durationSec?: number;
  percent?: number;
}

export interface MyCourseItem {
  id: string;
  status: 'enrolled' | 'completed' | 'paused';
  enrolledAt: string;
  lastAccessAt: string;
  completedAt?: string | null;
  course: CourseListItem;
  summary: MyCourseSummary;
  resumeLesson: MyCourseLessonRef | null;
  nextLesson: MyCourseLessonRef | null;
}

export interface LessonItem {
  id: string;
  courseId: string;
  moduleId: string;
  slug: string;
  title: string;
  summary?: string;
  lessonType: LessonType;
  level: CourseLevel;
  videoUrlHls?: string | null;
  videoThumbnailUrl?: string | null;
  durationSec?: number;
  tags?: string[];
  isPublished?: boolean;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  lessons: LessonItem[];
}

export interface CourseDetail extends CourseListItem {
  modules: CourseModule[];
}

export interface CourseLessonsByLevel {
  course: CourseListItem;
  level: CourseLevel | null;
  lessons: LessonItem[];
}

export interface CourseQuery {
  page?: number;
  limit?: number;
  level?: CourseLevel | '';
  search?: string;
}

export interface CoursePayload {
  slug: string;
  title: string;
  description?: string;
  level: CourseLevel;
  thumbnailUrl?: string;
  isPublished?: boolean;
  order?: number;
}

export interface CourseModulePayload {
  title: string;
  description?: string;
  order?: number;
}

export interface CourseLessonPayload {
  slug: string;
  title: string;
  summary?: string;
  lessonType: LessonType;
  level: CourseLevel;
  videoUrlHls?: string;
  videoThumbnailUrl?: string;
  durationSec?: number;
  tags?: string[];
  quizLessonTemplateId?: string;
  isPublished?: boolean;
  order?: number;
}

export interface CourseListResponse {
  success: boolean;
  data: CourseListItem[];
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface CourseDetailResponse {
  success: boolean;
  data: CourseDetail;
}

export interface CourseLessonsResponse {
  success: boolean;
  data: CourseLessonsByLevel;
}

export interface CreateDataResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CourseEnrollmentResponse {
  success: boolean;
  message?: string;
  data: CourseEnrollmentResult;
}

export interface MyCourseListResponse {
  success: boolean;
  data: MyCourseItem[];
  meta?: {
    pagination?: PaginationMeta;
  };
}
