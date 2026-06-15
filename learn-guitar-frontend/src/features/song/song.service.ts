import axios from 'axios';
import api from '../../services/api';
import type {
  SongDeleteResponse,
  SongDetail,
  SongDetailResponse,
  SongListItem,
  SongPagination,
  SongListResponse,
  SongPayload,
  SongQuery,
} from './song.types';

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

const buildQuery = (query: SongQuery): string => {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.difficulty) params.set('difficulty', query.difficulty);
  if (query.genre) params.set('genre', query.genre);

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const songService = {
  async getSongs(query: SongQuery = {}): Promise<{ songs: SongListItem[]; pagination: SongPagination | null }> {
    try {
      const response = await api.get<SongListResponse>(`/songs${buildQuery(query)}`);
      return {
        songs: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async getSongBySlug(slug: string): Promise<SongDetail> {
    try {
      const response = await api.get<SongDetailResponse>(`/songs/${slug}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async createSong(payload: SongPayload): Promise<SongDetail> {
    try {
      const response = await api.post<SongDetailResponse>('/songs', payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async updateSong(songId: string, payload: SongPayload): Promise<SongDetail> {
    try {
      const response = await api.put<SongDetailResponse>(`/songs/${songId}`, payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async deleteSong(songId: string): Promise<SongDeleteResponse> {
    try {
      const response = await api.delete<SongDeleteResponse>(`/songs/${songId}`);
      return response.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export default songService;
