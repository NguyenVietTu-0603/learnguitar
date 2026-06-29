import express from 'express';
import { getAdminStats } from '../controllers/admin.controller.js';
import { listUsers, getUserById, updateUser, deleteUser } from '../controllers/userManagement.controller.js';
import { protect, authorize } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(protect, authorize('admin'));

router.get('/stats', getAdminStats);
router.get('/users', listUsers);
router.get('/users/:userId', getUserById);
router.patch('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);

export default router;
