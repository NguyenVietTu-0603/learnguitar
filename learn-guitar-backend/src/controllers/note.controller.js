import { successResponse } from '../utils/apiResponse.js';
import noteService from '../services/note.service.js';
import {
  noteListQuerySchema,
  randomNoteQuerySchema,
  fretPositionQuerySchema,
  createNoteBodySchema,
} from '../validators/module.validator.js';

export const getNotes = async (req, res, next) => {
  try {
    const query = noteListQuerySchema.parse(req.query);
    const result = await noteService.getNotes(query);

    return successResponse(res, {
      data: result.notes,
      meta: {
        pagination: result.pagination,
      },
    });
  } catch (error) {
    return next(error);
  }
};

export const getRandomNotes = async (req, res, next) => {
  try {
    const query = randomNoteQuerySchema.parse(req.query);
    const items = await noteService.getRandomNotes(query);

    return successResponse(res, {
      data: items,
    });
  } catch (error) {
    return next(error);
  }
};

export const getNoteFretboardById = async (req, res, next) => {
  try {
    const result = await noteService.getNoteFretboardById(req.params.noteId);
    return successResponse(res, {
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const getNoteByFretPosition = async (req, res, next) => {
  try {
    const query = fretPositionQuerySchema.parse(req.query);
    const result = await noteService.getNoteByFretPosition(query);

    return successResponse(res, {
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};

export const createNote = async (req, res, next) => {
  try {
    const payload = createNoteBodySchema.parse(req.body || {});
    const result = await noteService.createNote(payload);

    return successResponse(res, {
      statusCode: 201,
      message: 'Tạo nốt nhạc thành công.',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
