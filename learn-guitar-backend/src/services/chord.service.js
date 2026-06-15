import slugify from 'slugify';

import AppError from '../exceptions/AppError.js';
import Chord from '../models/Chord.model.js';
import SongChordUsage from '../models/SongChordUsage.model.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

const parsePage = (query = {}) => {
  const page = Math.max(1, Number(query.page || 1));
  const limit = Math.min(50, Math.max(1, Number(query.limit || 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

const mapChordWithSongs = async (chordDoc) => {
  const usages = await SongChordUsage.find({ chordId: chordDoc._id })
    .sort({ createdAt: -1 })
    .populate('songId');

  const mappedChord = mapMongoDoc(chordDoc);
  const mappedUsages = mapMongoDoc(usages)
    .map((usage) => ({ ...usage, song: usage.songId }))
    .filter((usage) => usage.song);

  return {
    ...mappedChord,
    songUsages: mappedUsages,
  };
};

export const createChord = async (chordData) => {
  const slug = slugify(chordData.name, { lower: true, strict: true });
  const chord = await Chord.create({
    ...chordData,
    slug,
    alias: chordData.alias || [],
    notes: chordData.notes || [],
    tags: chordData.tags || [],
    fingers: chordData.fingers || [],
  });

  return mapMongoDoc(chord);
};

export const getChordBySlug = async (slug) => {
  const chord = await Chord.findOne({ slug });
  if (!chord) {
    throw new AppError('Khong tim thay hop am', 404);
  }

  return mapChordWithSongs(chord);
};

export const getChords = async (query = {}) => {
  const { page, limit, skip } = parsePage(query);
  const where = {};

  if (query.search) {
    where.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { displayName: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.difficulty) where.difficulty = query.difficulty;
  if (query.category) where.category = query.category;

  const [chords, total] = await Promise.all([
    Chord.find(where)
      .sort({ popularity: -1, usageCount: -1, name: 1 })
      .skip(skip)
      .limit(limit),
    Chord.countDocuments(where),
  ]);

  return {
    chords: mapMongoDoc(chords),
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export const updateChord = async (chordId, updateData) => {
  const data = { ...updateData };
  if (updateData.name) {
    data.slug = slugify(updateData.name, { lower: true, strict: true });
  }

  const chord = await Chord.findByIdAndUpdate(chordId, data, { new: true });
  if (!chord) {
    throw new AppError('Khong tim thay hop am', 404);
  }

  return mapMongoDoc(chord);
};

export const deleteChord = async (chordId) => {
  const chord = await Chord.findById(chordId);
  if (!chord) {
    throw new AppError('Khong tim thay hop am', 404);
  }

  await SongChordUsage.deleteMany({ chordId: chord._id });
  await Chord.deleteOne({ _id: chord._id });

  return { message: 'Da xoa hop am thanh cong' };
};

export const getSongsByChordSlug = async (slug, query = {}) => {
  const { page, limit, skip } = parsePage(query);

  const chord = await Chord.findOne({ slug });
  if (!chord) {
    throw new AppError('Khong tim thay hop am', 404);
  }

  const [usages, total] = await Promise.all([
    SongChordUsage.find({ chordId: chord._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('songId'),
    SongChordUsage.countDocuments({ chordId: chord._id }),
  ]);

  const songs = mapMongoDoc(usages)
    .map((usage) => usage.songId)
    .filter(Boolean);

  return {
    chord: {
      id: String(chord._id),
      name: chord.name,
      slug: chord.slug,
      displayName: chord.displayName,
    },
    songs,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
};

export default {
  createChord,
  getChordBySlug,
  getChords,
  updateChord,
  deleteChord,
  getSongsByChordSlug,
};
