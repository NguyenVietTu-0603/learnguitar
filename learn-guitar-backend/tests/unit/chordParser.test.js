import { describe, test, expect } from '@jest/globals';
import { advancedParseChordLine } from '../../src/utils/chordParser.js';

describe('chordParser', () => {
  test('parses bracket chord line', () => {
    const result = advancedParseChordLine('[C]Amazing [G]grace');
    expect(result.text).toBe('Amazing grace');
    expect(result.chords.length).toBeGreaterThan(0);
    expect(result.words.length).toBeGreaterThan(0);
  });

  test('parses token chord line', () => {
    const result = advancedParseChordLine('C Amazing G grace');
    expect(result.words.length).toBeGreaterThan(0);
  });

  test('handles empty input', () => {
    const result = advancedParseChordLine('');
    expect(result.text).toBe('');
    expect(result.words).toEqual([]);
    expect(result.chords).toEqual([]);
  });

  test('handles null input becomes string null', () => {
    const result = advancedParseChordLine(null);
    expect(result.text).toBe('null');
  });

  test('handles whitespace-only input', () => {
    const result = advancedParseChordLine('   \t  ');
    expect(result.text).toBe('');
  });

  test('handles line with only chords', () => {
    const result = advancedParseChordLine('[C][G][Am]');
    expect(result.words.length).toBe(0);
    expect(result.chords.length).toBe(3);
  });

  test('parses chord with slash bass note', () => {
    const result = advancedParseChordLine('[C/E]');
    expect(result.chords.some(c => c.chord === 'C/E')).toBe(true);
  });

  test('normalizes tabs to spaces', () => {
    const result = advancedParseChordLine('[C]\tAmazing');
    expect(result.text).toBe('Amazing');
  });

  test('handles chord with sharp', () => {
    const result = advancedParseChordLine('[C#]Test');
    expect(result.chords.some(c => c.chord === 'C#')).toBe(true);
  });

  test('handles chord with flat', () => {
    const result = advancedParseChordLine('[Ab]Test');
    expect(result.chords.some(c => c.chord === 'Ab')).toBe(true);
  });

  test('handles chord suffix m7', () => {
    const result = advancedParseChordLine('[Am7]Test');
    expect(result.chords.some(c => c.chord === 'Am7')).toBe(true);
  });

  test('handles chord suffix maj', () => {
    const result = advancedParseChordLine('[Cmaj7]Test');
    expect(result.chords.some(c => c.chord === 'Cmaj7')).toBe(true);
  });

  test('handles chord suffix dim', () => {
    const result = advancedParseChordLine('[Adim]Test');
    expect(result.chords.some(c => c.chord === 'Adim')).toBe(true);
  });

  test('handles chord suffix sus', () => {
    const result = advancedParseChordLine('[Dsus4]Test');
    expect(result.chords.some(c => c.chord === 'Dsus4')).toBe(true);
  });

  test('handles chord suffix add', () => {
    const result = advancedParseChordLine('[Cadd9]Test');
    expect(result.chords.some(c => c.chord === 'Cadd9')).toBe(true);
  });
});
