import api from '../../services/api';
import { normalizeApiError } from '../../utils/apiError';
import type {
  CreateNotePayload,
  DataResponse,
  NoteByPosition,
  NoteFretboardById,
  NoteItem,
  NoteQuery,
  PaginationMeta,
  RandomNoteQuery,
} from './note.types';

const buildQuery = <T extends object>(query: T): string => {
  const params = new URLSearchParams();

  Object.entries(query as Record<string, unknown>).forEach(([key, value]) => {
    if (value === undefined || value === '') return;
    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};

export const noteService = {
  async getNotes(query: NoteQuery = {}): Promise<{ notes: NoteItem[]; pagination: PaginationMeta | null }> {
    try {
      const response = await api.get<DataResponse<NoteItem[]>>(`/notes${buildQuery(query)}`);
      return {
        notes: response.data.data,
        pagination: response.data.meta?.pagination ?? null,
      };
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getRandomNotes(query: RandomNoteQuery = {}): Promise<NoteItem[]> {
    try {
      const response = await api.get<DataResponse<NoteItem[]>>(`/notes/random${buildQuery(query)}`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getNoteFretboard(noteId: string): Promise<NoteFretboardById> {
    try {
      const response = await api.get<DataResponse<NoteFretboardById>>(`/notes/${noteId}/fretboard`);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async getNoteByPosition(stringNumber: number, fret: number): Promise<NoteByPosition> {
    try {
      const response = await api.get<DataResponse<NoteByPosition>>(
        `/notes/fretboard/position?stringNumber=${stringNumber}&fret=${fret}`
      );
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },

  async createNote(payload: CreateNotePayload): Promise<NoteFretboardById> {
    try {
      const response = await api.post<DataResponse<NoteFretboardById>>('/notes', payload);
      return response.data.data;
    } catch (error) {
      throw new Error(normalizeApiError(error));
    }
  },
};

export default noteService;
