import AppError from '../exceptions/AppError.js';
import Note from '../models/Note.model.js';
import NoteFretPosition from '../models/NoteFretPosition.model.js';
import { toPagination } from '../utils/pagination.js';
import { mapMongoDoc } from '../utils/mongoMapper.js';

export const getNotes = async (query) => {
  const { page, limit, skip } = toPagination(query);
  const where = {};

  if (query.name) {
    where.$or = [
      { canonicalName: new RegExp(`^${query.name}$`, 'i') },
      { enharmonicNames: query.name },
    ];
  }
  if (typeof query.octave === 'number') {
    where.octave = query.octave;
  }

  const [total, notes] = await Promise.all([
    Note.countDocuments(where),
    Note.find(where).sort({ midiNumber: 1 }).skip(skip).limit(limit),
  ]);

  const noteIds = notes.map((item) => item._id);
  const positions = await NoteFretPosition.find({ noteId: { $in: noteIds } }).sort({ stringNumber: 1, fret: 1 });
  const mappedPositions = mapMongoDoc(positions);

  const items = mapMongoDoc(notes).map((note) => ({
    ...note,
    fretPositions: mappedPositions.filter((item) => item.noteId === note.id),
  }));

  return {
    notes: items,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit) || 1,
    },
  };
};

export const getNoteFretboardById = async (noteId) => {
  const note = await Note.findById(noteId);
  if (!note) {
    throw new AppError('Không tìm thấy nốt nhạc.', 404);
  }

  const positions = await NoteFretPosition.find({ noteId: note._id }).sort({ stringNumber: 1, fret: 1 });

  return {
    noteId: String(note._id),
    note: `${note.canonicalName}${note.octave}`,
    positions: mapMongoDoc(positions).map((item) => ({
      stringNumber: item.stringNumber,
      fret: item.fret,
    })),
  };
};

export const getNoteByFretPosition = async ({ stringNumber, fret }) => {
  const position = await NoteFretPosition.findOne({ stringNumber, fret }).populate('noteId');
  if (!position || !position.noteId) {
    throw new AppError('Không tìm thấy nốt tại vị trí cần đàn này.', 404);
  }

  const note = position.noteId;
  return {
    stringNumber,
    fret,
    note: {
      id: String(note._id),
      canonicalName: note.canonicalName,
      enharmonicNames: note.enharmonicNames,
      octave: note.octave,
      midiNumber: note.midiNumber,
      frequencyHz: note.frequencyHz,
      audioUrl: note.audioUrl,
    },
  };
};

const randomMidiRangeByLevel = {
  beginner: { min: 40, max: 64 },
  intermediate: { min: 40, max: 76 },
  advanced: { min: 28, max: 88 },
};

export const getRandomNotes = async ({ count, level }) => {
  const range = randomMidiRangeByLevel[level] || randomMidiRangeByLevel.intermediate;
  const pool = await Note.find({ midiNumber: { $gte: range.min, $lte: range.max } });
  const shuffled = mapMongoDoc(pool).sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const createNote = async (payload) => {
  const note = await Note.create({
    canonicalName: payload.canonicalName,
    enharmonicNames: payload.enharmonicNames || [],
    octave: payload.octave,
    frequencyHz: payload.frequencyHz,
    midiNumber: payload.midiNumber,
    audioUrl: payload.audioUrl,
  });

  if (payload.fretPositions?.length) {
    await NoteFretPosition.insertMany(
      payload.fretPositions.map((item) => ({
        noteId: note._id,
        stringNumber: item.stringNumber,
        fret: item.fret,
      }))
    );
  }

  return getNoteFretboardById(String(note._id));
};

export default {
  getNotes,
  getNoteFretboardById,
  getNoteByFretPosition,
  getRandomNotes,
  createNote,
};
