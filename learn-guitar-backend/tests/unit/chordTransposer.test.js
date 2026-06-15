import { describe, test, expect } from '@jest/globals';
import { transposeChordToken, transposeSections, transposeKey } from '../../src/utils/chordTransposer.js';

describe('chordTransposer', () => {
  describe('transposeChordToken', () => {
    test('transposes C up by 2 semitones to D', () => {
      expect(transposeChordToken('C', 2)).toBe('D');
    });

    test('transposes C up by 7 to G', () => {
      expect(transposeChordToken('C', 7)).toBe('G');
    });

    test('transposes chord with minor suffix', () => {
      expect(transposeChordToken('Am', 5)).toBe('Dm');
    });

    test('transposes chord with slash bass', () => {
      expect(transposeChordToken('C/G', 2)).toBe('D/A');
    });

    test('returns original for null token', () => {
      expect(transposeChordToken(null, 2)).toBe(null);
    });

    test('returns original for non-integer semitones', () => {
      expect(transposeChordToken('C', 2.5)).toBe('C');
    });

    test('wraps around from B', () => {
      expect(transposeChordToken('B', 1)).toBe('C');
    });

    test('wraps around from C down to B', () => {
      expect(transposeChordToken('C', -1)).toBe('B');
    });

    test('handles flat notes (normalizes to sharp)', () => {
      expect(transposeChordToken('Db', 1)).toBe('D');
    });

    test('handles sharp notes', () => {
      expect(transposeChordToken('F#', 1)).toBe('G');
    });

    test('handles G7 to C', () => {
      expect(transposeChordToken('G7', 5)).toBe('C7');
    });

    test('handles empty string token', () => {
      expect(transposeChordToken('', 2)).toBe('');
    });

    test('transposes m7 chord', () => {
      expect(transposeChordToken('Bm7', 2)).toBe('C#m7');
    });

    test('transposes major 7 chord', () => {
      expect(transposeChordToken('Dmaj7', 5)).toBe('Gmaj7');
    });

    test('transposes 0 semitones returns original', () => {
      expect(transposeChordToken('F', 0)).toBe('F');
    });

    test('transposes complex chord with sus', () => {
      expect(transposeChordToken('Dsus4', 2)).toBe('Esus4');
    });

    test('handles unknown chord gracefully', () => {
      expect(transposeChordToken('Xyz', 2)).toBe('Xyz');
    });
  });

  describe('transposeKey', () => {
    test('transposes key up', () => {
      expect(transposeKey('C', 5)).toBe('F');
    });

    test('transposes key down', () => {
      expect(transposeKey('G', -5)).toBe('D');
    });
  });

  describe('transposeSections', () => {
    test('returns sections unchanged when semitones is 0', () => {
      const sections = [{ type: 'verse', name: 'V1', lines: [] }];
      expect(transposeSections(sections, 0)).toBe(sections);
    });

    test('returns sections unchanged when not an array', () => {
      expect(transposeSections(null, 5)).toBe(null);
    });

    test('transposes all chords in sections', () => {
      const sections = [
        {
          type: 'verse',
          name: 'V1',
          lines: [
            {
              text: 'Test',
              chords: [{ chord: 'C', offset: 0 }],
              words: [],
              chordsLine: '[C]',
            },
          ],
        },
      ];
      const result = transposeSections(sections, 2);
      expect(result[0].lines[0].chords[0].chord).toBe('D');
    });

    test('transposes chords in word objects', () => {
      const sections = [
        {
          type: 'chorus',
          name: 'C1',
          lines: [
            {
              text: 'Hello',
              chords: [],
              words: [{ word: 'Hello', chord: 'G', index: 0 }],
              chordsLine: '[G]',
            },
          ],
        },
      ];
      const result = transposeSections(sections, 7);
      expect(result[0].lines[0].words[0].chord).toBe('D');
    });

    test('handles sections with empty lines array', () => {
      const sections = [{ type: 'verse', name: 'V1', lines: [] }];
      const result = transposeSections(sections, 5);
      expect(result[0].lines).toEqual([]);
    });

    test('transposes chordsLine string', () => {
      const sections = [
        {
          type: 'verse',
          name: 'V1',
          lines: [{ text: 'Test', chordsLine: '[C]' }],
        },
      ];
      const result = transposeSections(sections, 2);
      expect(result[0].lines[0].chordsLine).toBe('[D]');
    });
  });
});
