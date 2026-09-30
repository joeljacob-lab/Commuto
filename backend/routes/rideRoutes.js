import express from 'express';
import {
  createOneOffRide,
  getMyDriverRides,
  getRideById,
  triggerDailyGeneration,
} from '../controllers/rideController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// Driver endpoints
router.post('/', requireRole('driver'), createOneOffRide);
router.get('/my', requireRole('driver'), getMyDriverRides);
router.post('/generate-daily', triggerDailyGeneration);

// General ride details
router.get('/:id', getRideById);

export default router;