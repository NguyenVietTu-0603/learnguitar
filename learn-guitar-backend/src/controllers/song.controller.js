// src\controllers\song.controller.js
import songService from '../services/song.service.js';
import {
  SongListResponseDto,
  SongResponseDto,
  validateCreateSongDto,
  validateUpdateSongDto
} from '../dtos/song.dto.js';
import AppError from '../exceptions/AppError.js';
import { successResponse } from '../utils/apiResponse.js';

/**
 * Tạo bài hát mới
 */
export const createSong = async (req, res, next) => {
  try {
    const validation = validateCreateSongDto(req.body);
    if (!validation.isValid) {
      throw new AppError('Du lieu tao bai hat khong hop le', 400, validation.errors);
    }

    const song = await songService.createSong(req.body, req.user.id);

    return successResponse(res, {
      statusCode: 201,
      message: 'Tao bai hat thanh cong',
      data: SongResponseDto(song)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách bài hát
 */
export const getSongs = async (req, res, next) => {
  try {
    const result = await songService.getSongs(req.query);

    return successResponse(res, {
      statusCode: 200,
      data: SongListResponseDto(result.songs, result.pagination).data,
      meta: {
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy chi tiết bài hát theo slug
 */
export const getSongBySlug = async (req, res, next) => {
  try {
    const song = await songService.getSongBySlug(req.params.slug);

    return successResponse(res, {
      statusCode: 200,
      data: SongResponseDto(song)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Lấy danh sách hợp âm của bài hát theo slug
 */
export const getSongChordsBySlug = async (req, res, next) => {
  try {
    const result = await songService.getSongChordsBySlug(req.params.slug);

    return successResponse(res, {
      statusCode: 200,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Cập nhật bài hát
 */
export const updateSong = async (req, res, next) => {
  try {
    const validation = validateUpdateSongDto(req.body);
    if (!validation.isValid) {
      throw new AppError('Du lieu cap nhat bai hat khong hop le', 400, validation.errors);
    }

    const song = await songService.updateSong(req.params.id, req.body, req.user.id);

    return successResponse(res, {
      statusCode: 200,
      message: 'Cap nhat bai hat thanh cong',
      data: SongResponseDto(song)
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Xóa bài hát
 */
export const deleteSong = async (req, res, next) => {
  try {
    const result = await songService.deleteSong(req.params.id, req.user.id);

    return successResponse(res, {
      statusCode: 200,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
};