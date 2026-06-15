// src\validators\song.validator.js
import { z } from 'zod';

// Schema cho 1 dòng lời + hợp âm
const lineSchema = z.object({
  text: z.string().min(1, 'Nội dung dòng không được để trống'),
  chordsLine: z.string().optional(),
  // words và chords sẽ do service tự parse, không cần user gửi vào
});

// Schema cho 1 section (Verse, Chorus...)
const sectionSchema = z.object({
  type: z.enum(['intro', 'verse', 'pre-chorus', 'chorus', 'bridge', 'outro', 'solo', 'interlude']),
  name: z.string().min(1, 'Tên section không được để trống'),
  lines: z.array(lineSchema).min(1, 'Mỗi section phải có ít nhất 1 dòng'),
});

// Schema chính để tạo bài hát
export const createSongSchema = z.object({
  title: z.string().min(3, 'Tiêu đề phải có ít nhất 3 ký tự'),
  artist: z.string().min(2, 'Tên nghệ sĩ phải có ít least 2 ký tự'),
  originalKey: z.string().min(1, 'Tone gốc không được để trống'),
  capo: z.number().int().min(0).max(12).optional().default(0),
  tempo: z.number().int().min(40).max(220).optional(),
  timeSignature: z.string().default('4/4'),
  strummingPattern: z.string().optional(),
  genre: z.array(z.string()).optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
  tags: z.array(z.string()).optional(),
  youtubeLink: z.string().url().optional().or(z.literal('')),
  image: z.string().optional(),
  
  sections: z.array(sectionSchema).min(1, 'Bài hát phải có ít nhất 1 section'),
  
  isPublic: z.boolean().default(true),
});

// Schema cho cập nhật bài hát (chỉ yêu cầu những trường cần thiết)
export const updateSongSchema = createSongSchema.partial(); // cho phép cập nhật từng phần

// Schema cho lấy danh sách (query)
export const getSongsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(50).default(10),
  search: z.string().optional(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  genre: z.string().optional(),
});