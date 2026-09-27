import mongoose from 'mongoose';
const { Schema } = mongoose;

/**
 * TrustEdge — a pairwise graph edge between exactly TWO users, the same
 * idea as a Facebook friendship: one document per relationship, not per
 * group. A group of 3 people who've ridden together produces 3 separate
 * edges (A-B, A-C, B-C), never one shared document. Group-level trust
 * signals ("someone you know has ridden with this driver") are derived by
 * TRAVERSING multiple edges at query time, not by storing groups here.
 *
 * No natural key candidate — keeps the default auto-generated ObjectId _id.
 */
const trustEdgeSchema = new Schema(
  {
    userA: {
      type: String,
      ref: 'User',
      required: [true, 'userA is required'],
      // Convention: store the alphabetically/lexically smaller collegeId as
      // userA so a given pair always upserts to the same single edge,
      // regardless of which direction the relationship was first recorded from.
    },
    userB: {
      type: String,
      ref: 'User',
      required: [true, 'userB is required'],
    },
    sharedDepartment: {
      type: Boolean,
      default: false,
      // Cached at edge-creation from both users' deptId — could be computed
      // live instead, kept here for cheap reads on the match/results page.
    },
    mutualRideCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    reportFlags: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastRideAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// One edge per unordered pair — enforced by always writing userA as the
// smaller collegeId at the application layer, then relying on this unique index.
trustEdgeSchema.index({ userA: 1, userB: 1 }, { unique: true });

export default mongoose.model('TrustEdge', trustEdgeSchema);