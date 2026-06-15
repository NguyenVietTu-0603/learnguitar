const SHARP_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_TO_SHARP = {
  Db: 'C#',
  Eb: 'D#',
  Gb: 'F#',
  Ab: 'G#',
  Bb: 'A#'
};

const CHORD_REGEX = /^([A-G](?:#|b)?)(.*?)(?:\/([A-G](?:#|b)?))?$/;

const normalizeSemitones = (semitones) => {
  if (!Number.isInteger(semitones)) {
    return 0;
  }

  const mod = semitones % 12;
  return mod < 0 ? mod + 12 : mod;
};

const normalizeNote = (note) => FLAT_TO_SHARP[note] || note;

const transposeNote = (note, semitones) => {
  const normalized = normalizeNote(note);
  const noteIndex = SHARP_NOTES.indexOf(normalized);

  if (noteIndex === -1) {
    return note;
  }

  const nextIndex = (noteIndex + normalizeSemitones(semitones)) % 12;
  return SHARP_NOTES[nextIndex];
};

export const transposeChordToken = (token, semitones) => {
  if (!token || !Number.isInteger(semitones)) {
    return token;
  }

  const cleanToken = String(token).trim();
  const match = cleanToken.match(CHORD_REGEX);

  if (!match) {
    return cleanToken;
  }

  const [, root, suffix = '', bass] = match;
  const transposedRoot = transposeNote(root, semitones);
  const transposedBass = bass ? transposeNote(bass, semitones) : '';

  return `${transposedRoot}${suffix}${transposedBass ? `/${transposedBass}` : ''}`;
};

const transposeLine = (line = {}, semitones) => {
  const chords = Array.isArray(line.chords)
    ? line.chords.map((item) => ({
      ...item,
      chord: transposeChordToken(item.chord, semitones)
    }))
    : [];

  const words = Array.isArray(line.words)
    ? line.words.map((item) => ({
      ...item,
      chord: item.chord ? transposeChordToken(item.chord, semitones) : item.chord
    }))
    : [];

  const chordsLine = typeof line.chordsLine === 'string'
    ? line.chordsLine.replace(/\[([^\]]+)\]/g, (_, chord) => `[${transposeChordToken(chord, semitones)}]`)
    : line.chordsLine;

  return {
    ...line,
    chords,
    words,
    chordsLine
  };
};

export const transposeSections = (sections = [], semitones = 0) => {
  if (!Array.isArray(sections) || semitones === 0) {
    return sections;
  }

  return sections.map((section) => ({
    ...section,
    lines: Array.isArray(section.lines)
      ? section.lines.map((line) => transposeLine(line, semitones))
      : []
  }));
};

export const transposeKey = (key, semitones) => transposeChordToken(key, semitones);

export default {
  transposeChordToken,
  transposeSections,
  transposeKey
};
