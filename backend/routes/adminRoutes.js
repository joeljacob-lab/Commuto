import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';
import { getPlatformStats, getAllUsers } from '../controllers/adminController.js';

const router = express.Router();

// All routes here require valid JWT and 'admin' role
router.use(protect);
router.use(requireRole('admin'));

router.get('/stats', getPlatformStats);
router.get('/users', getAllUsers);

export default router;