import { describe, test, expect } from '@jest/globals';
import { createSongSchema, updateSongSchema, getSongsQuerySchema } from '../../src/validators/Song.validator.js';

describe('Song Validator', () => {
  const validSong = {
    title: 'Hoa cau anh nho',
    artist: 'Thuong Khong',
    originalKey: 'C',
    sections: [
      {
        type: 'verse',
        name: 'Verse 1',
        lines: [
          { text: 'Hom nay buon' },
          { text: 'Nhung van yeu em' },
        ],
      },
    ],
  };

  describe('createSongSchema', () => {
    test('validates correct song data', () => {
      const result = createSongSchema.safeParse(validSong);
      expect(result.success).toBe(true);
    });

    test('rejects title shorter than 3 chars', () => {
      const result = createSongSchema.safeParse({ ...validSong, title: 'AB' });
      expect(result.success).toBe(false);
    });

    test('rejects artist shorter than 2 chars', () => {
      const result = createSongSchema.safeParse({ ...validSong, artist: 'A' });
      expect(result.success).toBe(false);
    });

    test('rejects missing originalKey', () => {
      const { originalKey, ...withoutKey } = validSong;
      const result = createSongSchema.safeParse(withoutKey);
      expect(result.success).toBe(false);
    });

    test('rejects section without type', () => {
      const result = createSongSchema.safeParse({
        ...validSong,
        sections: [{ name: 'No Type', lines: [{ text: 'test' }] }],
      });
      expect(result.success).toBe(false);
    });

    test('rejects empty sections', () => {
      const result = createSongSchema.safeParse({ ...validSong, sections: [] });
      expect(result.success).toBe(false);
    });

    test('rejects section with empty lines', () => {
      const result = createSongSchema.safeParse({
        ...validSong,
        sections: [{ type: 'verse', name: 'V1', lines: [] }],
      });
      expect(result.success).toBe(false);
    });

    test('accepts valid difficulty levels', () => {
      for (const diff of ['beginner', 'intermediate', 'advanced']) {
        const result = createSongSchema.safeParse({ ...validSong, difficulty: diff });
        expect(result.success).toBe(true);
      }
    });

    test('rejects invalid difficulty', () => {
      const result = createSongSchema.safeParse({ ...validSong, difficulty: 'expert' });
      expect(result.success).toBe(false);
    });

    test('accepts all valid section types', () => {
      const types = ['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'outro', 'solo', 'interlude'];
      for (const type of types) {
        const result = createSongSchema.safeParse({
          ...validSong,
          sections: [{ type, name: 'Section', lines: [{ text: 'test' }] }],
        });
        expect(result.success).toBe(true);
      }
    });

    test('accepts optional fields', () => {
      const result = createSongSchema.safeParse({
        ...validSong,
        capo: 2,
        tempo: 120,
        timeSignature: '3/4',
        tags: ['pop', 'vietnamese'],
      });
      expect(result.success).toBe(true);
    });

    test('rejects capo out of range', () => {
      const result = createSongSchema.safeParse({ ...validSong, capo: 15 });
      expect(result.success).toBe(false);
    });

    test('rejects tempo out of range', () => {
      const result = createSongSchema.safeParse({ ...validSong, tempo: 5 });
      expect(result.success).toBe(false);
      const result2 = createSongSchema.safeParse({ ...validSong, tempo: 300 });
      expect(result2.success).toBe(false);
    });

    test('accepts valid youtube link', () => {
      const result = createSongSchema.safeParse({
        ...validSong,
        youtubeLink: 'https://youtube.com/watch?v=abc',
      });
      expect(result.success).toBe(true);
    });

    test('accepts empty youtube link', () => {
      const result = createSongSchema.safeParse({ ...validSong, youtubeLink: '' });
      expect(result.success).toBe(true);
    });

    test('rejects invalid youtube link', () => {
      const result = createSongSchema.safeParse({ ...validSong, youtubeLink: 'not-a-url' });
      expect(result.success).toBe(false);
    });
  });

  describe('updateSongSchema', () => {
    test('allows partial updates', () => {
      const result = updateSongSchema.safeParse({ title: 'New Title' });
      expect(result.success).toBe(true);
    });

    test('allows empty object', () => {
      const result = updateSongSchema.safeParse({});
      expect(result.success).toBe(true);
    });
  });

  describe('getSongsQuerySchema', () => {
    test('validates with defaults', () => {
      const result = getSongsQuerySchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
      }
    });

    test('coerces string page to number', () => {
      const result = getSongsQuerySchema.safeParse({ page: '3' });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.page).toBe(3);
    });

    test('rejects limit over 50', () => {
      const result = getSongsQuerySchema.safeParse({ limit: 100 });
      expect(result.success).toBe(false);
    });

    test('accepts optional filters', () => {
      const result = getSongsQuerySchema.safeParse({
        search: 'em',
        difficulty: 'beginner',
        genre: 'pop',
      });
      expect(result.success).toBe(true);
    });
  });
});
