import {
  isArray,
  isBoolean,
  isIn,
  isInt,
  isNotEmpty,
  isString,
  isURL,
  max,
  min
} from 'class-validator';

const DIFFICULTY = ['beginner', 'intermediate', 'advanced'];
const SECTION_TYPES = ['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'outro', 'solo', 'interlude'];

const ensureString = (value, field, errors, { minLength = 1 } = {}) => {
  if (!isString(value) || !isNotEmpty(value) || String(value).trim().length < minLength) {
    errors.push({ field, message: `${field} khong hop le` });
  }
};

const validateSections = (sections, errors) => {
  if (!isArray(sections) || sections.length === 0) {
    errors.push({ field: 'sections', message: 'sections phai la mang va khong duoc rong' });
    return;
  }

  sections.forEach((section, sectionIndex) => {
    if (!section || typeof section !== 'object') {
      errors.push({ field: `sections[${sectionIndex}]`, message: 'section khong hop le' });
      return;
    }

    if (!isIn(section.type, SECTION_TYPES)) {
      errors.push({ field: `sections[${sectionIndex}].type`, message: 'type section khong hop le' });
    }

    ensureString(section.name, `sections[${sectionIndex}].name`, errors);

    if (!isArray(section.lines) || section.lines.length === 0) {
      errors.push({ field: `sections[${sectionIndex}].lines`, message: 'lines phai la mang va khong duoc rong' });
      return;
    }

    section.lines.forEach((line, lineIndex) => {
      if (!line || typeof line !== 'object') {
        errors.push({ field: `sections[${sectionIndex}].lines[${lineIndex}]`, message: 'line khong hop le' });
        return;
      }

      ensureString(line.text, `sections[${sectionIndex}].lines[${lineIndex}].text`, errors);

      if (line.chordsLine !== undefined && !isString(line.chordsLine)) {
        errors.push({
          field: `sections[${sectionIndex}].lines[${lineIndex}].chordsLine`,
          message: 'chordsLine phai la chuoi'
        });
      }
    });
  });
};

export const validateCreateSongDto = (payload = {}) => {
  const errors = [];

  ensureString(payload.title, 'title', errors, { minLength: 3 });
  ensureString(payload.artist, 'artist', errors, { minLength: 2 });
  ensureString(payload.originalKey, 'originalKey', errors);

  if (payload.capo !== undefined && (!isInt(payload.capo) || !min(payload.capo, 0) || !max(payload.capo, 12))) {
    errors.push({ field: 'capo', message: 'capo phai la so nguyen trong khoang 0-12' });
  }

  if (payload.tempo !== undefined && (!isInt(payload.tempo) || !min(payload.tempo, 40) || !max(payload.tempo, 220))) {
    errors.push({ field: 'tempo', message: 'tempo phai la so nguyen trong khoang 40-220' });
  }

  if (payload.difficulty !== undefined && !isIn(payload.difficulty, DIFFICULTY)) {
    errors.push({ field: 'difficulty', message: 'difficulty khong hop le' });
  }

  if (payload.youtubeLink !== undefined && payload.youtubeLink !== '' && !isURL(payload.youtubeLink)) {
    errors.push({ field: 'youtubeLink', message: 'youtubeLink khong dung dinh dang URL' });
  }

  if (payload.isPublic !== undefined && !isBoolean(payload.isPublic)) {
    errors.push({ field: 'isPublic', message: 'isPublic phai la boolean' });
  }

  if (payload.genre !== undefined && !isArray(payload.genre)) {
    errors.push({ field: 'genre', message: 'genre phai la mang chuoi' });
  }

  if (payload.tags !== undefined && !isArray(payload.tags)) {
    errors.push({ field: 'tags', message: 'tags phai la mang chuoi' });
  }

  validateSections(payload.sections, errors);

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateUpdateSongDto = (payload = {}) => {
  const baseResult = validateCreateSongDto({
    ...payload,
    title: payload.title ?? 'tmp title',
    artist: payload.artist ?? 'tmp artist',
    originalKey: payload.originalKey ?? 'C',
    sections: payload.sections ?? [{ type: 'verse', name: 'tmp', lines: [{ text: 'tmp' }] }]
  });

  const ignoredFields = new Set(['title', 'artist', 'originalKey', 'sections']);
  const errors = baseResult.errors.filter((error) => {
    const rootField = error.field.split('.')[0];
    if (!ignoredFields.has(rootField)) {
      return true;
    }

    return payload[rootField] !== undefined;
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const SongResponseDto = (song) => ({
  id: song.id,
  title: song.title,
  artist: song.artist,
  slug: song.slug,
  originalKey: song.originalKey,
  capo: song.capo,
  tempo: song.tempo,
  timeSignature: song.timeSignature,
  strummingPattern: song.strummingPattern,
  difficulty: song.difficulty,
  genre: song.genre,
  tags: song.tags,
  youtubeLink: song.youtubeLink,
  image: song.image,
  views: song.views,
  isPublic: song.isPublic,
  createdAt: song.createdAt,
  updatedAt: song.updatedAt,
  lyrics: song.lyrics,
  sections: song.lyrics?.sections || [],
  chordUsages: song.chordUsages || []
});

export const SongListResponseDto = (songs = [], pagination = null) => ({
  data: songs.map((song) => ({
    id: song.id,
    title: song.title,
    artist: song.artist,
    slug: song.slug,
    originalKey: song.originalKey,
    difficulty: song.difficulty,
    views: song.views,
    createdAt: song.createdAt
  })),
  pagination
});