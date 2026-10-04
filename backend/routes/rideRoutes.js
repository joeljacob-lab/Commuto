import express from 'express';
import {
  createOneOffRide,
  getMyDriverRides,
  getRideById,
  triggerDailyGeneration,
  searchRides,
  completeRide
} from '../controllers/rideController.js';

import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// Driver endpoints
router.post('/', requireRole('driver'), createOneOffRide);
router.get('/my', requireRole('driver'), getMyDriverRides);
router.post('/generate-daily', triggerDailyGeneration);

// Rider Search Endpoint (Must be BEFORE /:id)
router.get('/search', searchRides);

// General ride details
router.get('/:id', getRideById);

router.put('/:id/complete', requireRole('driver'), completeRide);

export default router;