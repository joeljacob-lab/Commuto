# Commuto — Project Status & Future Reference Registry

**File Purpose:**  
This document tracks the current execution state of the Commuto project, detailed component status, and a **Future Reference Registry** of code segments, imports, or behaviors that have been temporarily adjusted, simplified, or stubbed in the current phase and must be reintroduced or updated in a specific future phase.

> **Maintenance Rule:** This file is updated only when explicitly requested by the user.

---

## 1. Overall Phase Progress

| Phase | Description | Status | Target / Completed |
|---|---|---|---|
| **Phase 0** | Project Scaffolding, DB Config, Socket.IO Server, React/Vite/Tailwind Shell, AuthContext Skeleton | **COMPLETED** | Fully verified & error-free |
| **Phase 1** | Data Models (12 Mongoose Models with Natural Keys) | **COMPLETED** | Fully verified |
| **Phase 2** | Auth & RBAC (JWT, bcrypt, college domain email, `/api/auth/me`) | **COMPLETED** | Fully verified |
| **Phase 3** | Departments (CRUD, seed script, registration dropdown) | **COMPLETED** | Fully verified |
| **Phase 4** | Vehicles & Admin Verification Queue (regNo PK, Cloudinary docs) | **COMPLETED** | Fully verified & tested |
| **Phase 5** | Fuel Rates Management (Historical rate tracking) | **COMPLETED** | Fully verified & tested |
| **Phase 6** | Route Pools (Driver recurring pools, map polylines & distance) | **COMPLETED** | Fully verified & tested |
| **Phase 7** | Daily Ride Generation & Single-Day Rides (Snapshot fuel rates, ad-hoc rides) | **COMPLETED** | Fully verified & tested |
| **Phase 8** | Matching Engine (Pure deterministic scoring function + unit tests) | **COMPLETED** | Fully verified & tested |
| **Phase 9** | Bookings, Escrow Wallet & Roster Lock Job (Atomic seats, ledger holds) | **COMPLETED** | Fully verified & tested |
| **Phase 10** | Trust Graph, Reviews, Reports (Pairwise trustedge, mutual rating) | **COMPLETED** | Fully verified & tested |
| **Phase 11** | Notifications (Socket.IO + In-app persistence) | Pending | Depends on Phase 10 |
| **Phase 12** | Admin Dashboard & Stats (Platform counts, report handling) | Pending | Depends on Phase 11 |
| **Phase 13** | Frontend Polish & Full End-to-End Verification Flow | Pending | Final Phase |

---

## 2. Current Implementation Status (End of Phase 10)

### Backend
* **Database & Config**: Mongoose models fully initialized using ESM. Natural keys correctly implemented for `User` (`collegeId`) and `Vehicle` (`registrationNumber`). Environment fully configured.
* **`backend/server.js`**:
  * Express app with CORS (`credentials: true`, pointing to `CLIENT_URL`), JSON parsing (`10mb` limit), and urlencoded body parsing.
  * Root health routes implemented: `GET /` and `GET /api/health`.
  * Error middleware wired: `notFound` (404) and `errorHandler`.
  * API mounted: `app.use('/api/auth', authRoutes)`, `app.use('/api/departments', departmentRoutes)`, `app.use('/api/vehicles', vehicleRoutes)`, `app.use('/api/fuelrates', fuelRateRoutes)`, `app.use('/api/routepools', routePoolRoutes)`, `app.use('/api/rides', rideRoutes)`, `app.use('/api/wallet', walletRoutes)`, `app.use('/api/bookings', bookingRoutes)`, `app.use('/api/reviews', reviewRoutes)`, `app.use('/api/reports', reportRoutes)`.
  * Background cron jobs initialized after DB connection:
    * `startRideGenerationScheduler()`: runs automatically daily at 12:00 AM Midnight via `node-cron` to generate future recurring rides.
    * `startRosterLockJob()`: runs automatically daily at 9:00 PM (21:00) via `node-cron` to freeze headcount and finalize Equal Split pricing.
