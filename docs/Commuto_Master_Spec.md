# Commuto — Master Project Specification

**Purpose of this document:** this is a self-contained spec. Everything needed to understand, design, and implement the project — problem, architecture, modules, database, algorithms, workflows, and API surface — is in this one file. It is written so it can be handed directly to an LLM/coding assistant (e.g. inside Claude Code, Antigravity, Cursor) to generate the actual codebase from, phase by phase, without needing any other document.

---

## 1. Project Overview

**Name:** Commuto  
**Tagline:** *Because someone's already driving your way.*  
**Type:** College-exclusive recurring carpool / cost-sharing platform (MCA final year project)  
**Not:** a taxi app, a self-drive rental app, or a stranger-matching ride app.

**One-line pitch:** Commuto turns a college's own fixed timetable and commuting population into its own transit network — students traveling the same route at the same time split fuel cost, matched and verified through their shared college identity rather than anonymous ratings.

---

## 2. Problem Statement

College students commute via public transport, private vehicles, autos/cabs, or college buses. Two groups have unsolved problems:

- **Students without vehicles:** transport is expensive or inconvenient; no easy way to find others traveling the same route at the same time.
- **Students with vehicles:** seats sit empty every day; fuel cost is borne entirely by the owner; no trustworthy way to find fellow students on the same route.
- **Underlying trust problem:** general ride-sharing/carpool apps connect strangers. A college environment should offer tighter trust: verified students + verified vehicles + a closed, accountable community.

### 2.1 Why not existing platforms

| | **BlaBlaCar** | **sRide** | **Quick Ride** | **Commuto** |
|---|---|---|---|---|
| Model | Intercity carpool, one-off trips | Company-verified daily commute carpool | Carpool + taxi, city/outstation | Campus-only, **recurring** commute carpool |
| Verification | Government ID / phone | Work email of any company | Phone only | College ID + department/batch |
| Trust signal | Star rating, review count | Same-company badge | Star rating | Same-college, same-batch, mutual-ride history graph |
| Route matching | Point A→B, one-off | Route + time, daily | Route matching, daily/outstation | Route-aware **recurring** pool along a shared corridor |
| Who you ride with | Strangers, city-wide | Coworkers, any nearby company | Strangers | Actual classmates/batchmates |
| Booking effort | Search every trip | Search every trip | Search every trip | Set up once, matched automatically every day (recurring pool) |

**Closest real competitor:** sRide (company-email verification, daily commute matching) — proves the model works at scale. Commuto's edge is a *tighter, younger, schedule-bound* community (fixed class timetable vs flexible office hours) and a genuinely recurring pool model instead of daily re-searching.

---

## 3. Core Differentiators (must-have features)

1. **Recurring Route Pools** — a driver sets up a standing weekly commute once (`routepool`); daily `ride` instances are auto-generated from it. Riders subscribe once instead of searching every day.
2. **Corridor-based matching, not point matching** — origin/destination don't need to match exactly; overlap along the driver's route is scored.
3. **Trust graph over rating average** — pairwise mutual-connection signals (same department, past rides together) shown alongside ratings — e.g. "2 people from your department have ridden with this driver."
4. **Cost transparency, not pricing** — riders see the fuel-cost math, never a surge-priced fare.
5. **Per-trip escrow wallet** — no prepaid lump sum; funds are held per booking and released/forfeited based on outcome (see §7.3).
6. **Daily-recomputed cost** — cost per head is calculated fresh every day from live fuel price and confirmed headcount, never a flat stored fare (see §7.2).
7. **Carbon/seat-utilization stat** *(nice-to-have)* — filled seats vs. vehicles-not-driven, shown as a dashboard stat.
8. **Women-only / batch-only ride filter** *(nice-to-have)* — a filter on search, not a separate system.

Items 1–6 are core scope. 7–8 are stretch features for demo polish.

---

## 4. Technology Stack

