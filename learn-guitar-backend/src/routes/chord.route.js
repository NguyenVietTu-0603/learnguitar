import express from 'express';
import {
    createChord,
    deleteChord,
    getChordBySlug,
    getChords,
    getSongsByChordSlug,
    updateChord,
} from  '../controllers/chord.controller.js';

const router = express.Router();

router.get('/', getChords);
router.post('/', createChord);

router.get('/:slug/songs', getSongsByChordSlug);
router.get('/:slug', getChordBySlug);
router.put('/:id', updateChord);
router.delete('/:id', deleteChord);

export default router;