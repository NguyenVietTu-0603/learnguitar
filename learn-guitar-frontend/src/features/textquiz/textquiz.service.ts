import axios from 'axios';
import api from '../../services/api';
import type {
  TextQuizItem,
  TextQuizDetail,
  TextQuizListQuery,
  TextQuizListResponse,
  TextQuizDetailResponse,
  PaginationMeta,
} from './textquiz.types';

const normalizeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) return message;
  }
  if (error instanceof Error && error.message) return error.message;
  return 'Không thể kết nối đến máy chủ.';
};

const buildQuery = (query: TextQuizListQuery): string => {
  const params = new URLSearchParams();
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.level) params.set('level', query.level);
  if (query.search) params.set('search', query.search.trim());
  const qs = params.toString();
  return qs ? `?${qs}` : '';
};

export const textquizService = {
  async getTextQuizzes(query: TextQuizListQuery = {}): Promise<{ quizzes: TextQuizItem[]; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<TextQuizListResponse>(`/text-quizzes${buildQuery(query)}`);
      return {
        quizzes: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async getTextQuizBySlug(slug: string): Promise<TextQuizDetail> {
    try {
      const response = await api.get<TextQuizDetailResponse>(`/text-quizzes/${slug}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export default textquizService;
