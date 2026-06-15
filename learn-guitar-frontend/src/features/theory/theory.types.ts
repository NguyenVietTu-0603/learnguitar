import type { CourseLevel } from '../course/course.types';

export type TheoryTopic = 'scale' | 'interval' | 'rhythm' | 'key';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface TheoryLessonItem {
  id: string;
  slug: string;
  title: string;
  topic: TheoryTopic;
  level: CourseLevel;
  tags: string[];
  coverImageUrl?: string | null;
  embeddedVideoUrl?: string | null;
  contentRichText?: string;
}

export interface TheoryQuery {
  topic?: TheoryTopic | '';
  level?: CourseLevel | '';
  page?: number;
  limit?: number;
}

export interface TheoryCreatePayload {
  slug: string;
  title: string;
  topic: TheoryTopic;
  level: CourseLevel;
  contentRichText: string;
  coverImageUrl?: string;
  embeddedVideoUrl?: string;
  tags?: string[];
  isPublished?: boolean;
}

export interface DataResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
  };
}
