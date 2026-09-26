# Commuto — Database Table Design & Schema (v2)

Database: **MongoDB** (document store) — each "table" is a **collection**. This version replaces MongoDB's auto-generated `ObjectId` with **natural/business keys** where an external unique identifier genuinely exists (`collegeId` for users, `registrationNumber` for vehicles), normalizes `department` into its own collection (using standard auto-generated `ObjectId`), and removes two fields that shouldn't have been stored on `users` in the first place. Collections with no natural key candidate (`department`, `review`, `report`, `notification`, `trustedge`, `walletledger`, `fuelrate`, `routepool`, `ride`, `booking`) keep the default auto-generated `_id` (`ObjectId`).

12 collections total: `department`, `user`, `vehicle`, `routepool`, `ride`, `fuelrate`, `booking`, `walletledger`, `trustedge`, `review`, `report`, `notification`.

**Design note on natural keys:** using `collegeId` or `registrationNumber` as `_id` is valid in MongoDB (Mongoose accepts any type for `_id` if you supply it at creation) — but it only works because these values are guaranteed unique and immutable after creation. Because natural-key `_id`s don't carry ObjectId's built-in creation-time ordering, every collection below keeps an explicit `createdAt` for sorting/pagination.

---

## 1. `department` *(new)*

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | **PK**, auto-generated | Default auto-generated ObjectId |
| `deptName` | String | required | e.g. "Computer Science and Engineering" |
| `programName` | String | required | e.g. "B.Tech", "MCA" |

**Indexes:** none needed beyond the PK — small, mostly-static lookup table.

---

## 2. `user`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | String | **PK** = `collegeId` (e.g. `"MCA2024017"`) | Roll number / admission ID doubles as the primary key — unique by definition, no separate index needed |
| `name` | String | required | |
| `email` | String | required, unique, college domain only | |
| `passwordHash` | String | required | bcrypt hash |
| `phone` | String | required, unique | |
| `deptId` | ObjectId | FK → `departments._id`, required | References departments collection |
| `year` | Number | required | Current year/semester |
| `roles` | [String] | enum: `rider`, `driver`, `admin` | Multi-role support |
| `walletBalance` | Number | default 0 | Spendable balance (excludes held amounts) |
| `profileImageUrl` | String | optional | Cloudinary URL |
| `emergencyContactName` | String | optional | |
| `emergencyContactPhone` | String | optional | |
| `createdAt` | Date | auto | |
| `updatedAt` | Date | auto | |

**Removed from v1, and why:**
- `verificationLevel` — dropped. Registration already requires a college-domain email + OTP before an account can exist at all, so there's no genuine "unverified" state left to track afterward; every row is verified by construction. *(If a manual document-review step is ever added, that state would need its own small collection — it has nowhere to live in `users` anymore.)*
- `rating`, `ratingCount` — dropped. These were a cached rolling average, i.e. denormalized data. Rating is now a **derived value**, computed on demand: `AVG(reviews.rating) WHERE reviews.toUserId = this user`. Removes write amplification and staleness risk; fine at this dataset size. *(If read performance ever becomes a concern, a small `userStats` cache collection can be added back later without touching `users` itself.)*

**Indexes:** unique on `email`, unique on `phone`, index on `deptId`.

---

## 3. `vehicle`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | String | **PK** = `registrationNumber`, normalized uppercase/no-spaces (e.g. `"KL07AB1234"`) | |
| `ownerId` | String | FK → `users._id` (collegeId), required | |
| `model` | String | required | |
| `type` | String | enum: `car`, `bike` | |
| `color` | String | optional | |
| `seats` | Number | required, min 1 | Passenger capacity (excluding driver) |
| `mileageKmpl` | Number | required | Drives daily cost calc |
| `documentUrls` | [String] | required, ≥1 | Cloudinary URLs of RC/insurance |
| `verificationStatus` | String | enum: `pending`, `approved`, `rejected`, default `pending` | Vehicle-level trust workflow — kept, distinct from the user-verification field that was removed above |
| `verifiedBy` | String | FK → `users._id`, optional | Admin who approved it |
| `createdAt` | Date | auto | |

**Caveat worth noting in your report:** a registration number is a reasonable PK for a single-college academic project, but in the real world plates can occasionally be reassigned/re-registered — a natural key that can change is a known risk of this pattern. Fine here; flag it as a known trade-off, not an oversight.

**Indexes:** index on `ownerId`.

---

