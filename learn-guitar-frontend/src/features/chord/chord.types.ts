export type ChordDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ChordCategory =
  | 'major'
  | 'minor'
  | 'seventh'
  | 'suspended'
  | 'diminished'
  | 'augmented'
  | 'extended'
  | 'other';

export interface Chord {
  id: string;
  name: string;
  slug: string;
  displayName: string;
  alias: string[];
  positions: number[];
  fingers: number[];
  difficulty: ChordDifficulty;
  capo: number | null;
  key: string | null;
  notes: string[];
  audioUrl: string | null;
  diagramSvg: string | null;
  isBarre: boolean;
  category: ChordCategory;
  tags: string[];
  popularity: number;
  usageCount: number;
  songs?: ChordSongItem[];
}

export interface ChordSongItem {
  id: string;
  title: string;
  slug: string;
  artist: string;
  difficulty: ChordDifficulty;
  createdAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ChordListQuery {
  page?: number;
  limit?: number;
  difficulty?: ChordDifficulty | '';
  category?: ChordCategory | '';
  search?: string;
}

export interface ChordListResponse {
  success: boolean;
  data: Chord[];
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface ChordDetailResponse {
  success: boolean;
  data: Chord;
}

export interface SongsByChordResponse {
  success: boolean;
  data: {
    chord: Pick<Chord, 'id' | 'name' | 'slug' | 'displayName'>;
    songs: ChordSongItem[];
    pagination: PaginationMeta;
  };
  meta?: {
    pagination?: PaginationMeta;
  };
}

export interface SongChordsResponse {
  success: boolean;
  data: {
    song: {
      id: string;
      title: string;
      slug: string;
      artist: string;
    };
    chords: Chord[];
  };
}