| Layer | Technology | Notes |
|---|---|---|
| Frontend | React + Vite + Tailwind CSS | |
| Backend | Node.js + Express | Modular monolith — not microservices |
| Database | MongoDB + Mongoose | Natural-key primary keys where applicable (see §6) |
| Auth | JWT + bcrypt + RBAC | Multi-role support per user |
| Real-time | Socket.IO | Live booking status, notifications |
| Maps | Mapbox (or Google Maps) | Geocoding, route polylines, distance |
| File storage | Cloudinary | Vehicle documents, profile photos, college ID |
| Deployment | Vercel (frontend) + Render/Railway (backend) + MongoDB Atlas | |

**Explicitly out of scope for the core build:** payment gateway integration (escrow is an internal ledger; real payout via Razorpay is a "future work" note only), machine learning models for matching (see §7.1 — matching is deterministic, not ML), microservices/containerized architecture.

---

## 5. High-Level Architecture

```
┌─────────────────────────────┐
│           CLIENT             │
│   React + Vite + Tailwind    │
│   Role-aware dashboards:     │
│   Rider / Driver / Admin     │
└──────────────┬───────────────┘
               │ REST (+ WebSocket for live booking status)
               ▼
┌───────────────────────────────────────────┐
│              EXPRESS APPLICATION           │
│                                             │
│  ┌───────────────┐  ┌────────────────────┐ │
│  │ Auth & RBAC    │  │ Matching Engine     │ │
│  │ (JWT, bcrypt)  │  │ (isolated, pure     │ │
│  │                │  │  function, unit-    │ │
│  │                │  │  testable)          │ │
│  └───────────────┘  └────────────────────┘ │
│  ┌───────────────┐  ┌────────────────────┐ │
│  │ Ride/Booking   │  │ Trust & Safety      │ │
│  │ Lifecycle      │  │ (ratings, reports,  │ │
│  │                │  │  verification)      │ │
│  └───────────────┘  └────────────────────┘ │
│  ┌───────────────┐  ┌────────────────────┐ │
│  │ Escrow/Wallet  │  │ Notification        │ │
│  │ & Cost Engine  │  │ (Socket.IO + email) │ │
│  └───────────────┘  └────────────────────┘ │
└──────────┬───────────────────┬─────────────┘
           ▼                   ▼
    ┌─────────────┐     ┌──────────────┐
    │  MongoDB     │     │ Maps API +   │
    │  (Atlas)     │     │ Cloudinary   │
    └─────────────┘     └──────────────┘
```

Design principle: keep it a **modular monolith**, not microservices — one deployable backend, internally separated into service modules so the matching engine and cost engine (the genuinely novel parts) are isolated, independently testable, and easy to explain individually.

### 5.1 Backend folder structure

```
backend/
├── models/          (Mongoose schemas — see §6)
├── controllers/      (authController, rideController, bookingController,
│                      vehicleController, adminController, walletController)
├── routes/            (mirrors controllers)
├── middleware/        (authMiddleware, roleMiddleware)
├── services/          (matchingService, costEngineService, notificationService)
├── jobs/              (dailyRideGeneratorJob, rosterLockJob)
├── config/            (db.js)
└── server.js
```

### 5.2 Frontend folder structure

```
frontend/src/
├── components/  (Navbar, RideCard, Map, BookingCard, Notification, WalletWidget)
├── pages/       (Login, Register, Dashboard, SearchRides, CreateRoutePool,
│                 RideDetails, MyBookings, MyRides, Profile, AdminDashboard)
├── services/    (api.js)
├── context/     (AuthContext)
├── hooks/
└── App.jsx
```

---

## 6. Database Schema

MongoDB, 12 collections. **Primary keys use natural/business identifiers where one genuinely exists** (`collegeId` for users, `registrationNumber` for vehicles) rather than relying solely on auto-generated `ObjectId`; collections with no real-world natural identifier keep the default `_id`. In Mongoose this is done via `_id: { type: String }` combined with schema option `_id: false` to stop auto-generation, with the natural value assigned explicitly at creation.

### 6.1 `departments`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | String | PK, e.g. `"CSE"`, `"MCA"` | Department code |
| `deptName` | String | required | Full department name |
| `programName` | String | required | e.g. "B.Tech", "MCA" |

