import type { PaginationMeta } from '../course/course.types';
export type { PaginationMeta };

export type QuizLevel = 'beginner' | 'intermediate' | 'advanced';

export interface TextQuizQuestion {
  prompt: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface TextQuizItem {
  id: string;
  slug: string;
  title: string;
  description?: string;
  level: QuizLevel;
  coverImageUrl?: string | null;
  isPublished?: boolean;
  createdAt?: string;
}

export interface TextQuizDetail extends TextQuizItem {
  questions: TextQuizQuestion[];
}

export interface TextQuizListQuery {
  page?: number;
  limit?: number;
  level?: QuizLevel | '';
  search?: string;
}

export interface TextQuizListResponse {
  success: boolean;
  data: TextQuizItem[];
  meta?: { pagination?: PaginationMeta };
}

export interface TextQuizDetailResponse {
  success: boolean;
  data: TextQuizDetail;
}
