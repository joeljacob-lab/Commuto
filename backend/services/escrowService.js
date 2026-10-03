import User from '../models/User.js';
import WalletLedger from '../models/WalletLedger.js';

/**
 * Holds funds from a user's wallet for a provisional booking.
 * Deducts from spendable walletBalance and logs a 'hold'.
 */
export const holdFunds = async (userId, bookingId, amount, session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');
    if (user.walletBalance < amount) throw new Error('Insufficient wallet balance for this booking hold');

    user.walletBalance -= amount;
    await user.save({ session });

    await new WalletLedger({
        userId,
        bookingId,
        type: 'hold',
        amount,
        balanceAfter: user.walletBalance
    }).save({ session });

    return true;
};

/**
 * Releases previously held funds back to the user (e.g., early cancellation).
 */
export const releaseFunds = async (userId, bookingId, amount, session) => {
    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    user.walletBalance += amount;
    await user.save({ session });

    await new WalletLedger({
        userId,
        bookingId,
        type: 'release',
        amount,
        balanceAfter: user.walletBalance
    }).save({ session });

    return true;
};

/**
 * Forfeits held funds to the driver (e.g., late cancellation or no-show).
 * Rider's balance is unchanged here (already deducted during hold), but logged as 'forfeit'.
 * Driver's spendable balance is credited and logged as 'payout'.
 */
export const forfeitFunds = async (riderId, driverId, bookingId, amount, session) => {
    // 1. Log forfeit for rider
    const rider = await User.findById(riderId).session(session);
    if (!rider) throw new Error('Rider not found');
    
    await new WalletLedger({
        userId: riderId,
        bookingId,
        type: 'forfeit',
        amount,
        balanceAfter: rider.walletBalance
    }).save({ session });

    // 2. Credit driver
    const driver = await User.findById(driverId).session(session);
    if (!driver) throw new Error('Driver not found');
    
    driver.walletBalance += amount;
    await driver.save({ session });

    await new WalletLedger({
        userId: driverId,
        bookingId,
        type: 'payout',
        amount,
        balanceAfter: driver.walletBalance
    }).save({ session });

    return true;
};
/**
 * Processes the cost difference at roster lock. 
 * Since provisional hold is optimistic (full car), final cost is often higher.
 * We deduct the difference. If balance goes negative, it acts as an IOU (overdraft allowed for college trust network).
 */
export const processLockDelta = async (userId, bookingId, additionalAmountRequired, session) => {
    if (additionalAmountRequired <= 0) return true;

    const user = await User.findById(userId).session(session);
    if (!user) throw new Error('User not found');

    // Deduct the extra required amount
    user.walletBalance -= additionalAmountRequired;
    await user.save({ session });

    await new WalletLedger({
        userId,
        bookingId,
        type: 'hold',
        amount: additionalAmountRequired,
        balanceAfter: user.walletBalance
    }).save({ session });

    return true;
};