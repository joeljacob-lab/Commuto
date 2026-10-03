import express from 'express';
import { getMyWallet, topUpWallet } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

// Supports /balance (and keeps /me as an alias so nothing breaks)
router.get('/balance', getMyWallet);
router.get('/me', getMyWallet);

router.post('/topup', topUpWallet);

export default router;