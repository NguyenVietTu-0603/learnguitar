export type SongDifficulty = 'beginner' | 'intermediate' | 'advanced';

export interface SongChord {
  chord: string;
  offset: number;
}

export interface ChordInfo {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  positions: number[];
  fingers: number[];
  audioUrl: string | null;
  difficulty: SongDifficulty;
  category: string;
}

export interface SongChordUsage {
  id: string;
  songId: string;
  chordId: string;
  positionInSong: number;
  chord: ChordInfo;
}

export interface SongWord {
  word: string;
  chord: string | null;
  index: number;
}

export interface SongLine {
  text: string;
  chords: SongChord[];
  words: SongWord[];
}

export interface SongSection {
  type: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'outro' | 'solo' | 'interlude';
  name: string;
  lines: SongLine[];
}

export interface SongListItem {
  id: string;
  title: string;
  artist: string;
  slug: string;
  originalKey: string;
  difficulty: SongDifficulty;
  views: number;
  createdAt: string;
  genre?: string[];
}

export interface SongDetail {
  id: string;
  title: string;
  artist: string;
  slug: string;
  originalKey: string;
  capo: number;
  tempo: number | null;
  timeSignature: string;
  strummingPattern: string | null;
  difficulty: SongDifficulty;
  genre: string[];
  tags: string[];
  youtubeLink: string | null;
  image: string | null;
  views: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt?: string;
  lyrics?: {
    sections?: SongSection[];
  };
  sections: SongSection[];
  chordUsages: SongChordUsage[];
}

export interface SongPagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface SongListResponse {
  success: boolean;
  data: SongListItem[];
  meta?: {
    pagination?: SongPagination;
  };
}

export interface SongDetailResponse {
  success: boolean;
  message?: string;
  data: SongDetail;
}

export interface SongDeleteResponse {
  success: boolean;
  message: string;
}

export interface SongLineInput {
  text: string;
  chordsLine?: string;
}

export interface SongSectionInput {
  type: SongSection['type'];
  name: string;
  lines: SongLineInput[];
}

export interface SongPayload {
  title: string;
  artist: string;
  originalKey: string;
  capo?: number;
  tempo?: number | null;
  timeSignature?: string;
  strummingPattern?: string;
  genre?: string[];
  difficulty?: SongDifficulty;
  tags?: string[];
  youtubeLink?: string;
  image?: string;
  isPublic?: boolean;
  sections: SongSectionInput[];
}

export interface SongQuery {
  page?: number;
  limit?: number;
  search?: string;
  difficulty?: SongDifficulty | '';
  genre?: string;
}
