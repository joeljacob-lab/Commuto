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

## Phase 5 — Fuel Rates (COMPLETED)

**Build:** `fuelRateController` (fold into `adminController.js` or its own — small enough either way) + route for admin to set the current rate. Frontend: `admin/FuelRateSettings.jsx`.

**Verify:** setting a new rate creates a new `fuelrates` document (don't overwrite old ones — they're historical); confirm you can fetch "current" rate as the most recent `effectiveDate`.

---

## Phase 6 — Route Pools (COMPLETED)

**Build:** `routePoolController.js` + `routePoolRoutes.js` (driver create/edit/pause; requires an *approved* vehicle — enforce this check now). Integrate Maps API (OSRM) for route polyline + `distanceKm` on creation. Frontend: `CreateRoutePool.jsx`, `MyRoutePools.jsx` (with address search, "Use Current Location" GPS, and presets).

**Verify:** attempting to create a pool with an unapproved vehicle is rejected; a valid pool stores a real `distanceKm` and GeoJSON polyline from the routing engine, not a placeholder.

---

## Phase 7 — Daily Ride Generation & One-Off Single-Day Rides (COMPLETED)

**Build:**
1. `jobs/dailyRideGeneratorJob.js`: Idempotent generator matching recurrence days (defaults to tomorrow's schedule), snapshots `fuelPricePerLitreUsed` from current `fuelrates`, computes `rosterLockAt` (9:00 PM previous evening with late-creation safety fallback), and sets initial `estimatedCostPerHead`. Includes automated 5:00 PM evening background scheduler (`startRideGenerationScheduler`).
2. **One-Off / Single-Day Ride Publishing (`POST /api/rides`)**:
   - Allows drivers to publish an ad-hoc, single-day trip (for exams, campus events, fests, or special weekend commutes) without creating a permanent recurring pool.
   - Saves with `routePoolId: null`.
   - Snapshots the current fuel rate, calculates driving distance via OSRM, sets `rosterLockAt`, and opens for booking immediately.
3. `rideController.js` + `rideRoutes.js`: Endpoints for single-day ride creation (`POST /api/rides`), fetching ride details (`GET /api/rides/:id`), driver ride list (`GET /api/rides/my`), and on-demand generator trigger (`POST /api/rides/generate-daily`).
4. `utils/haversine.js`: Spatial distance helper for route calculations.
5. Frontend: `CreateOneOffRide.jsx` and `MyRides.jsx` dashboard.

**Verify:**
- Running the generation job produces a `ride` per active pool with frozen fuel price, 9:00 PM roster lock, and idempotency.
- Publishing a single-day one-off ride directly produces a valid `ride` document with `routePoolId = null`.

---

## Phase 8 — Matching Engine (COMPLETED)

**Build:** `services/matchingService.js` as a **pure function** — no DB calls inside it, just `(riderQuery, candidateRides) → rankedRides` using the §7.1 formula and `haversine.js`. Wired `GET /api/rides/search` in `rideController.js` and frontend search interface `SearchRides.jsx` with 1-click campus presets.

**Verify:** Verified end-to-end with high match score ranking (~90%+), reverse-direction disqualification (`originIndex >= destIndex`), 60-minute time limits, 2.0 km walk radius filters, and driver self-match guards.

---

## Phase 9 — Bookings, Escrow & Roster Lock (COMPLETED)

**Build:**
1. `services/escrowService.js`: Transaction-aware core financial service managing append-only `walletledgers`:
   - `holdFunds`: locks provisional share from spendable `walletBalance` (`type: 'hold'`).
   - `releaseFunds`: 100% refund for pre-lock cancellation (`type: 'release'`).
   - `forfeitFunds`: transfers held funds to driver on late cancellation (`type: 'payout'` for driver, `type: 'forfeit'` for rider).
   - `processLockDelta`: automated escrow adjustment at roster lock when final occupancy is lower than full vehicle capacity.
2. `controllers/walletController.js` + `routes/walletRoutes.js`: Mock top-up gateway (`POST /api/wallet/topup`) and wallet inspection (`GET /api/wallet/balance` with `/me` alias).
3. `controllers/bookingController.js` + `routes/bookingRoutes.js`:
   - Atomic seat reservation via `findOneAndUpdate({ _id: rideId, availableSeats: { $gt: 0 } }, ...)` with status transition to `'booking'`/`'full'`.
   - Provisional hold computation based on optimistic full-occupancy baseline.
   - Dual-branch cancellation (`PUT /api/bookings/:id/cancel`): pre-lock releases funds and restores available seats; post-lock forfeits hold to driver and burns seat.
   - Booking history endpoint (`GET /api/bookings/my-bookings`).
4. `jobs/rosterLockJob.js`: 9:00 PM automated cron job (`0 21 * * *`) counting live confirmed bookings (`bookings.length`), computing true Equal Split (`costPerHeadFinal = totalTripCost / (1 + confirmedRiderCount)`), freezing costs (`costLocked: true`), and processing escrow deltas.
5. `jobs/dailyRideGeneratorJob.js`: Standardized on 12:00 AM Midnight (`0 0 * * *`) using `node-cron`.

**Verify:**
- **Test Suite 1 (Booking Integrity & Race Conditions):** Driver self-booking blocked (`400 Bad Request`); 0-seat overbooking blocked via atomic `$gt: 0` guard; double booking rejected; insufficient wallet balance rejected.
- **Test Suite 2 (Cancellation & Escrow Movement):** Pre-lock cancellation restores full balance and frees seat; post-lock cancellation transfers funds to driver, keeps rider balance deducted, and burns seat; double cancellation rejected (`400 Bad Request`).
- **Test Suite 3 (Roster Lock & Dynamic Pricing Delta):** Partially filled car (1 confirmed rider in 4-seater car with ₹100 trip cost) verified: provisional ₹20 held upon booking; at roster lock, final cost computed as $100 / (1 + 1) = \text{₹50}$; escrow delta of ₹30 successfully deducted from rider's wallet balance ($500 \rightarrow 470$).

---

## Phase 10 — Trust Graph, Reviews, Reports (COMPLETED)

**Build:**
1. `services/escrowService.js` + `controllers/rideController.js`: Added `payoutTripToDriver` and `completeRide` (`PUT /api/rides/:id/complete`) to finalize bookings, mark ride `'completed'`, and transfer held escrow funds to driver's spendable `walletBalance` (`type: 'payout'`).
2. `services/trustService.js`: Canonical pairwise graph service enforcing `userA < userB` lexical order convention. Implements `recordMutualRide` (increments `mutualRideCount`, checks `deptId` for `sharedDepartment`, updates `lastRideAt`), `recordCompletedRideTrust`, and `recordReportFlag`.
3. `controllers/reviewController.js` + `routes/reviewRoutes.js`: Post-ride mutual rating (`POST /api/reviews`) enforcing completed shared ride participation and compound unique index `{ rideId: 1, fromUserId: 1, toUserId: 1 }`. Implements on-demand dynamic rating aggregation (`GET /api/reviews/user/:userId`) via MongoDB `$avg`.
4. `controllers/reportController.js` + `routes/reportRoutes.js`: Safety complaint submission (`POST /api/reports`) with free-form description (`[REG-08]`), automatic pairwise trust edge flagging (`reportFlags + 1`), user report history (`GET /api/reports/my`), and admin moderation triage queue (`GET /api/reports`, `PUT /api/reports/:id/status`).
5. Frontend integration: API service methods wired in `frontend/src/services/api.js`; driver **"🏁 Complete Ride & Get Payout"** button, status badge, and reactive refresh trigger integrated in `MyRides.jsx`.

**Verify:**
- **Test 10.1 (Ride Completion & Escrow Payout):** Verified ride and confirmed booking status transition to `'completed'`; driver spendable `walletBalance` credited with locked fare via append-only `WalletLedger` (`type: 'payout'`).
- **Test 10.2 (Pairwise Trust Graph Upsert):** Verified exactly one canonical edge document created in `trustedges` with alphabetically sorted roll numbers (`userA < userB`), `mutualRideCount = 1`, and `sharedDepartment = true`.
- **Test 10.3 (Review Submission & Dynamic Rating):** Verified 5-star review submission; verified dynamic rating aggregation returning live average (5.0) and review count without static model fields.
- **Test 10.4 (Duplicate Review Guard):** Submitting a second review for the same ride and user pair rejected with `400 Bad Request` via compound unique constraint.
- **Test 10.5 (Safety Report & Trust Flagging):** Submitted misconduct complaint; verified `Report` document created with `status: 'open'` and pairwise `TrustEdge` automatically flagged with `reportFlags: 1`.

---

## Phase 11 — Notifications (COMPLETED)

**Build:**
- `services/notificationService.js`: Dual-delivery notification dispatcher (saves to MongoDB `Notification` collection + real-time push to student's private Socket.IO room `userId`).
- Backend integration: Hooked `sendNotification` into booking creation (`booking_request`), seat cancellation (`ride_cancelled`), ride completion, and roster lock events.
- Socket.IO connection handling in `backend/server.js`: Authenticated personal room joining (`join_user_room`).
- `controllers/notificationController.js` + `routes/notificationRoutes.js`: User notification feed (`GET /api/notifications`), unread badge count (`GET /api/notifications/unread-count`), mark single as read (`PUT /api/notifications/:id/read`), mark all as read (`PUT /api/notifications/read-all`).
- Frontend: `frontend/src/services/socket.js` (Socket.IO client connection & room join), `frontend/src/components/NotificationBell.jsx` (interactive bell dropdown with unread badge counter, real-time push receiver, mark read, and relative timestamps), mounted into main app layout.

**Verify:**
- **Test 11.1 (Socket Connection & Room Join):** Verified client connects and joins private room (`socket.join(userId)`) upon login.
- **Test 11.2 (Real-Time Push on Booking):** Verified reserving a seat as rider triggers instant real-time notification push to driver's open browser session without page refresh (`new_notification` event).
- **Test 11.3 (Mark as Read):** Verified clicking notification or "Mark all read" updates status via API and clears unread badge in real time.
- **Test 11.4 (Cancellation Push):** Verified seat cancellation triggers real-time push to driver notifying of seat/ride cancellation.
- **Test 11.5 (Persistence):** Verified persisted documents in MongoDB `notifications` collection with proper recipient `userId`, `type`, `message`, and boolean `read` state.

---

## Phase 12 — Admin Dashboard & Stats (COMPLETED)

**Build:**
- `controllers/adminController.js`: Platform-wide aggregation endpoint (`GET /api/admin/stats`) computing live counts across users by role, vehicles by verification status, route pools, rides by status, bookings, safety reports, trust edges/reviews, and cumulative escrow volume (`WalletLedger` type `'payout'`); plus campus student directory search and role-filter endpoint (`GET /api/admin/users`).
- `routes/adminRoutes.js`: Admin-protected routes gated with `protect` and `requireRole('admin')`, mounted at `/api/admin` in `backend/server.js`.
- Frontend: `frontend/src/pages/admin/AdminDashboard.jsx` (command center with KPI cards, quick-triage shortcuts, and interactive student directory) and `frontend/src/pages/admin/ReportsQueue.jsx` (safety complaints moderation queue with status filters and one-click triage buttons), wired into `App.jsx` under `/admin/dashboard` and `/admin/reports`.

**Verify:**
- **Test 12.1 (Platform Stats Aggregation):** Verified dashboard KPI metrics match live MongoDB collections 1:1, including accurate breakdown of campus users, vehicles, rides, and cumulative financial escrow volume (₹48 verified).
- **Test 12.2 (User Directory & Search):** Verified student directory filtering by role (Rider, Driver, Admin) and instant search by roll number/name.
- **Test 12.3 (Safety Reports Triage):** Verified moderation queue lists submitted complaints with accused/reporter details, linked ride info, and status transitions (`open` → `investigating` → `resolved` / `dismissed`).
- **Test 12.4 (Admin RBAC Security):** Verified admin endpoints and routes reject unauthenticated or non-admin users with 403 Forbidden.

---

## Phase 13 — Frontend Polish & End-to-End Pass (COMPLETED)

**Build:**
- Implemented and fully polished all core frontend user interfaces:
  - `Navbar.jsx`: Global responsive navigation, spendable wallet balance chip, real-time notification bell dropdown, role switcher, and quick profile link.
  - `Dashboard.jsx`: Role-aware student hub with quick-action cards for riders, drivers, and campus admins.
  - `SearchRides.jsx`: OSRM matching engine integration, campus presets, match % scores, interactive corridor itineraries, and 1-click booking modal with GeoJSON normalization.
  - `MyBookings.jsx`: Passenger tickets, driver phone contact badges (`tel:`), pre/post roster lock cancellation lifecycle, post-ride reviews, and safety incident reporting.
  - `RideDetails.jsx`: Full corridor itinerary, vehicle specs, Equal Split formula display, and instant booking modal.
  - `Profile.jsx`: Student identity, dynamic reputation score, spendable escrow balance, and append-only financial audit ledger table (`WalletLedger`).
  - `MockPaymentGatewayModal.jsx`: Realistic checkout simulation (UPI VPA, QR code timer, Card with 3D Secure OTP step, Net Banking) feeding spendable escrow balance.
  - `WithdrawModal.jsx`: Driver payout cashout to Bank IMPS or UPI with balance validation and ledger tracking (`type: 'withdrawal'`).
  - `driver/MyRides.jsx`: Driver passenger roster with rider names, roll numbers, department/program labels, boarding points, direct phone call badges, and smart complete-ride guards.
- Backend Enhancements & Lifecycle Guards:
  - `backend/controllers/walletController.js` & `backend/routes/walletRoutes.js`: Added `POST /api/wallet/withdraw` for driver cashout.
  - `backend/controllers/bookingController.js`: Added auto-wrapping for nested `boardingPoint.point` GeoJSON coordinates and populated `driverId` (name, phone, email, deptId).
  - `backend/controllers/rideController.js`: Populated driver's passenger roster with `deptName` and `programName` on `getMyDriverRides`; added guards on `completeRide` against 0-passenger rides and premature pre-roster lock calls.
  - `backend/jobs/rosterLockJob.js`: Added explicit 0-passenger cancellation handling (sets `costPerHeadFinal = 0`, cancels unbooked ride, and alerts driver cleanly).

**Verify — 7-Step End-to-End Pass:**
- **Step 1 (Multi-User Registration):** Verified student registration for Driver (MCA2024017 / Anjali) and Rider (MCA2024018 / Rahul) with college domain email enforcement and role assignments.
- **Step 2 (Vehicle & Pool Approval):** Verified vehicle submission (`KL07AB1234`), Cloudinary document upload, admin queue verification, and recurring Route Pool creation.
- **Step 3 (Matching & Search):** Verified ride generation, OSRM road distance calculation, boarding point query, and deterministic multi-signal ranking score display.
- **Step 4 (Booking & Roster Lock):** Rider Rahul booked a seat via Escrow wallet hold (₹80 provisional hold). Daily 9:00 PM Roster Lock ran, finalizing confirmed headcount to 1 passenger + 1 driver, freezing `costPerHeadFinal` at ₹68, and releasing ₹12 change back to Rahul.
- **Step 5 (Cancellation Lifecycle & Escrow Safety):** Verified atomic seat count adjustments on pre-lock vs post-lock cancellations; verified 0-passenger safety guard preventing unauthorized payout on empty rides.
- **Step 6 (Trip Completion & Dynamic Reviews):** Driver marked ride complete; ₹68 payout credited to Anjali's spendable wallet. Rider Rahul submitted a 4-star review with comment; verified dynamic rating score updated accurately to 4.0 ★ without static database fields, and mutual pairwise trust graph updated.
- **Step 7 (Admin Dashboard & Financial Audit):** Verified Admin Dashboard KPIs updated live: Platform volume increased to ₹116, completed rides reached 2, user reviews recorded, and all actions audited in append-only `walletledger`.

**Result:** All 14 phases (Phase 0 through Phase 13) are 100% completed, integrated, and verified end-to-end. Core project is functionally complete!

