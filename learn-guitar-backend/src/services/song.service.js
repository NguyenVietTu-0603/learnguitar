import slugify from 'slugify';

import AppError from '../exceptions/AppError.js';
import Song from '../models/Song.model.js';
import Chord from '../models/Chord.model.js';
import SongChordUsage from '../models/SongChordUsage.model.js';
import { advancedParseChordLine } from '../utils/chordParser.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

const parseAllSections = (sections = []) => {
  return sections.map((section) => ({
    ...section,
    lines: (section.lines || []).map((line) => {
      const parsed = advancedParseChordLine(line.chordsLine || line.text || '');
      return {
        text: parsed.text || line.text,
        chordsLine: line.chordsLine,
        words: parsed.words || [],
        chords: parsed.chords || [],
      };
    }),
  }));
};

const normalizeChordName = (value = '') => value.trim().toLowerCase();

const collectChordOccurrences = (sections = []) => {
  const occurrences = [];
  let positionInSong = 0;

  sections.forEach((section) => {
    (section.lines || []).forEach((line) => {
      (line.chords || []).forEach((chordItem) => {
        occurrences.push({ positionInSong, chord: chordItem.chord });
        positionInSong += 1;
      });
    });
  });

  return occurrences;
};

const refreshChordStats = async (chordIds = []) => {
  const uniqueChordIds = [...new Set(chordIds.map(String))];
  if (!uniqueChordIds.length) return;

  await Promise.all(
    uniqueChordIds.map(async (chordId) => {
      const usageCount = await SongChordUsage.countDocuments({ chordId });
      await Chord.findByIdAndUpdate(chordId, { usageCount, popularity: usageCount });
    })
  );
};

const syncSongChordUsages = async (songId, sections) => {
  const occurrences = collectChordOccurrences(sections);
  const uniqueChords = [...new Set(occurrences.map((item) => item.chord))];
  const chordSlugCandidates = uniqueChords.map((item) => slugify(item, { lower: true, strict: true }));

  const chords = await Chord.find({
    $or: [
      { name: { $in: uniqueChords } },
      { displayName: { $in: uniqueChords } },
      { slug: { $in: chordSlugCandidates } },
      { alias: { $in: uniqueChords } },
    ],
  });

  const chordMap = new Map();
  chords.forEach((chord) => {
    chordMap.set(normalizeChordName(chord.name), String(chord._id));
    chordMap.set(normalizeChordName(chord.displayName), String(chord._id));
    chordMap.set(normalizeChordName(chord.slug), String(chord._id));
    (chord.alias || []).forEach((alias) => chordMap.set(normalizeChordName(alias), String(chord._id)));
  });

  const songChordUsages = occurrences
    .map((item) => ({
      songId,
      chordId: chordMap.get(normalizeChordName(item.chord)),
      positionInSong: item.positionInSong,
    }))
    .filter((item) => Boolean(item.chordId));

  const currentUsages = await SongChordUsage.find({ songId }).select('chordId');
  const previousChordIds = currentUsages.map((item) => String(item.chordId));

  await SongChordUsage.deleteMany({ songId });
  if (songChordUsages.length > 0) {
    await SongChordUsage.insertMany(songChordUsages, { ordered: false });
  }

  await refreshChordStats([...previousChordIds, ...songChordUsages.map((item) => item.chordId)]);
};

const mapSongDataForCreate = (songData, userId) => {
  const parsedSections = parseAllSections(songData.sections || []);
  return {
    title: songData.title,
    artist: songData.artist,
    slug: slugify(songData.title, { lower: true, strict: true }),
    originalKey: songData.originalKey,
    capo: songData.capo ?? 0,
    tempo: songData.tempo ?? null,
    timeSignature: songData.timeSignature || '4/4',
    strummingPattern: songData.strummingPattern || null,
    genre: songData.genre || [],
    difficulty: songData.difficulty || 'beginner',
    tags: songData.tags || [],
    youtubeLink: songData.youtubeLink || null,
    image: songData.image || null,
    isPublic: songData.isPublic ?? true,
    sections: parsedSections,
    createdBy: userId,
  };
};

const mapSongDataForUpdate = (songData) => {
  const data = {
    title: songData.title,
    artist: songData.artist,
    originalKey: songData.originalKey,
    capo: songData.capo,
    tempo: songData.tempo,
    timeSignature: songData.timeSignature,
    strummingPattern: songData.strummingPattern,
    genre: songData.genre,
    difficulty: songData.difficulty,
    tags: songData.tags,
    youtubeLink: songData.youtubeLink,
    image: songData.image,
    isPublic: songData.isPublic,
  };

  if (songData.title) {
    data.slug = slugify(songData.title, { lower: true, strict: true });
  }
  if (songData.sections) {
    data.sections = parseAllSections(songData.sections);
  }

  Object.keys(data).forEach((key) => {
    if (data[key] === undefined) delete data[key];
  });

  return data;
};

