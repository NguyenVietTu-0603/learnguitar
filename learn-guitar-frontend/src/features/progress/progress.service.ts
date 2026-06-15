import api from '../../services/api';
import { normalizeApiError } from '../../utils/apiError';
import type {
  BadgeItem,
  ContinueLearningItem,
  DashboardData,
  DataResponse,
  HistoryItem,
  HistoryQuery,
  LessonProgressPayload,
  LessonProgressResult,
  MyProgressData,
  PaginationMeta,
} from './progress.types';

const buildHistoryQuery = (query: HistoryQuery): string => {
  const params = new URLSearchParams();

  if (query.from) params.set('from', query.from);
  if (query.to) params.set('to', query.to);
  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.eventType) params.set('eventType', query.eventType);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const progressService = {
  async getDashboard(): Promise<DashboardData> {
    try {
      const response = await api.get<DataResponse<DashboardData>>('/progress/dashboard/me');
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getMyProgress(courseId?: string): Promise<MyProgressData> {
    try {
      const suffix = courseId ? `?courseId=${encodeURIComponent(courseId)}` : '';
      const response = await api.get<DataResponse<MyProgressData>>(`/progress/me${suffix}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getMyHistory(query: HistoryQuery = {}): Promise<{ items: HistoryItem[]; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<DataResponse<HistoryItem[]>>(`/progress/history/me${buildHistoryQuery(query)}`);
      return {
        items: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getMyBadges(): Promise<BadgeItem[]> {
    try {
      const response = await api.get<DataResponse<BadgeItem[]>>('/progress/badges/me');
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getContinueLearning(limit = 3): Promise<ContinueLearningItem[]> {
    try {
      const response = await api.get<DataResponse<ContinueLearningItem[]>>(
        `/progress/continue-learning/me?limit=${encodeURIComponent(String(limit))}`
      );
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async updateLessonProgress(lessonId: string, payload: LessonProgressPayload): Promise<LessonProgressResult> {
    try {
      const response = await api.patch<DataResponse<LessonProgressResult>>(`/progress/lessons/${lessonId}`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },
};

export default progressService;