### 6.2 `users`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | String | PK = `collegeId` | Roll/admission number |
| `name` | String | required | |
| `email` | String | required, unique, college domain only | |
| `passwordHash` | String | required | bcrypt |
| `phone` | String | required, unique | |
| `deptId` | String | FK → `departments._id`, required | |
| `year` | Number | required | |
| `roles` | [String] | enum: `rider`,`driver`,`admin` | Multi-role |
| `walletBalance` | Number | default 0 | Spendable, excludes held funds |
| `profileImageUrl` | String | optional | |
| `emergencyContactName` | String | optional | |
| `emergencyContactPhone` | String | optional | |
| `createdAt`, `updatedAt` | Date | auto | |

*No `verificationLevel` field — registration itself is gated by college-domain email + OTP, so every existing user is verified by construction. No `rating`/`ratingCount` fields — rating is computed on demand via aggregation over `reviews` (`AVG(rating) WHERE toUserId = X`), not cached.*

**Indexes:** unique `email`, unique `phone`, index `deptId`.

### 6.3 `vehicles`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | String | PK = `registrationNumber`, normalized uppercase/no-spaces | |
| `ownerId` | String | FK → `users._id`, required | |
| `model` | String | required | |
| `type` | String | enum: `car`,`bike` | |
| `color` | String | optional | |
| `seats` | Number | required, min 1 | Excludes driver |
| `mileageKmpl` | Number | required | Feeds cost engine |
| `documentUrls` | [String] | required, ≥1 | Cloudinary URLs |
| `verificationStatus` | String | enum: `pending`,`approved`,`rejected`, default `pending` | Admin-controlled, distinct from user verification |
| `verifiedBy` | String | FK → `users._id`, optional | |
| `createdAt` | Date | auto | |

**Indexes:** index `ownerId`.

### 6.4 `routepools`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `driverId` | String | FK → `users._id`, required | |
| `vehicleId` | String | FK → `vehicles._id`, required | |
| `origin` | GeoJSON Point | required | `{lat, lng, label}` |
| `destination` | GeoJSON Point | required | `{lat, lng, label}` |
| `routePolyline` | [GeoJSON Point] | required | From Maps API |
| `recurrenceDays` | [String] | enum: `Mon`..`Sun` | |
| `departureWindowStart` | String | required, `HH:mm` | Flexible range |
| `departureWindowEnd` | String | required, `HH:mm` | |
| `distanceKm` | Number | required | Fixed; cost is never stored here |
| `maxMembers` | Number | required | ≤ vehicle seats |
| `status` | String | enum: `active`,`paused`,`ended` | |
| `createdAt` | Date | auto | |

**Indexes:** index `driverId`, `2dsphere` geo-index on `origin`/`destination`, index `status`.

### 6.5 `rides`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | One per pool per day |
| `routePoolId` | ObjectId | FK → `routepools._id`, nullable | Null = one-off ride |
| `driverId` | String | FK → `users._id`, required | |
| `vehicleId` | String | FK → `vehicles._id`, required | |
| `date` | Date | required | |
| `departureTime` | String | required, `HH:mm` | Actual time, within pool's window |
| `origin`, `destination` | GeoJSON Point | required | |
| `routePolyline` | [GeoJSON Point] | required | |
| `boardingPoints` | [{label,lat,lng}] | required, ≥1 | |
| `availableSeats` | Number | required, ≥0 | |
| `totalSeats` | Number | required | |
| `fuelPricePerLitreUsed` | Number | required | Snapshotted from `fuelrates`, frozen |
| `estimatedCostPerHead` | Number | required | Live pre-lock estimate |
| `rosterLockAt` | Date | required | Headcount freeze point |
| `costLocked` | Boolean | default false | |
| `costPerHeadFinal` | Number | nullable | Set at lock — see §7.2 |
| `status` | String | enum: `published`,`booking`,`full`,`started`,`completed`,`cancelled` | |
| `createdAt` | Date | auto | |

**Indexes:** index `driverId`, compound `date`+`status`, `2dsphere` geo-index `origin`.

### 6.6 `fuelrates`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `pricePerLitre` | Number | required | |
| `effectiveDate` | Date | required | |
| `setBy` | String | FK → `users._id`, optional | Admin |

