import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * RoutePool — a driver's standing recurring weekly commute. Daily `Ride`
 * documents are generated FROM this by the Phase 7 scheduled job; nothing
 * about cost is stored here (see Commuto_Master_Spec.md §7.2) — only the
 * fixed, route-based `distanceKm`.
 *
 * No natural key candidate — a pool has no external identity of its own,
 * so this keeps the default auto-generated ObjectId _id.
 */

// Reusable GeoJSON Point sub-schema: { type: 'Point', coordinates: [lng, lat] }
// GeoJSON order is [longitude, latitude] — NOT [lat, lng]. Easy mistake, watch for it
// in every controller that builds one of these from Maps API results.
const geoPointSchema = new Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number], // [lng, lat]
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

const routePoolSchema = new Schema(
  {
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
    origin: {
      type: namedPointSchema,
      required: [true, 'Origin is required'],
    },
    destination: {
      type: namedPointSchema,
      required: [true, 'Destination is required'],
    },
    routePolyline: {
      // GeoJSON LineString — the ordered path from the Maps API response
      type: {
        type: String,
        enum: ['LineString'],
        default: 'LineString',
      },
      coordinates: {
        type: [[Number]], // array of [lng, lat] pairs
        required: [true, 'Route polyline is required'],
      },
    },
    recurrenceDays: {
      type: [String],
      enum: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one recurrence day is required',
      },
    },
    departureWindowStart: {
      type: String, // "HH:mm"
      required: [true, 'Departure window start is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'departureWindowStart must be in HH:mm format'],
    },
    departureWindowEnd: {
      type: String, // "HH:mm"
      required: [true, 'Departure window end is required'],
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'departureWindowEnd must be in HH:mm format'],
    },
    distanceKm: {
      type: Number,
      required: [true, 'Distance is required'],
      min: [0.1, 'Distance must be greater than 0'],
    },
    maxMembers: {
      type: Number,
      required: [true, 'Max members is required'],
      min: [1, 'Max members must be at least 1'],
      // NOTE: controllers must enforce maxMembers <= vehicle.seats at creation
      // time — Mongoose alone can't validate across two different documents.
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'ended'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

routePoolSchema.index({ driverId: 1 });
routePoolSchema.index({ status: 1 });
routePoolSchema.index({ 'origin.point': '2dsphere' });
routePoolSchema.index({ 'destination.point': '2dsphere' });

export default mongoose.model('RoutePool', routePoolSchema);