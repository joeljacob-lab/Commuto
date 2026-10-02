import { haversineDistance } from '../utils/haversine.js';

// Helper: Convert "08:15" to total minutes from midnight (495 mins) for easy math
const timeToMins = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Helper: Finds the closest point on the driver's road polyline to the rider's location
const findClosestPointOnPolyline = (pointCoords, polylineCoords) => {
  let minDistance = Infinity;
  let closestIndex = -1;

  polylineCoords.forEach((polyPoint, index) => {
    // pointCoords: [lng, lat], polyPoint: [lng, lat]
    const dist = haversineDistance(pointCoords[1], pointCoords[0], polyPoint[1], polyPoint[0]);
    if (dist < minDistance) {
      minDistance = dist;
      closestIndex = index;
    }
  });
  return { minDistance, closestIndex };
};

/**
 * Pure Deterministic Scoring Function
 * @param {Object} riderQuery - { time, originCoordinates, destinationCoordinates }
 * @param {Array} candidateRides - List of rides from the DB
 */
export const scoreAndRankRides = (riderQuery, candidateRides) => {
  const MAX_TIME_DIFF_MINS = 60; // Max acceptable time gap (1 hour)
  const MAX_WALK_RADIUS_KM = 2.0; // Max acceptable walking distance (2 km)

  const riderMins = timeToMins(riderQuery.time);
  const riderOrigin = riderQuery.originCoordinates;
  const riderDest = riderQuery.destinationCoordinates;

  const scoredRides = candidateRides.map((ride) => {
    // 1. ROUTE OVERLAP & DIRECTION CHECK (40%)
    // Where does the rider get on, and where do they get off?
    const originMatch = findClosestPointOnPolyline(riderOrigin, ride.routePolyline.coordinates);
    const destMatch = findClosestPointOnPolyline(riderDest, ride.routePolyline.coordinates);

    console.log(`Ride ${ride._id}: originIndex=${originMatch.closestIndex}, destIndex=${destMatch.closestIndex}, totalPoints=${ride.routePolyline.coordinates.length}`);

    let routeOverlapScore = 0;
    let boardingDistanceScore = 0;
    let validDirection = true;

    // If the index of the destination is BEFORE the origin, the car is going the wrong way!
    if (originMatch.closestIndex >= destMatch.closestIndex) {
      validDirection = false;
    } else {
      routeOverlapScore = 1.0; // Perfect direction
      
      // 2. BOARDING DISTANCE (20%)
      if (originMatch.minDistance <= MAX_WALK_RADIUS_KM) {
        boardingDistanceScore = 1.0 - (originMatch.minDistance / MAX_WALK_RADIUS_KM);
      }
    }

    // 3. TIME PROXIMITY (25%)
    let timeProximityScore = 0;
    const driverMins = timeToMins(ride.departureTime);
    const timeDiff = Math.abs(riderMins - driverMins);

    if (timeDiff <= MAX_TIME_DIFF_MINS) {
      timeProximityScore = 1.0 - (timeDiff / MAX_TIME_DIFF_MINS);
    }
    console.log(`Ride ${ride._id}: validDir=${validDirection}, walkDist=${originMatch.minDistance.toFixed(2)}km, timeDiff=${timeDiff}m`);

    // 4. TRUST SIGNAL (15%)
    // Base trust is 0.8 for verified. If in the same department, it becomes 1.0!
    const trustSignalScore = ride.trustScore || 0.8;

    // --- APPLY ALGORITHM WEIGHTS ---
    const matchScore = (
      0.40 * routeOverlapScore +
      0.25 * timeProximityScore +
      0.20 * boardingDistanceScore +
      0.15 * trustSignalScore
    );

    // Is it actually viable? (Right direction, close enough to walk, within 1 hour)
    const isViable = validDirection && (originMatch.minDistance <= MAX_WALK_RADIUS_KM) && (timeDiff <= MAX_TIME_DIFF_MINS);

    return {
      ...ride, // keep existing ride data
      matchScore: isViable ? Number((matchScore * 100).toFixed(1)) : 0,
      breakdown: {
        routeOverlap: Number((routeOverlapScore * 100).toFixed(1)),
        timeProximity: Number((timeProximityScore * 100).toFixed(1)),
        boardingDistance: Number((boardingDistanceScore * 100).toFixed(1)),
        trustSignal: Number((trustSignalScore * 100).toFixed(1))
      },
      boardingDistanceKm: originMatch.minDistance.toFixed(2),
      isViable
    };
  });

  // Return only viable rides, sorted from highest score to lowest
  return scoredRides
    .filter((r) => r.isViable && r.matchScore > 0)
    .sort((a, b) => b.matchScore - a.matchScore);
};