import type { CourseLevel } from '../course/course.types';

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface NoteFretPosition {
  stringNumber: number;
  fret: number;
}

export interface NoteItem {
  id: string;
  canonicalName: string;
  enharmonicNames: string[];
  octave: number;
  frequencyHz: number;
  midiNumber: number;
  audioUrl?: string | null;
  fretPositions?: NoteFretPosition[];
}

export interface NoteByPosition {
  stringNumber: number;
  fret: number;
  note: NoteItem;
}

export interface NoteFretboardById {
  noteId: string;
  note: string;
  positions: NoteFretPosition[];
}

export interface NoteQuery {
  page?: number;
  limit?: number;
  name?: string;
  octave?: number;
}

export interface RandomNoteQuery {
  count?: number;
  level?: CourseLevel;
}

export interface CreateNotePayload {
  canonicalName: string;
  enharmonicNames?: string[];
  octave: number;
  frequencyHz: number;
  midiNumber: number;
  audioUrl?: string;
  fretPositions?: NoteFretPosition[];
}

export interface DataResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    pagination?: PaginationMeta;
  };
}