## 4. `routepool`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | No natural key candidate — a pool has no external unique identifier of its own |
| `driverId` | String | FK → `users._id`, required | |
| `vehicleId` | String | FK → `vehicles._id`, required | |
| `origin` | GeoJSON Point | required | `{lat, lng, label}` |
| `destination` | GeoJSON Point | required | `{lat, lng, label}` |
| `routePolyline` | [GeoJSON Point] | required | Ordered path from Maps API |
| `recurrenceDays` | [String] | enum: `Mon`..`Sun` | |
| `departureWindowStart` | String | required, `HH:mm` | Flexible range, not a fixed time — actual daily departure is set per `ride` |
| `departureWindowEnd` | String | required, `HH:mm` | |
| `distanceKm` | Number | required | Fixed route distance |
| `maxMembers` | Number | required | ≤ vehicle seats |
| `status` | String | enum: `active`, `paused`, `ended` | |
| `createdAt` | Date | auto | |

*(`costPerTrip` was already removed in an earlier revision — cost is computed daily on `rides`, never stored statically here.)*

**Indexes:** index on `driverId`, `2dsphere` geo-index on `origin`/`destination`, index on `status`.

---

## 5. `ride`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | One document per pool per day — no stable natural key |
| `routePoolId` | ObjectId | FK → `routepools._id`, nullable | Null if one-off ride |
| `driverId` | String | FK → `users._id`, required | |
| `vehicleId` | String | FK → `vehicles._id`, required | |
| `date` | Date | required | |
| `departureTime` | String | required, `HH:mm` | Actual time for this specific day, inside the pool's window |
| `origin` | GeoJSON Point | required | |
| `destination` | GeoJSON Point | required | |
| `routePolyline` | [GeoJSON Point] | required | |
| `boardingPoints` | [{label, lat, lng}] | required, ≥1 | |
| `availableSeats` | Number | required, ≥0 | |
| `totalSeats` | Number | required | |
| `fuelPricePerLitreUsed` | Number | required | Snapshot from `fuelrates` at generation time — frozen so past rides don't silently reprice |
| `estimatedCostPerHead` | Number | required | Live pre-lock estimate |
| `rosterLockAt` | Date | required | Headcount freezes here |
| `costLocked` | Boolean | default false | |
| `costPerHeadFinal` | Number | nullable | `(distanceKm / mileageKmpl × fuelPricePerLitreUsed) / confirmedHeadcount`, set at lock |
| `status` | String | enum: `published`, `booking`, `full`, `started`, `completed`, `cancelled` | |
| `createdAt` | Date | auto | |

**Indexes:** index on `driverId`, compound index on `date` + `status`, `2dsphere` geo-index on `origin`.

---

## 6. `fuelrate`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | A rate has no natural identity of its own |
| `pricePerLitre` | Number | required | |
| `effectiveDate` | Date | required | |
| `setBy` | String | FK → `users._id`, optional | |

**Indexes:** index on `effectiveDate` (descending).

---

## 7. `booking`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | A booking is an event, not an entity with external identity |
| `rideId` | ObjectId | FK → `rides._id`, required | |
| `passengerId` | String | FK → `users._id`, required | |
| `boardingPoint` | {label, lat, lng} | required | |
| `status` | String | enum: `requested`, `confirmed`, `rejected`, `cancelled`, `completed`, default `requested` | |
| `holdAmountProvisional` | Number | required | Locked at request time |
| `holdAmountFinal` | Number | nullable | Set at roster lock; delta refunded/topped-up |
| `holdStatus` | String | enum: `held`, `released`, `forfeited`, default `held` | |
| `requestedAt` | Date | auto | |
| `confirmedAt` | Date | optional | |
| `cancelledAt` | Date | optional | |
| `cutoffDeadline` | Date | computed | = ride's `rosterLockAt` |

**Indexes:** compound unique index on `(rideId, passengerId)`, index on `passengerId` + `status`.

---

## 8. `walletledger`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | Append-only audit log entries have no natural key |
| `userId` | String | FK → `users._id`, required | |
| `bookingId` | ObjectId | FK → `bookings._id`, nullable | |
| `type` | String | enum: `topup`, `hold`, `release`, `forfeit`, `payout`, `withdrawal` | |
| `amount` | Number | required | |
| `balanceAfter` | Number | required | |
| `createdAt` | Date | auto | |

**Indexes:** index on `userId` + `createdAt`, index on `bookingId`.

---

## 9. `trustedge`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | The pair itself has no single natural identifier |
| `userA` | String | FK → `users._id`, required | Smaller `collegeId` of the pair, by convention |
| `userB` | String | FK → `users._id`, required | |
| `sharedDepartment` | Boolean | default false | Cached at edge-creation from both users' `deptId`; could be computed live instead, kept here for cheap reads |
| `mutualRideCount` | Number | default 0 | |
| `reportFlags` | Number | default 0 | |
| `lastRideAt` | Date | optional | |