**Indexes:** index `effectiveDate` desc.

### 6.7 `bookings`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `rideId` | ObjectId | FK → `rides._id`, required | |
| `passengerId` | String | FK → `users._id`, required | |
| `boardingPoint` | {label,lat,lng} | required | |
| `status` | String | enum: `requested`,`confirmed`,`rejected`,`cancelled`,`completed`, default `requested` | |
| `holdAmountProvisional` | Number | required | Locked at request |
| `holdAmountFinal` | Number | nullable | Set at roster lock |
| `holdStatus` | String | enum: `held`,`released`,`forfeited`, default `held` | |
| `requestedAt` | Date | auto | |
| `confirmedAt`, `cancelledAt` | Date | optional | |
| `cutoffDeadline` | Date | computed | = ride's `rosterLockAt` |

**Indexes:** compound unique `(rideId, passengerId)`, index `passengerId`+`status`.

### 6.8 `walletledger`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `userId` | String | FK → `users._id`, required | |
| `bookingId` | ObjectId | FK → `bookings._id`, nullable | |
| `type` | String | enum: `topup`,`hold`,`release`,`forfeit`,`payout`,`withdrawal` | |
| `amount` | Number | required | |
| `balanceAfter` | Number | required | |
| `createdAt` | Date | auto | |

**Indexes:** index `userId`+`createdAt`, index `bookingId`.

### 6.9 `trustedges`
Pairwise graph edge — one document per **2-user** relationship (like a Facebook friendship, not a group). Group-level trust is derived by traversing multiple edges, not by storing groups.

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `userA`, `userB` | String | FK → `users._id`, required | `userA` = smaller `collegeId` by convention |
| `sharedDepartment` | Boolean | default false | Cached from both users' `deptId` |
| `mutualRideCount` | Number | default 0 | |
| `reportFlags` | Number | default 0 | |
| `lastRideAt` | Date | optional | |

**Indexes:** compound unique `(userA, userB)`.

### 6.10 `reviews`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `rideId` | ObjectId | FK → `rides._id`, required | |
| `fromUserId`, `toUserId` | String | FK → `users._id`, required | |
| `rating` | Number | required, 1–5 | Source of derived user rating |
| `comment` | String | optional | |
| `createdAt` | Date | auto | |

**Indexes:** compound unique `(rideId, fromUserId, toUserId)`, index `toUserId`.

### 6.11 `reports`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `reportedBy`, `against` | String | FK → `users._id`, required | |
| `rideId` | ObjectId | FK → `rides._id`, optional | |
| `reason` | String | enum: `unsafe_driving`,`no_show`,`harassment`,`fake_info`,`other` | |
| `description` | String | optional | |
| `status` | String | enum: `open`,`investigating`,`resolved`,`dismissed`, default `open` | |
| `handledBy` | String | FK → `users._id`, optional | |
| `createdAt` | Date | auto | |

**Indexes:** index `against`+`status`, index `reportedBy`.

### 6.12 `notifications`
| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `userId` | String | FK → `users._id`, required | |
| `type` | String | enum: `booking_request`,`booking_accepted`,`booking_rejected`,`ride_reminder`,`ride_cancelled`,`report_update` | |
| `message` | String | required | |
| `relatedRideId` | ObjectId | FK → `rides._id`, optional | |
| `read` | Boolean | default false | |
| `createdAt` | Date | auto | |

**Indexes:** index `userId`+`read`.

### 6.13 Entity Relationship Diagram
```
departments ──1───*── users
users ──1───*── vehicles                (ownerId, PK=registrationNumber)
users ──1───*── routepools              (driverId)
routepools ──1───*── rides              (daily instances)
fuelrates ──1───*── rides               (rate snapshotted per date)
rides ──1───*── bookings
users ──1───*── bookings                (passengerId)
users ──1───*── walletledger
bookings ──1───1── walletledger entries
users ──*───*── trustedges ──*───*── users
rides ──1───*── reviews
users ──1───*── reviews                 (fromUserId, toUserId)
users ──1───*── reports                 (reportedBy, against)
rides ──1───*── reports
users ──1───*── notifications
```

