import express from 'express';
import { addVehicle, getMyVehicles, getPendingVehicles, updateVehicleStatus } from '../controllers/vehicleController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/', protect, requireRole('driver'), addVehicle);
router.get('/me', protect, requireRole('driver'), getMyVehicles);

// Admin routes
router.get('/pending', protect, requireRole('admin'), getPendingVehicles);
router.put('/:id/status', protect, requireRole('admin'), updateVehicleStatus);

export default router;