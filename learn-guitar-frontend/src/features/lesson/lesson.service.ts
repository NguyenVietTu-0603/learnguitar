import axios from 'axios';
import api from '../../services/api';
import type {
  VideoLesson,
  LessonListQuery,
  LessonListResponse,
  LessonDetailResponse,
  PaginationMeta,
} from './lesson.types';

const normalizeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Không thể kết nối đến máy chủ.';
};

const buildQuery = (query: LessonListQuery): string => {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.lessonType) params.set('lessonType', query.lessonType);
  if (query.level) params.set('level', query.level);
  if (query.search) params.set('search', query.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const lessonService = {
  async getLessons(query: LessonListQuery = {}): Promise<{ lessons: VideoLesson[]; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<LessonListResponse>(`/lessons${buildQuery(query)}`);
      return {
        lessons: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async getLessonBySlug(slug: string): Promise<VideoLesson> {
    try {
      const response = await api.get<LessonDetailResponse>(`/lessons/${slug}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export default lessonService;