* **Auth & RBAC**:
  * Controllers: `registerUser` (with unique checks and domain constraints), `loginUser`, `getMe`.
  * Middleware: `protect` (JWT verification) and `requireRole` (RBAC access checks) working correctly.
* **Departments**:
  * Controllers & Routes: Full CRUD capabilities via `departmentController.js`.
  * Protections: Creation/Deletion gated behind `requireRole('admin')`, fetching is public. Delete constraint prevents removal of a department if users are attached.
* **Vehicles & Cloudinary Integration**:
  * `backend/config/cloudinary.js`: Cloudinary v2 SDK configuration for direct media uploads.
  * `backend/utils/normalizeRegNo.js`: Helper function to sanitize/normalize vehicle registration numbers (strips spaces and hyphens, converts to uppercase).
  * `backend/controllers/vehicleController.js`:
    * `addVehicle`: Driver vehicle registration with Base64 Cloudinary upload (`resource_type: 'image'`), natural key normalization (`_id: registrationNumber`), duplicate checking (`409 Conflict`), required document validation. Supports both image and PDF documents.
    * `getMyVehicles`: Driver fetches their registered vehicles.
    * `getPendingVehicles`: Admin fetches pending verification list with populated owner info.
    * `updateVehicleStatus`: Admin approves/rejects vehicles and records `verifiedBy`.
  * `backend/routes/vehicleRoutes.js`: Protected driver & admin routes with `requireRole`.
* **Fuel Rates Management**:
  * `backend/controllers/fuelRateController.js`:
    * `getCurrentFuelRate`: Fetches current platform fuel rate sorted by `effectiveDate: -1` with safe default fallback.
    * `getFuelRateHistory`: Full audit log of rate changes populated with admin details.
    * `setFuelRate`: Append-only insertion stamped with `setBy: req.user._id` (never overwrites historical rates).
  * `backend/routes/fuelRateRoutes.js`: Authenticated read route (`/current`), admin-protected write (`/`) and audit log (`/history`).
* **Route Pools & Mapping Services**:
  * `backend/services/routeService.js`: OSRM routing service computing driving road distance in km and GeoJSON `LineString` coordinates `[[lng, lat], ...]`, with an automated Haversine curved-road fallback.
  * `backend/controllers/routePoolController.js`:
    * `createRoutePool`: Enforces strict **Approved Vehicle Guard** (`verificationStatus === 'approved'`), driver ownership check, and seat capacity guard (`maxMembers <= vehicle.seats`). Saves GeoJSON `Point` coordinates in `[lng, lat]` order and auto-computes road distance and polyline.
    * `getMyRoutePools`: Fetches driver's standing pools populated with vehicle details.
    * `toggleRoutePoolStatus`: One-click toggle between `active` and `paused`.
    * `deleteRoutePool`: Removes a standing pool.
  * `backend/routes/routePoolRoutes.js`: Driver-protected routes mounted at `/api/routepools`.
