import type { SongSectionInput } from '../../features/song/song.types';

export interface SongBaseFormValues {
  title: string;
  artist: string;
  originalKey: string;
  capo: string;
  tempo: string;
  timeSignature: string;
  strummingPattern: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  genre: string;
  tags: string;
  youtubeLink: string;
  image: string;
  isPublic: boolean;
  sectionType: SongSectionInput['type'];
  sectionName: string;
}

export const DEFAULT_SECTION_TYPE_OPTIONS: Array<{ label: string; value: SongSectionInput['type'] }> = [
  { label: 'Intro', value: 'intro' },
  { label: 'Verse', value: 'verse' },
  { label: 'Pre-Chorus', value: 'pre-chorus' },
  { label: 'Chorus', value: 'chorus' },
  { label: 'Bridge', value: 'bridge' },
  { label: 'Outro', value: 'outro' },
  { label: 'Solo', value: 'solo' },
  { label: 'Interlude', value: 'interlude' },
];
