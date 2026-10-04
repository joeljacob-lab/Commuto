import express from 'express';
import {
  createReport,
  getMyReports,
  getAllReports,
  updateReportStatus,
} from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { requireRole } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

// Student endpoints
router.post('/', createReport);
router.get('/my', getMyReports);

// Admin moderation queue
router.get('/', requireRole('admin'), getAllReports);
router.put('/:id/status', requireRole('admin'), updateReportStatus);

export default router;