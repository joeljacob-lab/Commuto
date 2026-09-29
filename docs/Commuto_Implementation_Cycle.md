# Commuto — Phase-by-Phase Implementation Cycle

Follow these phases **in order**. Each phase only depends on what came before it — do not skip ahead, and do not start a phase until the previous one runs correctly. This order is deliberately dependency-safe: e.g. you can't build bookings before rides exist, and you can't build the roster lock job before bookings exist.

Reference `Commuto_Master_Spec.md` for full field definitions, algorithms (§7), and API list (§11) as you go — this file only tells you *what order* to build things in and *what to verify* at each step.

---

## Phase 0 — Project Scaffolding

**Build:**
- `commuto/` root with `backend/` and `frontend/` per folder structure.
- Backend: `npm init`, install `express`, `mongoose`, `dotenv`, `bcryptjs`, `jsonwebtoken`, `cors`, `cloudinary`, `socket.io`. Set up `server.js` with a basic Express app and `config/db.js` MongoDB connection.
- Frontend: `npm create vite@latest` (React), install Tailwind, `react-router-dom`, `axios`. Set up `App.jsx` with a placeholder route and `AuthContext.jsx` skeleton.
- `.env.example` in backend listing `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*` keys (no real values committed).
- `.gitignore` covering `node_modules`, `.env`, build output.

**Verify before moving on:** backend starts and logs "MongoDB connected"; frontend dev server renders a blank page with no console errors.

---

## Phase 1 — Data Models (COMPLETED)

**Build:** all 12 Mongoose schemas in `backend/models/`, exactly matching §6 of the master spec — field names, types, enums, and **natural-key `_id`s** (`User` = `collegeId`, `Vehicle` = `registrationNumber`; `Department` and all other collections use default auto-generated `ObjectId`).

**Order within this phase** (respects FK dependency):
1. `Department.js`
2. `User.js`
3. `Vehicle.js`
4. `FuelRate.js`
5. `RoutePool.js`
6. `Ride.js`
7. `Booking.js`
8. `WalletLedger.js`
9. `TrustEdge.js`
10. `Review.js`
11. `Report.js`
12. `Notification.js`

