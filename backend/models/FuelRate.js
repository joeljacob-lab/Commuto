const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * FuelRate — append-only log of platform-wide fuel price updates.
 * IMPORTANT: setting a new rate should always INSERT a new document,
 * never overwrite the previous one — Rides snapshot whichever rate was
 * "current" at their creation time, and that history must stay intact
 * for past rides to keep showing the price actually used.
 *
 * No natural key candidate — a rate has no external identity of its own,
 * so this keeps the default auto-generated ObjectId _id.
 */
const fuelRateSchema = new Schema(
  {
    pricePerLitre: {
      type: Number,
      required: [true],
      min: [0],
    },
    effectiveDate: {
      type: Date,
      required: [true, 'Effective date is required'],
      default: Date.now,
    },
    setBy: {
      type: String,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Descending index so "fetch the current/latest rate" is a fast, single-row lookup:
// FuelRate.findOne().sort({ effectiveDate: -1 })
fuelRateSchema.index({ effectiveDate: -1 });

module.exports = mongoose.model('FuelRate', fuelRateSchema);