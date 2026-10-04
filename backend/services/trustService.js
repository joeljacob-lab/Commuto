import TrustEdge from '../models/TrustEdge.js';
import User from '../models/User.js';

/**
 * Normalizes two college IDs into canonical [userA, userB] where userA < userB.
 * Guarantees exactly one TrustEdge document per student pair.
 */
export const getCanonicalPair = (id1, id2) => {
  return [id1, id2].sort();
};

/**
 * Updates or creates a pairwise TrustEdge between two students after a shared ride.
 */
export const recordMutualRide = async (userId1, userId2, session) => {
  if (userId1 === userId2) return null;

  const [userA, userB] = getCanonicalPair(userId1, userId2);

  let edge = await TrustEdge.findOne({ userA, userB }).session(session);

  if (!edge) {
    // Look up both users to check if they share a department
    const [userADoc, userBDoc] = await Promise.all([
      User.findById(userA).select('deptId').session(session),
      User.findById(userB).select('deptId').session(session),
    ]);

    const sharedDepartment = Boolean(
      userADoc?.deptId &&
      userBDoc?.deptId &&
      userADoc.deptId.toString() === userBDoc.deptId.toString()
    );

    edge = new TrustEdge({
      userA,
      userB,
      sharedDepartment,
      mutualRideCount: 1,
      lastRideAt: new Date(),
    });
  } else {
    edge.mutualRideCount += 1;
    edge.lastRideAt = new Date();
  }

  await edge.save({ session });
  return edge;
};

/**
 * Records mutual rides between the driver and all confirmed passengers on ride completion.
 */
export const recordCompletedRideTrust = async (driverId, passengerIds, session) => {
  for (const passengerId of passengerIds) {
    if (passengerId && passengerId !== driverId) {
      await recordMutualRide(driverId, passengerId, session);
    }
  }
};

/**
 * Increments report flags on a trust edge if a complaint is filed between two users.
 */
export const recordReportFlag = async (reporterId, reportedId, session) => {
  if (reporterId === reportedId) return null;

  const [userA, userB] = getCanonicalPair(reporterId, reportedId);
  let edge = await TrustEdge.findOne({ userA, userB }).session(session);

  if (!edge) {
    const [userADoc, userBDoc] = await Promise.all([
      User.findById(userA).select('deptId').session(session),
      User.findById(userB).select('deptId').session(session),
    ]);

    const sharedDepartment = Boolean(
      userADoc?.deptId &&
      userBDoc?.deptId &&
      userADoc.deptId.toString() === userBDoc.deptId.toString()
    );

    edge = new TrustEdge({
      userA,
      userB,
      sharedDepartment,
      reportFlags: 1,
    });
  } else {
    edge.reportFlags += 1;
  }

  await edge.save({ session });
  return edge;
};

/**
 * Fetches the pairwise trust edge between two users (useful for search matching & profile views).
 */
export const getPairTrust = async (userId1, userId2) => {
  const [userA, userB] = getCanonicalPair(userId1, userId2);
  return await TrustEdge.findOne({ userA, userB }).lean();
};