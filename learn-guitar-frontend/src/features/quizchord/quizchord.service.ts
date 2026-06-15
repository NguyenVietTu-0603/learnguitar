import axios from 'axios';
import api from '../../services/api';
import type {
  QuizChordResponse,
  QuizChordAnswerRequest,
  QuizChordAnswerResponse
} from './quizchord.types.ts';

const normalizeError = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'Không thể kết nối đến máy chủ.';
};

const buildQuery = (query: {
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}): string => {
  const params = new URLSearchParams();

  if (query.category) params.set('category', query.category);
  if (query.difficulty) params.set('difficulty', query.difficulty);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const quizChordService = {
  /**
   * 🎸 Generate quiz chord
   */
  async generateQuiz(query: {
    category?: string;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
  } = {}): Promise<QuizChordResponse> {
    try {
      const response = await api.get<QuizChordResponse>(
        `/quizchord/generate${buildQuery(query)}`
      );

      return response.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  /**
   * ✅ Check answer
   */
  async checkAnswer(
    payload: QuizChordAnswerRequest
  ): Promise<QuizChordAnswerResponse> {
    try {
      const response = await api.post<QuizChordAnswerResponse>(
        `/quizchord/check-answer`,
        payload
      );

      return response.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  }
};

export default quizChordService;