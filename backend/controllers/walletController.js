import User from '../models/User.js';
import WalletLedger from '../models/WalletLedger.js';

// @desc    Get logged-in user's wallet balance & transaction history
// @route   GET /api/wallet/me
// @access  Authenticated
export const getMyWallet = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('walletBalance name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Fetch append-only audit history, latest first
    const transactions = await WalletLedger.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      walletBalance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Top-up wallet balance (Mock UPI / Card Gateway)
// @route   POST /api/wallet/topup
// @access  Authenticated
export const topUpWallet = async (req, res, next) => {
  try {
    const { amount, paymentMethod } = req.body;
    const topUpAmount = Number(amount);

    if (!topUpAmount || topUpAmount <= 0) {
      return res.status(400).json({ message: 'Please enter a valid positive amount' });
    }

    if (topUpAmount > 5000) {
      return res.status(400).json({ message: 'Single top-up limit is ₹5,000 for college safety' });
    }

    // 1. Atomically increment spendable balance
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $inc: { walletBalance: topUpAmount } },
      { new: true, runValidators: true }
    ).select('walletBalance');

    // 2. Record append-only audit trail in WalletLedger
    const ledgerEntry = await WalletLedger.create({
      userId: req.user._id,
      bookingId: null, // null for direct topups (not tied to a booking)
      type: 'topup',
      amount: topUpAmount,
      balanceAfter: user.walletBalance,
    });

    res.status(200).json({
      message: `Successfully added ₹${topUpAmount} via ${paymentMethod || 'UPI'}`,
      walletBalance: user.walletBalance,
      transaction: ledgerEntry,
    });
  } catch (error) {
    next(error);
  }
};