const hydrateSong = async (songDoc) => {
  const usages = await SongChordUsage.find({ songId: songDoc._id })
    .sort({ positionInSong: 1 })
    .populate('chordId');

  const mappedSong = mapMongoDoc(songDoc);
  const mappedUsages = mapMongoDoc(usages).map((usage) => ({
    ...usage,
    chord: usage.chordId,
  }));

  return {
    ...mappedSong,
    lyrics: {
      sections: mappedSong.sections || [],
    },
    chordUsages: mappedUsages,
  };
};

export const createSong = async (songData, userId) => {
  const data = mapSongDataForCreate(songData, userId);
  const song = await Song.create(data);
  await syncSongChordUsages(song._id, song.sections || []);
  return getSongById(String(song._id));
};

export const getSongs = async (query = {}) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.max(1, Number(query.limit || 10));
  const skip = (page - 1) * limit;

  const where = { isPublic: true };
  if (query.search) {
    where.$or = [
      { title: { $regex: query.search, $options: 'i' } },
      { artist: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.difficulty) where.difficulty = query.difficulty;
  if (query.genre) where.genre = query.genre;

  const [songs, total] = await Promise.all([
    Song.find(where)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select('title artist slug originalKey difficulty views createdAt'),
    Song.countDocuments(where),
  ]);

  return {
    songs: mapMongoDoc(songs),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const getSongById = async (songId) => {
  const song = await Song.findById(songId);
  if (!song) {
    throw new AppError('Khong tim thay bai hat', 404);
  }

  return hydrateSong(song);
};

export const getSongBySlug = async (slug) => {
  const song = await Song.findOne({ slug, isPublic: true });
  if (!song) {
    throw new AppError('Khong tim thay bai hat', 404);
  }

  await Song.updateOne({ _id: song._id }, { $inc: { views: 1 } });
  const hydrated = await hydrateSong(song);
  return {
    ...hydrated,
    views: (hydrated.views || 0) + 1,
  };
};

export const getSongChordsBySlug = async (slug) => {
  const song = await Song.findOne({ slug, isPublic: true });
  if (!song) {
    throw new AppError('Khong tim thay bai hat', 404);
  }

  const usages = await SongChordUsage.find({ songId: song._id })
    .sort({ positionInSong: 1 })
    .populate('chordId');

  const dedupe = new Map();
  usages.forEach((usage) => {
    if (usage.chordId) {
      dedupe.set(String(usage.chordId._id), mapMongoDoc(usage.chordId));
    }
  });

  return {
    song: {
      id: String(song._id),
      title: song.title,
      slug: song.slug,
      artist: song.artist,
    },
    chords: Array.from(dedupe.values()),
  };
};

export const updateSong = async (songId, updateData, userId) => {
  const song = await Song.findById(songId).select('_id createdBy');
  if (!song) {
    throw new AppError('Khong tim thay bai hat', 404);
  }
  if (String(song.createdBy) !== String(userId)) {
    throw new AppError('Ban khong co quyen chinh sua bai hat nay', 403);
  }

  const mappedData = mapSongDataForUpdate(updateData);
  const updatedSong = await Song.findByIdAndUpdate(songId, mappedData, { new: true });

  if (updateData.sections) {
    await syncSongChordUsages(songId, updatedSong.sections || []);
  }

  return getSongById(songId);
};

export const deleteSong = async (songId, userId) => {
  const song = await Song.findById(songId).select('_id createdBy');
  if (!song) {
    throw new AppError('Khong tim thay bai hat', 404);
  }
  if (String(song.createdBy) !== String(userId)) {
    throw new AppError('Ban khong co quyen xoa bai hat nay', 403);
  }

  const oldUsages = await SongChordUsage.find({ songId }).select('chordId');
  await SongChordUsage.deleteMany({ songId });
  await Song.deleteOne({ _id: songId });

  await refreshChordStats(oldUsages.map((item) => String(item.chordId)));

  return { message: 'Da xoa bai hat thanh cong' };
};

export default {
  createSong,
  getSongs,
  getSongBySlug,
  getSongChordsBySlug,
  updateSong,
  deleteSong,
};