**Verify:** write a throwaway script (or use `mongosh`) to insert one document into each collection and confirm the natural-key `_id`s save correctly (e.g. a `User` document's `_id` is literally the collegeId string, not an ObjectId, while `Department` gets an auto-generated ObjectId).

---

## Phase 2 — Auth & RBAC (COMPLETED)

**Build:**
- `utils/generateToken.js`, `middleware/authMiddleware.js` (JWT verify), `middleware/roleMiddleware.js` (RBAC check).
- `controllers/authController.js` + `routes/authRoutes.js`: register (enforce college email domain, hash password, set `_id` = `collegeId`), login (bcrypt compare, issue JWT), `GET /me`.
- Frontend: `Login.jsx`, `Register.jsx`, `AuthContext.jsx` (store JWT, expose `user`/`login`/`logout`), `ProtectedRoute.jsx`.

**Verify:** register a user, confirm the document in MongoDB has `_id` = the collegeId you entered; log in, confirm JWT is returned and a protected test route rejects requests without it.

---

## Phase 3 — Departments (COMPLETED)

**Build:** `departmentController.js` + `departmentRoutes.js` (list, admin-only create), seed a handful of departments (e.g. `deptName: 'Computer Science and Engineering', programName: 'B.Tech'`) via a small seed script. Frontend: `admin/DepartmentManagement.jsx`, and wire the department dropdown into `Register.jsx`.

**Verify:** registering a user now requires selecting a real `deptId`; the FK resolves correctly (`user.deptId` matches an existing `departments._id` ObjectId).

*Why this phase is small and early: `users.deptId` depends on departments existing, so this has to land before you consider Phase 2 "fully done" in practice — build it right after auth so registration is complete end-to-end.*

---

## Phase 4 — Vehicles (COMPLETED)

**Build:** `utils/normalizeRegNo.js`, `config/cloudinary.js`, `vehicleController.js` + `vehicleRoutes.js` (driver: add vehicle with doc upload; admin: list pending, approve/reject). Frontend: `VehicleForm.jsx`, `VehicleManagement.jsx`, `admin/VehicleVerificationQueue.jsx`.

**Verify:** add a vehicle with a registration number in mixed case/spacing, confirm it's stored normalized as the `_id`; confirm an unapproved vehicle cannot yet be attached to anything (enforced properly starting next phase).

---

## Phase 5 — Fuel Rates

**Build:** `fuelRateController` (fold into `adminController.js` or its own — small enough either way) + route for admin to set the current rate. Frontend: `admin/FuelRateSettings.jsx`.

**Verify:** setting a new rate creates a new `fuelrates` document (don't overwrite old ones — they're historical); confirm you can fetch "current" rate as the most recent `effectiveDate`.

---

## Phase 6 — Route Pools

**Build:** `routePoolController.js` + `routePoolRoutes.js` (driver create/edit/pause; requires an *approved* vehicle — enforce this check now). Integrate Maps API for route polyline + `distanceKm` on creation. Frontend: `RoutePoolForm.jsx`, `CreateRoutePool.jsx`.

**Verify:** attempting to create a pool with an unapproved vehicle is rejected; a valid pool stores a real `distanceKm` from the Maps API response, not a placeholder.

---

## Phase 7 — Daily Ride Generation

**Build:** `utils/haversine.js` (needed by matching next phase — fine to build now), `jobs/dailyRideGeneratorJob.js`: for each active `routepool`, create today's `ride`, snapshot `fuelPricePerLitreUsed` from the current `fuelrates` entry, compute `rosterLockAt` and an initial `estimatedCostPerHead` (using headcount = 0 or a placeholder until bookings exist). `rideController.js` + `rideRoutes.js` for basic read endpoints (`GET /rides/:id`).

**Verify:** running the job manually (expose a temporary `POST /admin/trigger-ride-generation` for testing) produces one `ride` per active pool, with a correctly frozen `fuelPricePerLitreUsed`.

---

## Phase 8 — Matching Engine

**Build:** `services/matchingService.js` as a **pure function** — no DB calls inside it, just `(riderQuery, candidateRides) → rankedRides` using the §7.1 formula and `haversine.js`. Write `tests/matchingService.test.js` with 3–4 hand-built example routes/riders where you know the expected ranking, and confirm the function produces it. Then wire `GET /api/rides/search` in `rideController.js` to call this service.

**Verify:** the unit tests pass; a manual search query returns rides sorted by descending score, and you can explain by hand why the top result scored highest.

*This is the phase to be most careful with — keep the service pure and tested before wiring it into any route, so a routing bug can never be confused with a scoring bug.*

---

## Phase 9 — Bookings, Escrow & Roster Lock

**The most logic-heavy phase — build in this sub-order, verifying each step:**

1. `bookingController.js` — `POST /bookings`: check `walletBalance ≥ estimatedCostPerHead`, create booking with `holdAmountProvisional` held, write a `walletledger` entry (`type: 'hold'`), decrement `availableSeats` **atomically** (`findOneAndUpdate` with a seat-count guard to prevent a race on the last seat).
2. Driver accept/reject endpoints (`PUT /bookings/:id/accept|reject`).
3. `services/escrowService.js` — the release/forfeit logic, called from both the cancellation endpoint and the roster lock job.
4. `services/costEngineService.js` — implements the §7.2 formula, called by the roster lock job.
5. `jobs/rosterLockJob.js` — at `rosterLockAt`: count confirmed bookings, call `costEngineService` for `costPerHeadFinal`, set `holdAmountFinal` per booking (refund/top-up the delta via `escrowService` + `walletledger`), flip `costLocked`.
6. Cancellation endpoint (`PUT /bookings/:id/cancel`) — branches on whether `now < cutoffDeadline`: before → release + trigger recalculation for remaining riders; after → forfeit via `escrowService`.
7. Ride completion endpoint — releases all held funds to the driver's `walletBalance`, writes `walletledger` (`type: 'release'`), flips ride `status` to `completed`.
8. `walletController.js` — top-up endpoint, ledger history endpoint.

**Verify (build a manual test scenario):** create a ride with 3 riders, simulate one cancelling before lock (confirm the other two's `estimatedCostPerHead` rises) and one no-showing after lock (confirm their hold is forfeited and appears in the driver's ledger as a `forfeit` entry, not a `release`).

---

## Phase 10 — Trust Graph, Reviews, Reports

**Build:**
- `services/trustService.js` — on ride completion, upsert the `trustedges` document for each rider-driver pair (increment `mutualRideCount`, set `sharedDepartment` by comparing `deptId`).
- `reviewController.js` + routes — post-ride mutual rating; enforce the compound-unique constraint (one review per direction per ride).
- `reportController.js` + routes — submit report, admin list/update status.

**Verify:** two users sharing a completed ride produce exactly one `trustedges` document (not two, one per direction) with `mutualRideCount = 1`; submitting a second review for the same ride/direction is rejected by the unique index.

---

## Phase 11 — Notifications

**Build:** `services/notificationService.js` wrapping both a MongoDB `notifications` write and a Socket.IO emit; hook it into booking request/accept/reject, ride reminders (can be a simple scheduled check), and cancellations. Frontend: `NotificationBell.jsx`, Socket.IO client connection in `App.jsx`.

**Verify:** accepting a booking as a driver produces a real-time notification on the rider's open browser tab, and a persisted `notifications` document.

---

## Phase 12 — Admin Dashboard & Stats

**Build:** `adminController.js` stats endpoint (counts across users/rides/reports/pending vehicles), wire up `admin/AdminDashboard.jsx`, `ReportsQueue.jsx` fully (if not already done in Phase 10).

**Verify:** dashboard numbers match actual collection counts in MongoDB.

---

## Phase 13 — Frontend Polish & End-to-End Pass

**Build:** fill in remaining pages (`Dashboard.jsx`, `MyBookings.jsx`, `MyRides.jsx`, `Profile.jsx`, `SearchRides.jsx`, `RideDetails.jsx`), loading/error states throughout, responsive layout pass.

**Verify — full end-to-end run-through before considering the project "done":**
1. Two students register (different roles).
2. Driver adds vehicle → gets approved → creates a route pool.
3. Ride auto-generates → rider searches and finds it via the matching engine.
4. Rider books → driver accepts → roster lock fires → cost finalizes.
5. One rider cancels early, confirm fair recalculation; simulate a late no-show on a second test ride, confirm forfeiture.
6. Ride completes → both rate each other → trust edge updates.
7. Admin dashboard reflects all of the above in its stats.

If all seven steps work end-to-end without manual DB edits, the core project is functionally complete.
