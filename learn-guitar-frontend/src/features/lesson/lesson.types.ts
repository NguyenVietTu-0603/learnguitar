import type { CourseLevel, LessonType, PaginationMeta } from '../course/course.types';
export type { CourseLevel, LessonType, PaginationMeta };

export interface VideoLesson {
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
  order?: number;
}

export interface LessonListQuery {
  page?: number;
  limit?: number;
  lessonType?: LessonType | '';
  level?: CourseLevel | '';
  search?: string;
}

export interface LessonListResponse {
  success: boolean;
  data: VideoLesson[];
  meta?: { pagination?: PaginationMeta };
}

export interface LessonDetailResponse {
  success: boolean;
  data: VideoLesson;
}
