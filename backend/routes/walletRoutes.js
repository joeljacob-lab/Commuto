import express from 'express';
import { getMyWallet, topUpWallet, withdrawFunds } from '../controllers/walletController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/balance', getMyWallet);
router.get('/me', getMyWallet);
router.post('/topup', topUpWallet);
router.post('/withdraw', withdrawFunds);

export default router;