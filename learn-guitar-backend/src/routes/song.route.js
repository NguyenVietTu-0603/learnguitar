// src\routes\song.route.js
import express from 'express';
import { 
  createSong, 
  getSongs, 
  getSongChordsBySlug,
  getSongBySlug, 
  updateSong, 
  deleteSong 
} from '../controllers/song.controller.js';

import { protect } from '../middleware/auth.middleware.js';   // Sau này sẽ tạo

const router = express.Router();

// Public routes
router.get('/', getSongs);                    // GET /api/v1/songs
router.get('/:slug/chords', getSongChordsBySlug); // GET /api/v1/songs/:slug/chords
router.get('/:slug', getSongBySlug);          // GET /api/v1/songs/em-oi-ha-noi-pho

// Protected routes (cần đăng nhập)
router.post('/', protect, createSong);        // POST /api/v1/songs
router.put('/:id', protect, updateSong);      // PUT /api/v1/songs/:id
router.delete('/:id', protect, deleteSong);   // DELETE /api/v1/songs/:id

export default router;