import express from 'express';
import { createReview, getUserReviews } from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createReview);
router.get('/user/:userId', getUserReviews);

export default router;