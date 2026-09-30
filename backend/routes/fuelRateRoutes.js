import express from 'express';
import {
  getCurrentFuelRate,
  getFuelRateHistory,
  setFuelRate,
} from '../controllers/fuelRateController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

// Any logged-in user can check the current fuel rate for transparency
router.get('/current', protect, getCurrentFuelRate);

// Admin-only endpoints
router.get('/history', protect, requireRole('admin'), getFuelRateHistory);
router.post('/', protect, requireRole('admin'), setFuelRate);

export default router;