* **Daily Ride Generation & One-Off Single-Day Rides**:
  * `backend/utils/haversine.js`: Pure mathematical Haversine distance calculator between GPS coordinates.
  * `backend/jobs/dailyRideGeneratorJob.js`:
    * `generateDailyRides`: Idempotent generator matching recurrence days (defaults to tomorrow's schedule), snapshots `fuelPricePerLitreUsed` from current `fuelrates`, computes `rosterLockAt` (9:00 PM previous evening with late-creation safety fallback), and sets initial `estimatedCostPerHead`.
    * `startRideGenerationScheduler`: Automated background scheduler running daily at 5:00 PM.
    * `calculateRosterLockTime`: Morning rides ($\le$ 12:00 PM) lock at 9:00 PM previous evening; late/afternoon rides lock 1 hour before departure.
  * `backend/controllers/rideController.js`:
    * `createOneOffRide`: Ad-hoc single-day ride publishing with `routePoolId: null`, fuel rate snapshotting, dynamic cost calculation, and roster lock computation.
    * `getMyDriverRides`: Lists driver's active and historical rides.
    * `getRideById`: Fetches ride details populated with driver and vehicle info.
    * `triggerDailyGeneration`: Manual testing endpoint supporting optional target date override.
  * `backend/routes/rideRoutes.js`: Protected routes mounted at `/api/rides`.
* **Matching Engine (§7.1)**:
  * `backend/services/matchingService.js`: Pure deterministic scoring and ranking engine (`scoreAndRankRides`) computing dynamic match scores based on:
    * **Route Overlap & Direction Check (40%)**: Enforces forward-direction alignment (`originIndex < destIndex`) along the OSRM road polyline.
    * **Time Proximity (25%)**: Linear penalty window up to 60 minutes (`MAX_TIME_DIFF_MINS = 60`).
    * **Boarding Distance (20%)**: Straight-line walking radius calculation up to 2.0 km (`MAX_WALK_RADIUS_KM = 2.0`).
    * **Trust Signal (15%)**: Baseline verified driver trust (0.80) with same-department boost capability (1.00).
  * `backend/controllers/rideController.js` (`searchRides`): `GET /api/rides/search` fetches candidate rides for the target date, filters out unviable/self-matching rides (`driverId: { $ne: req.user._id }`), and executes the pure matching engine.
* **Escrow Wallet Subsystem & Ledger Service**:
  * `backend/services/escrowService.js`: Transaction-aware core financial engine:
    * `holdFunds`: Deducts provisional share from spendable `walletBalance` and inserts append-only `WalletLedger` record (`type: 'hold'`).
    * `releaseFunds`: Restores held funds on pre-lock cancellation with ledger record (`type: 'release'`).
    * `forfeitFunds`: Transfers held funds on post-lock cancellation / no-show by crediting driver's spendable balance (`type: 'payout'`) and logging rider forfeiture (`type: 'forfeit'`).
    * `processLockDelta`: Automatically settles the difference at roster lock when actual headcount yields a higher final share than optimistic capacity.
  * `backend/controllers/walletController.js`:
    * `getMyWallet`: Fetches live `walletBalance` and transaction history sorted latest first.
    * `topUpWallet`: Academic mock payment gateway (`POST /api/wallet/topup`) crediting balance and writing ledger record (`type: 'topup'`).
  * `backend/routes/walletRoutes.js`: Authenticated routes supporting `GET /api/wallet/balance` (with `/me` alias) and `POST /api/wallet/topup`.
* **Booking Lifecycle & Atomic Seat Reservation**:
  * `backend/controllers/bookingController.js`:
    * `createBooking`: Uses atomic `findOneAndUpdate` with `{ availableSeats: { $gt: 0 } }` to eliminate overbooking race conditions; transitions ride status to `'booking'` or `'full'`; automatically sets fallback `boardingPoint` from ride origin if not passed; records `holdAmountProvisional` and locks funds via `escrowService`.
    * `cancelBooking`: Branches based on `rosterLockAt` and `costLocked`. Pre-lock: 100% refund via `releaseFunds` and frees the seat (`availableSeats + 1`). Post-lock: forfeits hold to driver via `forfeitFunds` and burns the seat. Prevents duplicate cancellations.
    * `getMyBookings`: Lists user's bookings populated with ride and vehicle details.
  * `backend/routes/bookingRoutes.js`: Authenticated routes mounted at `/api/bookings` (`POST /ride/:id`, `PUT /:id/cancel`, `GET /my-bookings`).
* **Roster Lock Engine (§7.3)**:
  * `backend/jobs/rosterLockJob.js`:
    * Runs daily at 21:00 (9:00 PM) via `node-cron`.
    * Queries open rides past lock cutoff (`status: { $in: ['published', 'booking', 'full'] }`, `costLocked: { $ne: true }`, `rosterLockAt: { $lte: now }`).
    * Queries real confirmed database bookings (`bookings.length`) to compute true Equal Split headcount: `costPerHeadFinal = totalTripCost / (1 + confirmedRiderCount)`.
    * Freezes cost (`costLocked: true`, `costPerHeadFinal`), processes escrow deltas for confirmed bookings, and updates `holdAmountFinal`.
* **Ride Completion & Driver Escrow Payout**:
  * `backend/services/escrowService.js`: `payoutTripToDriver(driverId, bookingId, amount, session)` credits held funds to driver spendable `walletBalance` and inserts `WalletLedger` record (`type: 'payout'`).
  * `backend/controllers/rideController.js`: `completeRide` (`PUT /api/rides/:id/complete`) driver endpoint that transitions ride and confirmed bookings to `'completed'`, releases escrow payout to driver, and triggers trust graph updates.
  * `backend/routes/rideRoutes.js`: Driver-protected route mounted at `PUT /api/rides/:id/complete`.
* **Pairwise Trust Graph Engine (`trustedges`)**:
  * `backend/services/trustService.js`:
    * Enforces canonical `userA < userB` lexical ordering to guarantee exactly one document per student pair.
    * `recordMutualRide`: Upserts pairwise edge, compares `deptId` to cache `sharedDepartment`, increments `mutualRideCount`, timestamps `lastRideAt`.
    * `recordCompletedRideTrust`: Batch-records edges between driver and confirmed passengers upon trip completion.
    * `recordReportFlag`: Automatically increments `reportFlags` on pairwise edge upon safety report submission.
    * `getPairTrust`: Helper to query pairwise relationship for search matching / profiles.
* **Mutual Post-Ride Reviews & Dynamic Rating Aggregation**:
  * `backend/controllers/reviewController.js`:
    * `createReview` (`POST /api/reviews`): Validates completed shared ride participation (driver $\leftrightarrow$ passenger or passenger $\leftrightarrow$ passenger); enforces compound unique constraint `{ rideId: 1, fromUserId: 1, toUserId: 1 }` to prevent duplicate reviews.
    * `getUserReviews` (`GET /api/reviews/user/:userId`): Computes live rating dynamically on-demand using MongoDB `$avg` aggregation (no stale static user field per Schema v2).
  * `backend/routes/reviewRoutes.js`: Authenticated review endpoints mounted at `/api/reviews`.
* **Safety Reports & Moderation Queue**:
  * `backend/controllers/reportController.js`:
    * `createReport` (`POST /api/reports`): Free-form description text per `[REG-08]`, links optional ride, auto-increments `reportFlags` on pairwise `TrustEdge`.
    * `getMyReports` (`GET /api/reports/my`): Lists student's submitted complaints.
    * `getAllReports` (`GET /api/reports`) & `updateReportStatus` (`PUT /api/reports/:id/status`): Admin moderation queue (`open` $\rightarrow$ `investigating` $\rightarrow$ `resolved` $\rightarrow$ `dismissed`).
  * `backend/routes/reportRoutes.js`: Authenticated student & admin routes mounted at `/api/reports`.

### Frontend
* **Build Stack**: React 19 + Vite 8 + Tailwind CSS v4 + React Router v7.
* **`frontend/src/services/api.js`**: Axios client configured with `baseURL`, auth interceptors, 401 handling, and service endpoints for Auth, Departments, Vehicles, Fuel Rates, Route Pools, Rides (`createOneOffRide`, `getMyDriverRides`, `getRideDetails`, `triggerDailyGeneration`, `completeRide`), Ride Search (`searchRides`), Wallet (`getMyWallet`, `topUpWallet`), Bookings (`createBooking`, `cancelBooking`, `getMyBookings`), Reviews (`createReview`, `getUserReviews`), and Reports (`createReport`, `getMyReports`, `getAllReports`, `updateReportStatus`).
* **`frontend/src/pages/driver/MyRides.jsx`**: Integrated **"🏁 Complete Ride & Get Payout"** button, status badge, and reactive refresh trigger.
* **`frontend/src/context/AuthContext.jsx`**:
  * Implemented full token verification against `/api/auth/me` on load.
  * Correctly toggles `loading` state while fetching session validity.
* **Department Integration**:
  * `Register.jsx` intelligently fetches departments and restricts `program` choices based on the selected `department`.
  * `DepartmentManagement.jsx` fully implemented for Admins (Add, Edit, Delete).
* **Vehicle Management**:
  * `VehicleForm.jsx`: Driver vehicle registration form supporting model, type (`car`/`bike`), color, seat count, mileage, and multiple document uploads (JPG, PNG, PDF). Uses Base64 conversion and a DOM `useRef` to cleanly reset file inputs after submission.
  * `VehicleVerificationQueue.jsx`: Admin verification queue with document preview links and reactive `refreshTrigger` state pattern.
* **Fuel Rates Administration**:
  * `FuelRateSettings.jsx`: Admin interface featuring prominent current active rate card, rate updater form with validation, and an append-only audit table displaying historical price shifts with timestamps and admin user info.
* **Route Pools & Driver Experience**:
  * `CreateRoutePool.jsx`: Interactive route creation form featuring OpenStreetMap Nominatim geocoding place search, HTML5 Geolocation (**"📍 Use Current Location"**), popular campus transit hub presets, approved vehicle selector, and recurrence days timetable picker. Raw coordinates are completely hidden from the user.
  * `MyRoutePools.jsx`: Driver dashboard displaying active/paused badges, road distance chips, recurrence days, timetable window, and one-click Pause/Resume and Delete controls.
* **Ride Publishing & Dashboard**:
  * `CreateOneOffRide.jsx`: Interface for publishing ad-hoc single-day rides for exams, tech fests, or special weekend commutes with real-time address search, seat capacity validation, and cost calculations.
  * `MyRides.jsx`: Driver dashboard with visual distinction between `🔁 Recurring Pool Ride` and `🗓️ Single-Day Ride`, available seat counters, estimated share per head, frozen fuel rate used, roster lock countdowns, and on-demand generator trigger.
* **Rider Matching Experience**:
  * `SearchRides.jsx`: Clean rider search interface with 1-click campus presets (`Aluva Metro Station`, `Campus Main Gate`, etc.) to prevent geocoding boundary drift, date/time pickers, dynamic match % badges, walk-to-boarding distance indicators, estimated cost per head, and viable ride filtering.
* **Routing**: `App.jsx` includes `<Login>`, `<Register>`, protected `<DepartmentManagement>` (`/admin/departments`), protected `<VehicleForm>` (`/driver/vehicles/add`), protected `<VehicleVerificationQueue>` (`/admin/vehicles/pending`), protected `<FuelRateSettings>` (`/admin/fuel-rates`), protected `<CreateRoutePool>` (`/driver/routepools/create`), protected `<MyRoutePools>` (`/driver/routepools`), protected `<CreateOneOffRide>` (`/driver/rides/create-single`), protected `<MyRides>` (`/driver/rides`), and `<SearchRides>` (`/search-rides`).

---

## 3. Future Reference Registry (Items Temporarily Deferred / Reserved)

The following items were simplified or deferred to keep the codebase completely free of linter errors (`no-unused-vars`, cascading re-render warnings, etc.) during Phase 0. They are scheduled to be re-added in subsequent phases:

### [REG-01] `AuthContext.jsx` — Token Verification on App Launch (`/api/auth/me`)
* **Status:** **RESOLVED IN PHASE 2**
* **Context:** In Phase 0, `user` and `token` were loaded synchronously. In Phase 2, this was updated to verify the session with `api.get('/auth/me')` on load.

### [REG-02] `AuthContext.jsx` — `api` Client Import
* **Status:** **RESOLVED IN PHASE 2**
* **Context:** `getCurrentUser` is now imported and utilized to validate the JWT.

### [REG-03] `AuthContext.jsx` — `loading` State Dynamic Toggle
* **Status:** **RESOLVED IN PHASE 2**
* **Context:** `loading` state properly toggles on mount while fetching the initial backend JWT check.

### [REG-04] `server.js` — API Route Mounts
* **Phase to Reintroduce:** **Phases 9 through 12**
* **Context:** Root, `/api/auth`, `/api/departments`, `/api/vehicles`, `/api/fuelrates`, `/api/routepools`, `/api/rides`, `/api/wallet`, `/api/bookings`, `/api/reviews`, and `/api/reports` endpoints are actively mounted.
* **What to mount sequentially in remaining phases:**
  * Phase 9: `app.use('/api/bookings', bookingRoutes)` & `app.use('/api/wallet', walletRoutes)` (**MOUNTED & VERIFIED**)
  * Phase 10: `app.use('/api/reviews', reviewRoutes)` & `app.use('/api/reports', reportRoutes)` (**MOUNTED & VERIFIED**)
  * Phase 11: `app.use('/api/notifications', notificationRoutes)`
  * Phase 12: `app.use('/api/admin', adminRoutes)`

### [FEAT-01] One-Off / Single-Day Ride Publishing (Phase 7 Special Feature)
* **Status:** **RESOLVED IN PHASE 7**
* **Context:** Beyond recurring commute pools (`RoutePool`), drivers frequently need to offer rides for ad-hoc, special occasions (e.g. Saturday exams, college symposiums/tech fests, campus placement drives, or one-off weekend trips).
* **Architecture:**
  * Endpoint: `POST /api/rides`
  * Database Schema: `rides.routePoolId = null` (distinguishes ad-hoc single-day trips from pool-generated rides).
  * Snapshots active `fuelrates` on creation, calculates road distance/polyline via `routeService`, computes initial `estimatedCostPerHead`, and sets `rosterLockAt` (9:00 PM previous evening with fallback).
  * Fully implemented in `rideController.js`, `CreateOneOffRide.jsx`, and displayed in `MyRides.jsx`.

### [REG-05] `server.js` & `Socket.IO` — Real-Time Event Dispatchers
* **Phase to Reintroduce:** **Phase 11 (Notifications & Real-Time)**
* **Context:** Socket.IO is initialized and attached via `app.set('io', io)`, with basic connection and `join_user_room` listeners ready.
* **What to add in Phase 11:** Dispatch socket events from controllers/services (e.g. `booking_requested`, `booking_accepted`, `roster_locked`, `ride_cancelled`) targeting user rooms.

### [REG-06] Database URI (`backend/.env`)
* **Phase to Finalize:** **Phase 1 / Phase 2**
* **Context:** Currently points to `mongodb://127.0.0.1:27017/commuto`.
* **Action Required:** Whenever the developer starts MongoDB locally or provides a MongoDB Atlas connection string, update `MONGODB_URI` in `backend/.env`.

### [REG-07] `Department` Model Schema Update
* **Phase Effective:** **Phase 1 & Phase 3**
* **Context:** In early draft, `Department` had a natural string PK (`"CSE"`, `"MCA"`).
* **Updated Design:** `Department` uses standard auto-generated `ObjectId` as PK, and `deptCode` is completely removed. In `User.js`, `deptId` is `{ type: Schema.Types.ObjectId, ref: 'Department' }`. Only `User` (`collegeId`) and `Vehicle` (`registrationNumber`) use natural keys.

### [REG-08] `Report` Model — `reason` Field Removal
* **Status:** **RESOLVED IN PHASE 10**
* **Context:** Previously, `Report` had an enum `reason` field (`unsafe_driving`, `no_show`, etc.).
* **Updated Design:** The `reason` field has been removed in favor of free-form `description` text. Controller and frontend report submissions in Phase 10 send complaint context via `description` without enum constraints. Submitting a report automatically increments `reportFlags` on the pairwise `TrustEdge`.

### [REG-09] Module System Standardization — ES Modules (ESM) Only
* **Phase Effective:** **Phase 1 Onwards**
* **Context:** Backend was originally scaffolded using CommonJS (`type: "commonjs"`, `require`, `module.exports`).
* **Updated Design:** The entire project (both backend and frontend) is standardized on modern ES Modules (`import` / `export` / `export default`). `backend/package.json` must be set to `"type": "module"`. In Node.js ESM, local relative imports must include explicit `.js` extensions (e.g., `import User from './models/User.js';`).

### [REG-10] Equal Split Cost Calculation Model (§7.2)
* **Phase Effective:** **Phase 7, Phase 8, Phase 9**
* **Context:** In early design, `costPerHead = dailyTripCost / confirmedHeadcount` (passengers only). This risked dumping 100% of the fuel cost on a single rider if only 1 student booked, or on a 2-wheeler bike pillion passenger.
* **Updated Design:** Adopted the **Equal Split Model**: `costPerHead = dailyTripCost / (1 + confirmedRiderCount)`. The driver is counted as 1 passenger/seat in the carpool so that single riders and bike passengers split fuel 50/50 and are never unfairly burdened. Initial pre-lock estimate uses `dailyTripCost / (1 + totalSeats)`.

### [REG-11] UI Cost Transparency & Optimistic vs. Confirmed Occupancy Labeling
* **Phase Effective:** **Phase 9 (Provisional Holds) & Phase 13 (Frontend Polish & Labeling)**
* **Context:** Initial pre-lock estimates displayed to riders use `totalSeats` (full-occupancy, optimistic baseline: `dailyTripCost / (1 + totalSeats)`), whereas the final frozen cost at 9:00 PM roster lock uses live `confirmedRiderCount` (`dailyTripCost / (1 + confirmedRiderCount)`).
* **Behavior:** If a carpool does not fully fill up by the roster lock (e.g., 2 riders join a 4-seater car), the final share will rise from the optimistic baseline. While this is mathematically fair and expected in dynamic cost-sharing, riders could perceive this price shift as a "bait-and-switch" if not labeled transparently.
* **Requirements for Phase 13:**
  * Label pre-booking search prices clearly as optimistic minimums (e.g. *"From ₹X if fully booked"* or display a range *"Est. ₹X – ₹Y"*).
  * Checkout modal must include explicit notice: *"Your final share is locked at 9:00 PM based on confirmed riders. Maximum possible share is ₹Z."*
### [REG-12] `Booking` Compound Index & Cancellation Re-Booking
* **Phase Effective:** **Phase 9 & Schema v2 Maintenance**
* **Context:** In early design, `Booking.js` defined a unique compound index: `bookingSchema.index({ rideId: 1, passengerId: 1 }, { unique: true })`.
* **Behavior:** When a student books and later cancels a ride, the document remains in the collection with `status: 'cancelled'`. A strict unique index prevents that student from ever re-booking that ride later in the day, throwing a MongoDB duplicate key error (`E11000`).
* **Recommended Schema Update:** Convert to a partial unique index:
  ```javascript
  bookingSchema.index(
    { rideId: 1, passengerId: 1 },
    {
      unique: true,
      partialFilterExpression: { status: { $in: ['requested', 'confirmed'] } }
    }
  );
  ```
  This guarantees that active bookings remain strictly unique while allowing riders who previously cancelled to re-join if seats remain open.

### [REG-13] Ride Generation Schedule Standardization (12:00 AM Midnight)
* **Phase Effective:** **Phase 7 & Phase 9**
* **Context:** Early documentation drafts intermittently referenced a 5:00 PM ride generation time.
* **Standardized Design:** Standardized `dailyRideGeneratorJob.js` on **12:00 AM Midnight (`0 0 * * *`)** using `node-cron`. Running at midnight provides a clean 21-hour booking window (from 12:00 AM to 9:00 PM roster lock) and supports future rolling-date multi-day generation windows without tight same-evening cutoffs.

---

## 4. Summary of Verification Completed in Phase 0

1. **Backend Verification:**
   * Server executes with `node server.js` and outputs:
     `Commuto Server running in development mode on port 5000`
   * Responds on `http://localhost:5000` with Welcome JSON.
   * Responds on `http://localhost:5000/api/health` with health status and database readyState.
2. **Frontend Verification:**
   * Vite dev server runs cleanly with `npm run dev` on `http://localhost:5173`.
   * Production build passes (`npm run build`) with zero module or syntax errors.
   * `App.jsx` and `AuthContext.jsx` have zero ESLint errors or React warnings.