**Indexes:** compound unique index on `(userA, userB)`.

---

## 10. `review`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `rideId` | ObjectId | FK → `rides._id`, required | |
| `fromUserId` | String | FK → `users._id`, required | |
| `toUserId` | String | FK → `users._id`, required | |
| `rating` | Number | required, 1–5 | Source of the derived user rating — see §2 |
| `comment` | String | optional | |
| `createdAt` | Date | auto | |

**Indexes:** compound unique index on `(rideId, fromUserId, toUserId)`, index on `toUserId` (feeds the rating aggregation).

---

## 11. `report`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `reportedBy` | String | FK → `users._id`, required | |
| `against` | String | FK → `users._id`, required | |
| `rideId` | ObjectId | FK → `rides._id`, optional | |
| `description` | String | optional | |
| `status` | String | enum: `open`, `investigating`, `resolved`, `dismissed`, default `open` | |
| `handledBy` | String | FK → `users._id`, optional | |
| `createdAt` | Date | auto | |

**Indexes:** index on `against` + `status`, index on `reportedBy`.

---

## 12. `notification`

| Field | Type | Constraints | Description |
|---|---|---|---|
| `_id` | ObjectId | PK, auto | |
| `userId` | String | FK → `users._id`, required | |
| `type` | String | enum: `booking_request`, `booking_accepted`, `booking_rejected`, `ride_reminder`, `ride_cancelled`, `report_update` | |
| `message` | String | required | |
| `relatedRideId` | ObjectId | FK → `rides._id`, optional | |
| `read` | Boolean | default false | |
| `createdAt` | Date | auto | |

**Indexes:** index on `userId` + `read`.

---

## Entity Relationship Diagram (text form)

```
department ──1───*── user                    (deptId)
user ──1───*── vehicle                       (ownerId, PK=registrationNumber)
user ──1───*── routepool                     (driverId)
routepool ──1───*── ride                     (daily instances)
fuelrate ──1───*── ride                      (rate snapshotted per date)
ride ──1───*── booking
user ──1───*── booking                       (passengerId)
user ──1───*── walletledger
booking ──1───1── walletledger entries        (hold/release/forfeit rows reference it)
user ──*───*── trustedge ──*───*── user
ride ──1───*── review
user ──1───*── review                        (fromUserId, toUserId)
user ──1───*── report                        (reportedBy, against)
ride ──1───*── report                        (optional context)
user ──1───*── notification
```

---

## Mongoose Schema Stubs (for direct use in `backend/models/`)

```javascript
// models/Department.js
const departmentSchema = new Schema({
  deptName: { type: String, required: true },
  programName: { type: String, required: true },
}, { timestamps: true });                 // Uses default auto-generated ObjectId _id

// models/User.js
const userSchema = new Schema({
  _id: { type: String },                  // collegeId, set explicitly at registration
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  deptId: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
  year: { type: Number, required: true },
  roles: { type: [String], enum: ['rider', 'driver', 'admin'], default: ['rider'] },
  walletBalance: { type: Number, default: 0 },
  profileImageUrl: String,
  emergencyContactName: String,
  emergencyContactPhone: String,
}, { _id: false, timestamps: true });

// models/Vehicle.js
const vehicleSchema = new Schema({
  _id: { type: String },                  // registrationNumber, normalized uppercase before save
  ownerId: { type: String, ref: 'User', required: true },
  model: { type: String, required: true },
  type: { type: String, enum: ['car', 'bike'] },
  color: String,
  seats: { type: Number, required: true, min: 1 },
  mileageKmpl: { type: Number, required: true },
  documentUrls: { type: [String], required: true },
  verificationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  verifiedBy: { type: String, ref: 'User' },
}, { _id: false, timestamps: true });

// Pre-save hook example to normalize the natural key before it becomes _id:
vehicleSchema.pre('save', function (next) {
  if (this.isNew) this._id = this._id.toUpperCase().replace(/\s|-/g, '');
  next();
});

// models/RoutePool.js, Ride.js, Booking.js, etc. — driverId / ownerId / passengerId / userId
// fields become { type: String, ref: 'User' } instead of ObjectId,
// and vehicleId becomes { type: String, ref: 'Vehicle' }.
```

**Implementation note on `_id: false`:** in Mongoose, setting `_id: false` in schema options stops it from auto-generating an ObjectId, so the value you assign to `_id` (collegeId, registrationNumber) is what actually gets stored.
