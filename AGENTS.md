# COMMUTO — PROJECT MEMORY & SYSTEM GUIDELINES

## Project Overview
**Commuto** is a college-exclusive recurring carpool and cost-sharing platform (MCA final year project).
* **Tagline:** *Because someone's already driving your way.*
* **Core Concept:** Turn a college's fixed timetable and commuting population into an internal transit network. Students traveling the same corridor split daily fuel cost fairly, verified through college identity, natural-key records, and a pairwise trust graph.
* **Architecture:** Modular Monolith (Node.js/Express backend + React 19/Vite/Tailwind v4 frontend + MongoDB Mongoose + Socket.IO + Cloudinary).

---

## Master Documentation Reference
All detailed specifications are permanently maintained in `docs/`:
- [`docs/Commuto_Master_Spec.md`](file:///c:/Users/joelj/OneDrive/Desktop/Commuto/docs/Commuto_Master_Spec.md) — Complete specifications, workflows, API surface, security, and algorithms.
- [`docs/Commuto_Database_Schema_v2.md`](file:///c:/Users/joelj/OneDrive/Desktop/Commuto/docs/Commuto_Database_Schema_v2.md) — 12 collections, natural key design, constraints, and indexes.
- [`docs/Commuto_Implementation_Cycle.md`](file:///c:/Users/joelj/OneDrive/Desktop/Commuto/docs/Commuto_Implementation_Cycle.md) — Phased build order (Phase 0 to Phase 13) and verification steps.

---

## Critical Architectural & Database Rules (Schema v2)

1. **Natural Primary Keys (`_id: false` in Mongoose schema options):**
   - **`User`**: `_id` is String (College Roll/Admission Number, e.g. `"MCA2024017"`).
     - *Removed:* `verificationLevel` (college domain email + OTP ensures 100% verified accounts by definition).
     - *Removed:* `rating` / `ratingCount` (derived dynamically on demand: `AVG(reviews.rating) WHERE toUserId = X`).
   - **`Vehicle`**: `_id` is String (Registration number normalized uppercase, no spaces/hyphens, e.g. `"KL07AB1234"`). Pre-save hook normalizes before save.
   - All other 10 collections (`department`, `routepool`, `ride`, `fuelrate`, `booking`, `walletledger`, `trustedge`, `review`, `report`, `notification`) use default auto-generated `ObjectId`.
2. **Foreign Key Typing:**
   - Any reference to `User` (`driverId`, `ownerId`, `passengerId`, `userId`, `userA`, `userB`, `fromUserId`, `toUserId`, `reportedBy`, `against`, `setBy`, `verifiedBy`, `handledBy`) MUST be `{ type: String, ref: 'User' }`, NOT `ObjectId`.
   - Any reference to `Vehicle` (`vehicleId`) MUST be `{ type: String, ref: 'Vehicle' }`.
   - Any reference to `Department` (`deptId`) MUST be `{ type: mongoose.Schema.Types.ObjectId, ref: 'Department' }`.
3. **Escrow & Wallet Ledger:**
   - Append-only audit trail in `walletledger` (`topup`, `hold`, `release`, `forfeit`, `payout`, `withdrawal`).
   - `walletBalance` in `users` represents available spendable balance (excluding held amounts).
4. **Matching Engine (§7.1):**
   - Pure, deterministic function: `(riderQuery, candidateRides) => rankedRides`.
   - `MatchScore = 0.4·RouteOverlap + 0.25·TimeProximity + 0.2·BoardingDistance + 0.15·TrustSignal`.
   - Haversine formula for distance. Isolated and unit-tested.
5. **Daily Cost Calculation (§7.2):**
   - `dailyTripCost = (distanceKm / mileageKmpl) * fuelPricePerLitreUsed`.
   - `costPerHead = dailyTripCost / confirmedHeadcount`.
   - Frozen on `rides` as `costPerHeadFinal` at `rosterLockAt`.
6. **Roster Lock & Cancellation Rules (§7.3):**
   - Atomic seat reservation via `findOneAndUpdate` with seat-count guard.
   - Cancel before lock: Hold released to rider; remaining riders' estimated share recalculated.
   - Cancel/no-show after lock: Hold forfeited to driver (driver made whole).
7. **Pairwise Trust Graph (`trustedges`):**
   - Exactly one record per user pair (`userA < userB` by collegeId convention).
   - Tracks `mutualRideCount`, `sharedDepartment`, `reportFlags`.

---

## Phased Execution Roadmap
Build strictly in dependency order:
- **Phase 0:** Project Scaffolding & environment config.
- **Phase 1:** 12 Mongoose Models (with Natural Keys).
- **Phase 2:** Auth & RBAC (JWT, bcrypt, college email constraint).
- **Phase 3:** Departments & Seed script.
- **Phase 4:** Vehicles & Admin Verification Queue.
- **Phase 5:** Fuel Rates Management.
- **Phase 6:** Route Pools & Map integration.
- **Phase 7:** Daily Ride Generation Job.
- **Phase 8:** Matching Engine (pure service + unit tests).
- **Phase 9:** Bookings, Escrow Wallet, and Roster Lock Job.
- **Phase 10:** Trust Graph, Reviews, Reports.
- **Phase 11:** Notifications (Socket.IO + In-app).
- **Phase 12:** Admin Dashboard & Stats.
- **Phase 13:** Frontend Polish & Full End-to-End Verification.
