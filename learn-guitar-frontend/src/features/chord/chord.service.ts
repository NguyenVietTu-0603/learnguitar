import axios from 'axios';
import api from '../../services/api';
import type {
  Chord,
  ChordDetailResponse,
  ChordListQuery,
  ChordListResponse,
  PaginationMeta,
  SongChordsResponse,
  SongsByChordResponse,
} from './chord.types';

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

const buildQuery = (query: ChordListQuery): string => {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.difficulty) params.set('difficulty', query.difficulty);
  if (query.category) params.set('category', query.category);
  if (query.search) params.set('search', query.search.trim());

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const chordService = {
  async getChords(query: ChordListQuery = {}): Promise<{ chords: Chord[]; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<ChordListResponse>(`/chords${buildQuery(query)}`);
      return {
        chords: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async getChordBySlug(slug: string): Promise<Chord> {
    try {
      const response = await api.get<ChordDetailResponse>(`/chords/${slug}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async getSongsByChordSlug(slug: string, page = 1, limit = 12): Promise<{ songs: SongsByChordResponse['data']['songs']; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<SongsByChordResponse>(`/chords/${slug}/songs?page=${page}&limit=${limit}`);
      return {
        songs: response.data.data.songs,
        pagination: response.data.data.pagination ?? response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },

  async getSongChordsBySlug(slug: string): Promise<Chord[]> {
    try {
      const response = await api.get<SongChordsResponse>(`/songs/${slug}/chords`);
      return response.data.data.chords;
    } catch (error) {
      throw new Error(normalizeError(error));
    }
  },
};

export default chordService;
