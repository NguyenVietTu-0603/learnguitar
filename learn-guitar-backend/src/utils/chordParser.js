const CHORD_TOKEN_REGEX = /^[A-G](?:#|b)?(?:m|maj|min|dim|aug|sus|add)?\d{0,2}(?:\([^\)]*\))?(?:\/[A-G](?:#|b)?)?$/i;

const normalizeLine = (line = '') => String(line).replace(/\t/g, ' ').replace(/\s+/g, ' ').trim();

const normalizeChordToken = (token = '') => token.replace(/^\[|\]$/g, '').replace(/[.,;:!?]+$/g, '').trim();

const isChordToken = (token) => {
  if (!token) return false;
  return CHORD_TOKEN_REGEX.test(normalizeChordToken(token));
};

const parseBracketChordLine = (line) => {
  const words = [];
  const chords = [];
  let currentWord = '';
  let pendingChords = [];
  let activeChord = null;

  const flushWord = () => {
    const word = currentWord.trim();
    if (!word) {
      currentWord = '';
      return;
    }

    const offset = words.length;

    if (pendingChords.length > 0) {
      for (const chord of pendingChords) {
        chords.push({ chord, offset });
      }
      activeChord = pendingChords[pendingChords.length - 1];
      pendingChords = [];
    }

    words.push({
      word,
      chord: activeChord,
      index: offset
    });

    currentWord = '';
  };

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];

    if (char === '[') {
      flushWord();

      const closeIndex = line.indexOf(']', index + 1);
      if (closeIndex === -1) {
        currentWord += char;
        continue;
      }

      const maybeChord = normalizeChordToken(line.slice(index + 1, closeIndex));
      if (isChordToken(maybeChord)) {
        pendingChords.push(maybeChord);
      } else {
        currentWord += line.slice(index, closeIndex + 1);
      }

      index = closeIndex;
      continue;
    }

    if (/\s/.test(char)) {
      flushWord();
      continue;
    }

    currentWord += char;
  }

  flushWord();

  if (pendingChords.length > 0) {
    const tailOffset = words.length;
    for (const chord of pendingChords) {
      chords.push({ chord, offset: tailOffset });
    }
  }

  return {
    text: words.map((word) => word.word).join(' ').trim(),
    words,
    chords
  };
};

const parseTokenChordLine = (line) => {
  const tokens = line.match(/\S+/g) || [];
  const words = [];
  const chords = [];

  let wordIndex = 0;
  let activeChord = null;

  for (const token of tokens) {
    if (isChordToken(token)) {
      const chord = normalizeChordToken(token);
      chords.push({ chord, offset: wordIndex });
      activeChord = chord;
      continue;
    }

    words.push({
      word: token,
      chord: activeChord,
      index: wordIndex
    });

    wordIndex += 1;
  }

  const nonChordCount = words.length;

  if (tokens.length > 0 && nonChordCount === 0) {
    return {
      text: '',
      words: [],
      chords
    };
  }

  return {
    text: words.map((word) => word.word).join(' ').trim(),
    words,
    chords
  };
};

export const advancedParseChordLine = (input) => {
  const normalized = normalizeLine(input);

  if (!normalized) {
    return {
      text: '',
      words: [],
      chords: []
    };
  }

  if (normalized.includes('[') && normalized.includes(']')) {
    return parseBracketChordLine(normalized);
  }

  return parseTokenChordLine(normalized);
};

export default {
  advancedParseChordLine
};
