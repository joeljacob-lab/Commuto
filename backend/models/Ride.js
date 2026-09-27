import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Ride — one day's actual trip, generated from a RoutePool by the Phase 7
 * scheduled job (or created as a one-off with routePoolId = null).
 *
 * Cost is NEVER a flat stored fare — estimatedCostPerHead is a live
 * pre-lock figure, costPerHeadFinal is set once at rosterLockAt using the
 * formula in Commuto_Master_Spec.md §7.2:
 *
 *   dailyTripCost = (distanceKm / vehicle.mileageKmpl) * fuelPricePerLitreUsed
 *   costPerHead   = dailyTripCost / confirmedHeadcount
 *
 * No natural key candidate — keeps the default auto-generated ObjectId _id.
 *
 * NOTE: geoPointSchema/namedPointSchema are duplicated here from
 * RoutePool.js for now since each model file is self-contained per our
 * folder structure. If this duplication gets annoying, consider extracting
 * both into a shared `models/shared/geoSchemas.js` later — not required
 * for Phase 1.
 */

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat] — GeoJSON order, not [lat, lng]
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length === 2,
        message: 'Coordinates must be [longitude, latitude]',
      },
    },
  },
  { _id: false }
);

const namedPointSchema = new Schema(
  {
    label: {
      type: String,
      required: true,
      trim: true,
    },
    point: {
      type: geoPointSchema,
      required: true,
    },
  },
  { _id: false }
);

const rideSchema = new Schema(
  {
    routePoolId: {
      type: Schema.Types.ObjectId,
      ref: 'RoutePool',
      default: null, // null = one-off ride, not generated from a recurring pool
    },
    driverId: {
      type: String,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    vehicleId: {
      type: String,
      ref: 'Vehicle',
      required: [true, 'Vehicle is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    departureTime: {
      type: String, // "HH:mm" — the actual time for this specific day
      required: [true, 'Departure time is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'departureTime must be in HH:mm format'],
    },
    origin: {
      type: namedPointSchema,
      required: [true, 'Origin is required'],
    },
    destination: {
      type: namedPointSchema,
      required: [true, 'Destination is required'],
    },
    routePolyline: {
      type: {
        type: String,
        enum: ['LineString'],
        default: 'LineString',
      },
      coordinates: {
        type: [[Number]],
        required: [true, 'Route polyline is required'],
      },
    },
    boardingPoints: {
      type: [namedPointSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one boarding point is required',
      },
    },
    availableSeats: {
      type: Number,
      required: true,
      min: [0, 'Available seats cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: true,
      min: [1, 'Total seats must be at least 1'],
    },
    fuelPricePerLitreUsed: {
      type: Number,
      required: [true, 'Fuel price snapshot is required'],
      min: 0,
      // Snapshotted from FuelRate at generation time — frozen so this ride's
      // historical cost never silently changes if the platform rate updates later.
    },
    estimatedCostPerHead: {
      type: Number,
      required: true,
      min: 0,
      // Live, pre-lock estimate — recalculated as headcount changes before rosterLockAt.
    },
    rosterLockAt: {
      type: Date,
      required: [true, 'Roster lock time is required'],
      // The single timestamp that both freezes the headcount AND is the
      // cutoff deciding refund vs. forfeit on a booking cancellation
      // (see Commuto_Master_Spec.md §7.3).
    },
    costLocked: {
      type: Boolean,
      default: false,
    },
    costPerHeadFinal: {
      type: Number,
      default: null,
      min: 0,
      // Set exactly once, by the Phase 9 roster lock job, at rosterLockAt.
    },
    status: {
      type: String,
      enum: ['published', 'booking', 'full', 'started', 'completed', 'cancelled'],
      default: 'published',
    },
  },
  {
    timestamps: true,
  }
);

rideSchema.index({ driverId: 1 });
rideSchema.index({ date: 1, status: 1 });
rideSchema.index({ 'origin.point': '2dsphere' });

export default mongoose.model('Ride', rideSchema);