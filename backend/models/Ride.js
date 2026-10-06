import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Ride — one day's actual trip, generated from a RoutePool by the Phase 7
 * scheduled job (or created as a one-off with routePoolId = null).
 */

const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat] — GeoJSON order
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
      default: null,
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
      required: [true, 'Ride date is required'],
    },
    departureTime: {
      type: String,
      required: [true, 'Departure time is required'],
      match: [/^([01]\d|2[0-3]):[0-5]\d$/, 'Please provide departure time in HH:mm format'],
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
        required: [true, 'Route polyline coordinates are required'],
      },
    },
    boardingPoints: {
      type: [namedPointSchema],
      default: [],
    },
    availableSeats: {
      type: Number,
      required: [true, 'Available seats is required'],
      min: [0, 'Available seats cannot be negative'],
    },
    totalSeats: {
      type: Number,
      required: [true, 'Total seats is required'],
      min: [1, 'Total seats must be at least 1'],
    },
    fuelPricePerLitreUsed: {
      type: Number,
      required: [true, 'Fuel price snapshot is required'],
      min: 0,
    },
    estimatedCostPerHead: {
      type: Number,
      required: [true, 'Estimated cost per head is required'],
      min: 0,
    },
    rosterLockAt: {
      type: Date,
      required: [true, 'Roster lock time is required'],
    },
    costLocked: {
      type: Boolean,
      default: false,
    },
    costPerHeadFinal: {
      type: Number,
      default: null,
      min: 0,
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

// Partial unique compound index: strictly prevents multiple rides for the same routePool on the same date
rideSchema.index(
  { routePoolId: 1, date: 1 },
  {
    unique: true,
    partialFilterExpression: { routePoolId: { $type: 'objectId' } },
  }
);

export default mongoose.model('Ride', rideSchema);