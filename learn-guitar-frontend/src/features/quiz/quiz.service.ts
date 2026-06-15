import api from '../../services/api';
import { normalizeApiError } from '../../utils/apiError';
import type {
  ChordGuessBatchResult,
  CreateChordGuessBatchPayload,
  CreateQuizPayload,
  CreateQuizQuestionPayload,
  DataResponse,
  LeaderboardData,
  LeaderboardPeriod,
  PaginationMeta,
  PracticeQuizPickerItem,
  QuizLessonTemplateItem,
  QuizLessonTemplateDetail,
  QuizLessonTemplatePayload,
  QuizAdminItem,
  QuizAttemptItem,
  QuizQuestionAdminItem,
  QuizStartData,
  QuizStartPayload,
  QuizSubmitData,
  QuizSubmitPayload,
} from './quiz.types';

export const quizService = {
  async getQuizLessonTemplates(query: { page?: number; limit?: number; level?: string; search?: string } = {}): Promise<{
    items: QuizLessonTemplateItem[];
    pagination: PaginationMeta | null;
  }> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      if (query.level) params.set('level', String(query.level));
      if (query.search) params.set('search', query.search);
      const suffix = params.toString() ? `?${params.toString()}` : '';

      const response = await api.get<DataResponse<QuizLessonTemplateItem[]>>(`/quiz-lessons${suffix}`);
      return {
        items: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createQuizLessonTemplate(payload: QuizLessonTemplatePayload): Promise<QuizLessonTemplateItem> {
    try {
      const response = await api.post<DataResponse<QuizLessonTemplateItem>>('/quiz-lessons', payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getQuizLessonTemplateDetail(templateId: string): Promise<QuizLessonTemplateDetail> {
    try {
      const response = await api.get<DataResponse<QuizLessonTemplateDetail>>(`/quiz-lessons/${templateId}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createChordGuessBatch(templateId: string, payload: CreateChordGuessBatchPayload): Promise<ChordGuessBatchResult> {
    try {
      const response = await api.post<DataResponse<ChordGuessBatchResult>>(`/quiz-lessons/${templateId}/chord-quizzes`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createQuiz(payload: CreateQuizPayload): Promise<QuizAdminItem> {
    try {
      const response = await api.post<DataResponse<QuizAdminItem>>('/quizzes', payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createQuizQuestion(quizId: string, payload: CreateQuizQuestionPayload): Promise<QuizQuestionAdminItem> {
    try {
      const response = await api.post<DataResponse<QuizQuestionAdminItem>>(`/quizzes/${quizId}/questions`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async startQuiz(quizId: string, payload: QuizStartPayload = {}): Promise<QuizStartData> {
    try {
      const response = await api.post<DataResponse<QuizStartData>>(`/quizzes/${quizId}/start`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getPracticeQuizzes(query: { lessonId?: string; courseId?: string; limit?: number } = {}): Promise<PracticeQuizPickerItem[]> {
    try {
      const templates = await this.getQuizLessonTemplates({ page: 1, limit: query.limit ?? 24 });

      return templates.items.flatMap((template) =>
        template.quizCount > 0
          ? [
              {
                id: template.id,
                slug: template.slug,
                title: template.title,
                level: template.level,
                quizType: template.lessonType,
                lessonId: query.lessonId ?? null,
                courseId: query.courseId ?? null,
              },
            ]
          : []
      );
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async submitQuiz(quizId: string, payload: QuizSubmitPayload): Promise<QuizSubmitData> {
    try {
      const response = await api.post<DataResponse<QuizSubmitData>>(`/quizzes/${quizId}/submit`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getMyAttempts(
    quizId: string,
    query: { page?: number; limit?: number } = {}
  ): Promise<{ attempts: QuizAttemptItem[]; pagination: PaginationMeta | null }> {
    try {
      const params = new URLSearchParams();
      if (query.page) params.set('page', String(query.page));
      if (query.limit) params.set('limit', String(query.limit));
      const suffix = params.toString() ? `?${params.toString()}` : '';

      const response = await api.get<DataResponse<QuizAttemptItem[]>>(`/quizzes/${quizId}/attempts/me${suffix}`);
      return {
        attempts: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getLeaderboard(quizId: string, period: LeaderboardPeriod = 'weekly'): Promise<LeaderboardData> {
    try {
      const response = await api.get<DataResponse<LeaderboardData>>(`/quizzes/${quizId}/leaderboard?period=${period}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },
};

export default quizService;