---

## 7. Core Algorithms

### 7.1 Matching Engine

**Deliberately rule-based, not ML/AI** — explainable in a viva, needs no training data, mirrors how real carpool platforms (BlaBlaCar) actually rank matches.

```
MatchScore = 0.4·RouteOverlap + 0.25·TimeProximity + 0.2·BoardingDistance + 0.15·TrustSignal

RouteOverlap      = (shared route segments) / (rider's total segments)
TimeProximity     = 1 − (|departure time diff| / max acceptable window)
BoardingDistance  = 1 − (distance from rider's location to nearest boarding point / max radius)
TrustSignal       = normalized(driver rating [from reviews aggregation], mutual connections
                     [from trustedges], vehicle verification level)
```

Distance calculations use the **haversine formula** (plain geometry on lat/lng, no ML). Implement as a pure function: input = rider's origin/destination/time + list of candidate rides; output = same list, scored and sorted. No direct DB coupling — this makes it independently unit-testable.

**Where an LLM API can legitimately help (optional, non-core):** parsing free-text location input ("near the bus stand behind FISAT gate") into coordinates, or generating a friendly natural-language explanation of why a ride was recommended. Never used for the actual scoring/matching decision itself — that must stay deterministic.

### 7.2 Daily Cost Calculation

Cost is **never a flat stored fare** — it is recomputed every day from live inputs, because fuel price and headcount both vary daily.

```
dailyTripCost = (distanceKm / mileageKmpl) × fuelPricePerLitreUsed
costPerHead   = dailyTripCost / confirmedHeadcount
```

- `distanceKm` — fixed, from the route (stored on `routepools`).
- `mileageKmpl` — self-reported once by the driver (stored on `vehicles`).
- `fuelPricePerLitreUsed` — snapshotted per ride from the current `fuelrates` entry at generation time (so historical rides never silently reprice).
- `confirmedHeadcount` — live count of `confirmed` bookings on that day's `ride`, frozen at `rosterLockAt`.

**Worked example:** 24 km route, 15 km/l vehicle, ₹105/l fuel, 3 confirmed riders → `dailyTripCost = (24/15)×105 = ₹168` → `costPerHead = ₹56`.

Each `ride` stores two cost fields: `estimatedCostPerHead` (live, shown before lock) and `costPerHeadFinal` (frozen at `rosterLockAt`, authoritative).

### 7.3 Roster Lock & Escrow

**Roster lock** = a per-ride timestamp (e.g. 8 PM the evening before departure) that freezes the day's headcount and finalizes cost. It serves two purposes at once: (1) the moment the day's passenger list closes, and (2) the fairness cutoff deciding refund vs. forfeit on cancellation.

```
Rider requests seat
        │
        ▼
Balance ≥ estimatedCostPerHead? ──No──▶ Booking blocked, "Add funds" prompt
        │ Yes
        ▼
holdAmountProvisional HELD (locked, not paid out)  [walletledger: type='hold']
        │
        ▼
Driver accepts → booking CONFIRMED
        │
        ▼
   ROSTER LOCK (rosterLockAt)
        │
        ▼
System recomputes costPerHeadFinal from confirmed headcount (§7.2)
holdAmountFinal set per booking; delta from provisional auto refunded/topped-up
        │
   ┌────┴─────────────────────────────┐
   ▼                                   ▼
Cancel BEFORE lock                Cancel/no-show AFTER lock
   │                                   │
   ▼                                   ▼
Hold RELEASED to rider,           Hold FORFEITED to driver
remaining riders' cost            (driver already lost the
recalculated fairly               chance to fill that seat)
   │                                   │
   └─────────────┬─────────────────────┘
                 ▼
      (if ride proceeds normally)
      Driver marks ride COMPLETED
                 │
                 ▼
      Hold RELEASED to driver's payout wallet [walletledger: type='release']
```

**Multi-day absence example:** 3 riders (A, B, C) on a weekly pool. If C cancels *before* roster lock on a given day, headcount recalculates to 2 and A/B's share adjusts up fairly, with C paying nothing. If C simply no-shows *after* lock (or on consecutive days without cancelling), C's own already-held money is forfeited to the driver each of those days — A and B are unaffected either way, and the driver is always made whole. This is why the escrow hold exists: it makes the no-show case self-funding rather than a loss the driver has to absorb.

