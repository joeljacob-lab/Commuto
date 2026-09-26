const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * User — _id is the collegeId (roll/admission number), set explicitly at
 * registration, not an auto ObjectId.
 *
 * Deliberately NOT included (see Commuto_Master_Spec.md §6.2 for reasoning):
 *  - verificationLevel: registration is already gated by college-domain
 *    email + OTP, so every existing user is verified by construction.
 *  - rating / ratingCount: rating is a DERIVED value, computed on demand
 *    via aggregation over the Review collection (AVG rating WHERE
 *    toUserId = this user), never cached here.
 */
const userSchema = new Schema(
  {
    _id: {
      type: String,
      trim: true,
      required: [true, 'College ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true,
    },
    deptId: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      required: [true, 'Department is required'],
    },
    year: {
      type: Number,
      required: [true, 'Year/semester is required'],
      min: 1,
    },
    roles: {
      type: [String],
      enum: ['rider', 'driver', 'admin'],
      default: ['rider'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: 'A user must have at least one role',
      },
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    profileImageUrl: {
      type: String,
      default: null,
    },
    emergencyContactName: {
      type: String,
      default: null,
      trim: true,
    },
    emergencyContactPhone: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    _id: false,
    timestamps: true,
  }
);

userSchema.index({ deptId: 1 });

module.exports = mongoose.model('User', userSchema);