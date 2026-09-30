import express from 'express';
import {
  createRoutePool,
  getMyRoutePools,
  toggleRoutePoolStatus,
  deleteRoutePool,
} from '../controllers/routePoolController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(requireRole('driver'));

router.post('/', createRoutePool);
router.get('/my', getMyRoutePools);
router.put('/:id/status', toggleRoutePoolStatus);
router.delete('/:id', deleteRoutePool);

export default router;