---

## 8. Module List & Responsibilities

| Module | Responsibility |
|---|---|
| **Auth & RBAC** | Registration (college-domain email + OTP), login, JWT issuing, password hashing, role-based route protection. A user can hold multiple roles (`rider`, `driver`, `admin`) simultaneously. |
| **Department Management** | CRUD for `departments` (admin-only); referenced by `users.deptId`. |
| **User Profile** | View/edit profile, wallet balance display, derived rating display (aggregated from `reviews`), ride history. |
| **Vehicle Management** | Driver adds vehicle + documents; admin verification workflow (`pending`→`approved`/`rejected`). |
| **Route Pool Management** | Driver creates/edits/pauses a recurring weekly commute (`routepools`); defines route, recurrence days, departure window, distance. |
| **Daily Ride Generation** | Scheduled job: for each active `routepool`, generate that day's `ride` document, snapshot the current fuel rate, compute `rosterLockAt` and `estimatedCostPerHead`. |
| **Ride Search & Matching** | Rider searches by origin/destination/time; matching engine (§7.1) scores and ranks candidate rides. |
| **Boarding Point Selection** | Rider picks a convenient boarding point from the ride's predefined list rather than requiring an exact home-address pickup. |
| **Booking & Seat Management** | Request → driver accept/reject → confirm; seat count decrements safely (must prevent double-booking the last seat — use an atomic findOneAndUpdate with a seat-availability guard). |
| **Escrow Wallet & Cost Engine** | Hold/release/forfeit logic (§7.3), daily cost recomputation (§7.2), wallet top-up, `walletledger` audit trail. |
| **Roster Lock Job** | Scheduled job: at each ride's `rosterLockAt`, freeze headcount, compute `costPerHeadFinal`, adjust holds, lock the ride. |
| **Trust & Safety** | `trustedges` pairwise graph updates on ride completion; post-ride mutual reviews; report submission and admin triage. |
| **Notifications** | In-app + real-time (Socket.IO) events for booking requests/acceptance/rejection, ride reminders, cancellations, report updates. |
| **Admin Dashboard** | User management, vehicle verification queue, reports queue, fuel-rate updates, platform stats (active/completed rides, user counts). |
| **File Storage** | Cloudinary integration for vehicle documents, college ID, profile photos — store only the returned URL in MongoDB, never the binary. |

---

## 9. Feature List (consolidated)

**Rider**
- Register/login with college email; set up home/college fixed points once
- Search rides by route/time; view ranked matches with score explanation
- View driver profile: rating (derived), department, mutual-connection trust signal, vehicle verification badge
- Select boarding point; request seat; view booking status
- Wallet top-up; view held/released/forfeited amounts (transaction history from `walletledger`)
- Cancel booking (before/after roster lock, different outcomes — §7.3)
- Rate driver post-ride; report a user
- View ride history

**Driver**
- Add vehicle + upload documents for admin verification
- Create a recurring route pool (route, days, time window, distance)
- View/accept/reject incoming seat requests
- View today's confirmed passengers and final per-head cost after roster lock
- View wallet payouts and earnings history
- Cancel/pause a route pool or a single day's ride
- Rate passengers post-ride

**Admin**
- Verify/reject vehicle documents
- Manage departments (add/edit)
- Set platform fuel rate (`fuelrates`)
- View and act on user reports
- Suspend/reactivate user accounts
- View platform-wide stats (active rides, completed rides, pending verifications, open reports)

---

## 10. Key User Workflows

### 10.1 Driver onboarding → first ride
```
Register (college email) → Email/OTP verify → Account created
   → Add vehicle (regNo, model, seats, mileage, docs) → Admin verifies vehicle
   → Create RoutePool (origin, destination, days, time window, distance)
   → Daily job generates today's Ride (cost estimate, roster lock time set)
   → Riders request seats → Driver accepts/rejects
   → Roster lock hits → final cost computed, holds finalized
   → Ride day: passengers board → driver marks COMPLETED
   → Holds released to driver payout wallet → mutual ratings exchanged
```

