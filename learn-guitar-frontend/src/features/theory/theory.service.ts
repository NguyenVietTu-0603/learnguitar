import api from '../../services/api';
import { normalizeApiError } from '../../utils/apiError';
import type {
  DataResponse,
  PaginationMeta,
  TheoryCreatePayload,
  TheoryLessonItem,
  TheoryQuery,
} from './theory.types';

const buildQuery = (query: TheoryQuery): string => {
  const params = new URLSearchParams();

  if (query.topic) params.set('topic', query.topic);
  if (query.level) params.set('level', query.level);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const theoryService = {
  async getTheoryLessons(
    query: TheoryQuery = {}
  ): Promise<{ lessons: TheoryLessonItem[]; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<DataResponse<TheoryLessonItem[]>>(`/theory-lessons${buildQuery(query)}`);
      return {
        lessons: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getTheoryBySlug(slug: string): Promise<TheoryLessonItem> {
    try {
      const response = await api.get<DataResponse<TheoryLessonItem>>(`/theory-lessons/${slug}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createTheory(payload: TheoryCreatePayload): Promise<TheoryLessonItem> {
    try {
      const response = await api.post<DataResponse<TheoryLessonItem>>('/theory-lessons', payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },
};

export default theoryService;
