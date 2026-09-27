import 'dotenv/config';
import mongoose from 'mongoose';

import Department from './models/Department.js';
import User from './models/User.js';
import Vehicle from './models/Vehicle.js';
import FuelRate from './models/FuelRate.js';
import RoutePool from './models/RoutePool.js';
import Ride from './models/Ride.js';
import Booking from './models/Booking.js';
import WalletLedger from './models/WalletLedger.js';
import TrustEdge from './models/TrustEdge.js';
import Review from './models/Review.js';
import Report from './models/Report.js';
import Notification from './models/Notification.js';

// Small helper so every check prints the same way: label, value, pass/fail
function check(label, actual, expected) {
  const pass = String(actual) === String(expected);
  console.log(`${pass ? '✅' : '❌'} ${label}: ${actual}${pass ? '' : ` (expected ${expected})`}`);
  return pass;
}

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n--- Creating one document per collection ---\n');

  // 1. Department
  const dept = await Department.create({
    deptName: 'Master of Computer Applications',
    programName: 'MCA',
  });
  check('Department._id is an ObjectId', mongoose.isValidObjectId(dept._id), true);

  // 2. Users — need two: a driver and a passenger, for the FK-heavy models later
  const driver = await User.create({
    _id: 'MCA2024017',
    name: 'Arjun Driver',
    email: 'arjun017@college.edu',
    passwordHash: 'dummyhash',
    phone: '9999999901',
    deptId: dept._id,
    year: 1,
    roles: ['driver', 'rider'],
    walletBalance: 500,
  });
  check('User (driver)._id', driver._id, 'MCA2024017');

  const rider = await User.create({
    _id: 'MCA2024018',
    name: 'Rahul Rider',
    email: 'rahul018@college.edu',
    passwordHash: 'dummyhash',
    phone: '9999999902',
    deptId: dept._id,
    year: 1,
    roles: ['rider'],
    walletBalance: 200,
  });
  check('User (rider)._id', rider._id, 'MCA2024018');

  // 3. Vehicle
  const vehicle = await Vehicle.create({
    _id: 'kl 07 ab 1234',
    ownerId: driver._id,
    model: 'Maruti Swift',
    type: 'car',
    seats: 3,
    mileageKmpl: 15,
    documentUrls: ['https://example.com/doc.pdf'],
  });
  check('Vehicle._id normalized', vehicle._id, 'KL07AB1234');

  // 4. FuelRate
  const fuelRate = await FuelRate.create({
    pricePerLitre: 105,
    effectiveDate: new Date(),
    setBy: driver._id, // pretending driver is admin here just for the test
  });
  console.log(`✅ FuelRate created: ₹${fuelRate.pricePerLitre}/l`);

  // 5. RoutePool
  const routePool = await RoutePool.create({
    driverId: driver._id,
    vehicleId: vehicle._id,
    origin: {
      label: 'Angamaly',
      point: { type: 'Point', coordinates: [76.3861, 10.1957] }, // [lng, lat]
    },
    destination: {
      label: 'FISAT',
      point: { type: 'Point', coordinates: [76.3413, 10.1234] },
    },
    routePolyline: {
      type: 'LineString',
      coordinates: [
        [76.3861, 10.1957],
        [76.3413, 10.1234],
      ],
    },
    recurrenceDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    departureWindowStart: '07:45',
    departureWindowEnd: '08:15',
    distanceKm: 24,
    maxMembers: 3,
  });
  console.log(`✅ RoutePool created: ${routePool._id}`);

  // 6. Ride
  const now = new Date();
  const ride = await Ride.create({
    routePoolId: routePool._id,
    driverId: driver._id,
    vehicleId: vehicle._id,
    date: now,
    departureTime: '08:00',
    origin: routePool.origin,
    destination: routePool.destination,
    routePolyline: routePool.routePolyline,
    boardingPoints: [
      { label: 'Athani Junction', point: { type: 'Point', coordinates: [76.37, 10.15] } },
    ],
    availableSeats: 3,
    totalSeats: 3,
    fuelPricePerLitreUsed: fuelRate.pricePerLitre,
    estimatedCostPerHead: 56,
    rosterLockAt: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now, just for the test
  });
  console.log(`✅ Ride created: ${ride._id}`);

  // 7. Booking
  const booking = await Booking.create({
    rideId: ride._id,
    passengerId: rider._id,
    boardingPoint: ride.boardingPoints[0],
    holdAmountProvisional: 56,
    cutoffDeadline: ride.rosterLockAt,
  });
  console.log(`✅ Booking created: ${booking._id}`);

  // 8. WalletLedger
  const ledgerEntry = await WalletLedger.create({
    userId: rider._id,
    bookingId: booking._id,
    type: 'hold',
    amount: 56,
    balanceAfter: rider.walletBalance - 56,
  });
  console.log(`✅ WalletLedger entry created: ${ledgerEntry._id}`);

  // 9. TrustEdge — userA should be the lexically smaller collegeId, by convention
  const [userA, userB] = [driver._id, rider._id].sort();
  const trustEdge = await TrustEdge.create({
    userA,
    userB,
    sharedDepartment: true,
    mutualRideCount: 1,
    lastRideAt: now,
  });
  console.log(`✅ TrustEdge created: ${trustEdge._id} (${userA} <-> ${userB})`);

  // 10. Review
  const review = await Review.create({
    rideId: ride._id,
    fromUserId: rider._id,
    toUserId: driver._id,
    rating: 5,
    comment: 'Great ride, on time!',
  });
  console.log(`✅ Review created: ${review._id}`);

  // 11. Report
  const report = await Report.create({
    reportedBy: rider._id,
    against: driver._id,
    rideId: ride._id,
    reason: 'other',
    description: 'This is just a test report, not a real complaint.',
  });
  console.log(`✅ Report created: ${report._id}`);

  // 12. Notification
  const notification = await Notification.create({
    userId: rider._id,
    type: 'booking_accepted',
    message: 'Your booking request has been accepted.',
    relatedRideId: ride._id,
  });
  console.log(`✅ Notification created: ${notification._id}`);

  console.log('\n--- All 12 collections wrote successfully ---\n');
  console.log('Cleaning up test data...');

  await Promise.all([
    Notification.deleteOne({ _id: notification._id }),
    Report.deleteOne({ _id: report._id }),
    Review.deleteOne({ _id: review._id }),
    TrustEdge.deleteOne({ _id: trustEdge._id }),
    WalletLedger.deleteOne({ _id: ledgerEntry._id }),
    Booking.deleteOne({ _id: booking._id }),
    Ride.deleteOne({ _id: ride._id }),
    RoutePool.deleteOne({ _id: routePool._id }),
    FuelRate.deleteOne({ _id: fuelRate._id }),
    Vehicle.deleteOne({ _id: vehicle._id }),
    User.deleteOne({ _id: driver._id }),
    User.deleteOne({ _id: rider._id }),
    Department.deleteOne({ _id: dept._id }),
  ]);

  await mongoose.disconnect();
  console.log('Done. Disconnected.');
}

run().catch((err) => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});