import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { createBooking, cancelBooking, getMyBookings } from '../controllers/bookingController.js';

const router = express.Router();

router.use(protect); // All booking routes require authentication

router.post('/ride/:id', createBooking);
router.put('/:id/cancel', cancelBooking);
router.get('/my-bookings', getMyBookings);

export default router;