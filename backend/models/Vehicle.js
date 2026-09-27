import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * Vehicle — _id is the registration number, normalized (uppercase, no
 * spaces/hyphens) before it's saved so "KL 07 AB 1234" and "kl-07-ab-1234"
 * resolve to the same key: "KL07AB1234".
 *
 * Known trade-off (see Commuto_Master_Spec.md §6.3): a registration number
 * can theoretically be reassigned in the real world, which a mutable _id
 * would handle better. Acceptable for a single-college academic project.
 */
const vehicleSchema = new Schema(
  {
    _id: {
      type: String,
      required: [true, 'Registration number is required'],
    },
    ownerId: {
      type: String,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['car', 'bike'],
      required: [true, 'Vehicle type is required'],
    },
    color: {
      type: String,
      trim: true,
      default: null,
    },
    seats: {
      type: Number,
      required: [true, 'Seat count is required'],
      min: [1, 'at least 1 passenger seat'],
    },
    mileageKmpl: {
      type: Number,
      required: [true, 'Mileage (km/l) is required'],
      min: [1],
    },
    documentUrls: {
      type: [String],
      required: true,
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'At least one document (RC/insurance) must be uploaded',
      },
    },
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    verifiedBy: {
      type: String,
      ref: 'User',
      default: null,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

vehicleSchema.index({ ownerId: 1 });

// Normalize the registration number into the _id before first save.
// This is the single place the normalization rule lives — controllers
// should NOT re-implement this logic, just pass the raw user input in.
vehicleSchema.pre('save', function () {
  if (this.isNew && this._id) {
    this._id = this._id.toUpperCase().replace(/\s|-/g, '');
  }
});

export default mongoose.model('Vehicle', vehicleSchema);