### 10.2 Rider journey
```
Register/login → Set fixed home + college points
   → System suggests matching pools (or rider searches manually)
   → View ranked results with match score → Select boarding point
   → Request seat (wallet balance checked, provisional hold placed)
   → Driver accepts → booking CONFIRMED
   → [Optional] cancel before roster lock → full release, others' cost recalculated
   → Roster lock → final cost set, delta refunded/charged
   → Ride happens → rider marks/confirms completion → rate driver
```

### 10.3 Admin verification flow
```
Driver submits vehicle → status=pending → appears in Admin Vehicle Queue
   → Admin reviews documents → Approve (status=approved, verifiedBy=adminId)
     or Reject (status=rejected, driver notified, can resubmit)
   → Only approved vehicles can be attached to a RoutePool
```

### 10.4 No-show / cancellation flow (see §7.3 for full diagram)
```
Rider cancels before rosterLockAt → hold released, remaining riders' cost recalculated
Rider cancels/no-shows after rosterLockAt → hold forfeited to driver, others unaffected
```

---

## 11. REST API Surface (representative, expand as needed)

```
Auth
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me

Users
GET    /api/users/profile
PUT    /api/users/profile
GET    /api/users/:collegeId/rating        (aggregated from reviews)

Departments
GET    /api/departments
POST   /api/departments                     (admin)

Vehicles
POST   /api/vehicles
GET    /api/vehicles/my
PUT    /api/vehicles/:regNo

Route Pools
POST   /api/routepools
GET    /api/routepools/my
PUT    /api/routepools/:id
DELETE /api/routepools/:id

Rides
GET    /api/rides/search?origin=&destination=&time=   (invokes matching engine)
GET    /api/rides/:id
PUT    /api/rides/:id/cancel

Bookings
POST   /api/bookings                        (creates hold, checks balance)
GET    /api/bookings/my
PUT    /api/bookings/:id/accept              (driver)
PUT    /api/bookings/:id/reject              (driver)
PUT    /api/bookings/:id/cancel

Wallet
POST   /api/wallet/topup
GET    /api/wallet/ledger

Reviews & Reports
POST   /api/reviews
POST   /api/reports
GET    /api/reports                          (admin)
PUT    /api/reports/:id                      (admin)

Admin
GET    /api/admin/vehicles/pending
PUT    /api/admin/vehicles/:regNo/verify
GET    /api/admin/stats
PUT    /api/admin/fuelrate
```

---

## 12. Security Requirements

- Passwords: bcrypt hashing, never plain text.
- Auth: JWT with `{ userId (collegeId), roles }`, verified on every protected route via middleware.
- Authorization: RBAC middleware restricting routes by role; a route like `/driver/create-ride` must reject non-drivers even with a valid token.
- Input validation on all write endpoints (email format, phone format, vehicle reg format, seat counts, dates).
- Booking seat-decrement must be an atomic operation (e.g. `findOneAndUpdate` with a seat-count guard condition) to prevent a race condition double-booking the last seat.
- Environment variables for all secrets (`JWT_SECRET`, `MONGODB_URI`, Cloudinary keys) — never hardcoded or committed.
- HTTPS, CORS restricted to the frontend origin, basic rate limiting on auth endpoints.

---

## 13. Build Order (for an implementing LLM)

Recommended phase order — build and verify each before moving to the next:

1. Scaffolding (monorepo, Express + Mongoose connection, React + Vite + Tailwind shell)
2. All 12 data models from §6
3. Auth & RBAC (§8)
4. Vehicles + Route Pools + Admin vehicle verification
5. Fuel rates + daily ride generation job
6. Matching engine as an isolated, unit-tested service (§7.1)
7. Bookings + escrow wallet + roster lock job (§7.2, §7.3) — the most logic-heavy phase, build carefully
8. Trust graph + reviews + reports
9. Notifications + admin dashboard
10. Frontend flows for rider/driver/admin

Each phase should be functionally complete and testable before the next begins — do not generate the entire codebase in one pass.
