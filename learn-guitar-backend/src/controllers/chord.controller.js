import { chordResponseDto } from '../dtos/Chord.dto.js';
import {
    chordListResponseDto,
    validateCreateChordDto,
    validateUpdateChordDto
} from '../dtos/Chord.dto.js';
import chordService from '../services/chord.service.js';
import AppError from '../exceptions/AppError.js';
import { successResponse } from '../utils/apiResponse.js';

export const createChord = async (req, res, next) => {
    try {
        const validation = validateCreateChordDto(req.body);
        if (!validation.isValid) {
            throw new AppError('Du lieu tao hop am khong hop le', 400, validation.errors);
    }

        const chord = await chordService.createChord(req.body);
        return successResponse(res, {
            statusCode: 201,
            message: 'Tao hop am thanh cong',
            data: chordResponseDto(chord)
        });
    } catch (error) {
        next(error);
    }
};

export const getChordBySlug = async (req, res, next) => {
    try {
        const chord = await chordService.getChordBySlug(req.params.slug);

        return successResponse(res, {
            statusCode: 200,
            data: chordResponseDto(chord)
        });
    } catch (error) {
        next(error);
    }
};

export const getChords = async (req, res, next) => {
    try {
        const result = await chordService.getChords(req.query);

        return successResponse(res, {
            statusCode: 200,
            data: chordListResponseDto(result.chords).data,
            meta: {
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};

export const updateChord = async (req, res, next) => {
    try {
        const validation = validateUpdateChordDto(req.body);
        if (!validation.isValid) {
            throw new AppError('Du lieu cap nhat hop am khong hop le', 400, validation.errors);
        }

        const chord = await chordService.updateChord(req.params.id, req.body);

        return successResponse(res, {
            statusCode: 200,
            message: 'Cap nhat hop am thanh cong',
            data: chordResponseDto(chord)
        });
    } catch (error) {
        next(error);
    }
};

export const deleteChord = async (req, res, next) => {
    try {
        const result = await chordService.deleteChord(req.params.id);

        return successResponse(res, {
            statusCode: 200,
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

export const getSongsByChordSlug = async (req, res, next) => {
    try {
        const result = await chordService.getSongsByChordSlug(req.params.slug, req.query);

        return successResponse(res, {
            statusCode: 200,
            data: result,
            meta: {
                pagination: result.pagination
            }
        });
    } catch (error) {
        next(error);
    }
};
