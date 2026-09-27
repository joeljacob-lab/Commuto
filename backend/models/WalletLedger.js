import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * WalletLedger — append-only audit trail for every wallet movement
 * (top-ups, holds, releases, forfeits, payouts, withdrawals). Kept as its
 * own collection rather than only mutating User.walletBalance so every
 * rupee is traceable — never update or delete a row here, only insert.
 *
 * No natural key candidate — keeps the default auto-generated ObjectId _id.
 */
const walletLedgerSchema = new Schema(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User is required'],
    },
    bookingId: {
      type: Schema.Types.ObjectId,
      ref: 'Booking',
      default: null, // null for top-ups/withdrawals, which aren't tied to a booking
    },
    type: {
      type: String,
      enum: ['topup', 'hold', 'release', 'forfeit', 'payout', 'withdrawal'],
      required: [true, 'Transaction type is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount must be positive'],
    },
    balanceAfter: {
      type: Number,
      required: [true, 'Balance-after snapshot is required'],
      // Recorded at write time for audit purposes — lets you reconstruct a
      // full statement without recomputing running totals later.
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

walletLedgerSchema.index({ userId: 1, createdAt: -1 });
walletLedgerSchema.index({ bookingId: 1 });

export default mongoose.model('WalletLedger', walletLedgerSchema);