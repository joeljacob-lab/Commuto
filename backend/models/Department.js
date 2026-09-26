const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Department — small, mostly-static lookup table.
 * _id is the default auto-generated MongoDB ObjectId.
 * `deptName` (e.g. "CSE", "MCA") is the human-readable identifier, kept as
 * its own unique field rather than as the primary key — used for display
 * and lookups, but User.deptId references the ObjectId _id, not this code.
 */
const departmentSchema = new Schema(
  {
    deptName: {
      type: String,
      required: [true, 'Department name is required'],
      trim: true,
    },
    programName: {
      type: String,
      required: [true, 'Program name is required'],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Department', departmentSchema);