import RoutePool from '../models/RoutePool.js';
import Ride from '../models/Ride.js';
import FuelRate from '../models/FuelRate.js';

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/**
 * Calculates rosterLockAt timestamp:
 * 1. Morning rides (<= 12:00 PM): Locks at 9:00 PM the evening before.
 * 2. Late creation safety guard: If 9:00 PM yesterday has already passed, 
 *    it locks 1 hour before departure (never in the past!).
 * 3. Afternoon/Evening rides (> 12:00 PM): Locks 1 hour before departure.
 */
export const calculateRosterLockTime = (rideDate, departureTimeStr) => {
  const [hours, minutes] = departureTimeStr.split(':').map(Number);
  const departureDate = new Date(rideDate);
  departureDate.setHours(hours, minutes, 0, 0);

  const now = new Date();

  if (hours <= 12) {
    // 9:00 PM (21:00) the previous evening
    const previousEvening = new Date(departureDate);
    previousEvening.setDate(previousEvening.getDate() - 1);
    previousEvening.setHours(21, 0, 0, 0);

    // Safety guard: If 9 PM previous evening is already in the past, lock 1 hr before departure
    if (previousEvening <= now) {
      return new Date(departureDate.getTime() - 2 * 60 * 60 * 1000);
    }
    return previousEvening;
  }

  // Afternoon / Evening rides: 1 hour before departure
  return new Date(departureDate.getTime() - 2 * 60 * 60 * 1000);
};

/**
 * Generates rides from active recurring route pools.
 * Defaults to TOMORROW so rides are ready the evening before.
 */
export const generateDailyRides = async (targetDate) => {
  let normalizedDate;
  if (!targetDate) {
    // Default to Tomorrow
    normalizedDate = new Date();
    normalizedDate.setDate(normalizedDate.getDate() + 1);
  } else {
    normalizedDate = new Date(targetDate);
  }
  normalizedDate.setHours(0, 0, 0, 0);

  const dayOfWeek = DAY_NAMES[normalizedDate.getDay()];

  // 1. Fetch latest active fuel rate
  const latestFuel = await FuelRate.findOne().sort({ effectiveDate: -1 });
  const fuelPrice = latestFuel?.pricePerLitre || 105.0;

  // 2. Find active route pools matching that day's schedule
  const activePools = await RoutePool.find({
    status: 'active',
    recurrenceDays: dayOfWeek,
  }).populate('vehicleId');

  let generatedCount = 0;
  const createdRides = [];

  for (const pool of activePools) {
    if (!pool.vehicleId || pool.vehicleId.verificationStatus !== 'approved') {
      continue;
    }

    // 3. Prevent duplicate generation for the same pool on the same date
    const existingRide = await Ride.findOne({
      routePoolId: pool._id,
      date: {
        $gte: normalizedDate,
        $lt: new Date(normalizedDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingRide) {
      continue;
    }

    // 4. Fair cost estimate
    const vehicle = pool.vehicleId;
    const mileage = vehicle.mileageKmpl || 15;
    const dailyTripCost = (pool.distanceKm / mileage) * fuelPrice;
    const estimatedCostPerHead = Math.round(dailyTripCost / (1 + pool.maxMembers));

    // 5. Compute roster lock time (9:00 PM previous evening)
    const rosterLockAt = calculateRosterLockTime(normalizedDate, pool.departureWindowStart);

    // 6. Create the Ride
    const newRide = await Ride.create({
      routePoolId: pool._id,
      driverId: pool.driverId,
      vehicleId: vehicle._id,
      date: normalizedDate,
      departureTime: pool.departureWindowStart,
      origin: pool.origin,
      destination: pool.destination,
      routePolyline: pool.routePolyline,
      boardingPoints: [pool.origin],
      availableSeats: pool.maxMembers,
      totalSeats: pool.maxMembers,
      fuelPricePerLitreUsed: fuelPrice,
      estimatedCostPerHead: Math.max(10, estimatedCostPerHead),
      rosterLockAt,
      status: 'published',
    });

    createdRides.push(newRide);
    generatedCount++;
  }

  return {
    generatedCount,
    targetDate: normalizedDate.toLocaleDateString(),
    rides: createdRides,
  };
};

/**
 * Background Scheduler: Runs automatically at 5:00 PM every evening
 * to generate the next day's rides without any human clicks.
 */
export const startRideGenerationScheduler = () => {
  const scheduleNext5PM = () => {
    const now = new Date();
    const nextRun = new Date();
    nextRun.setHours(17, 0, 0, 0); // 5:00 PM

    // If it's already past 5:00 PM today, schedule for 5:00 PM tomorrow
    if (now >= nextRun) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    const delayMs = nextRun.getTime() - now.getTime();
    console.log(`⏰ Automated 5:00 PM Ride Generator scheduled for: ${nextRun.toLocaleString()}`);

    setTimeout(async () => {
      try {
        console.log('⏰ [5:00 PM Job] Automatically generating tomorrow\'s rides...');
        const result = await generateDailyRides();
        console.log(`✅ [5:00 PM Job] Generated ${result.generatedCount} ride(s) for tomorrow (${result.targetDate}).`);
      } catch (err) {
        console.error('❌ Error during 5:00 PM ride generation:', err.message);
      }
      // Re-schedule for the next day
      scheduleNext5PM();
    }, delayMs);
  };

  scheduleNext5PM();
};