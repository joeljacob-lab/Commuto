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
| **Phase 3** | Departments (CRUD, seed script, registration dropdown) | Pending | Depends on Phase 2 |
| **Phase 4** | Vehicles & Admin Verification Queue (regNo PK, Cloudinary docs) | Pending | Depends on Phase 3 |
| **Phase 5** | Fuel Rates Management (Historical rate tracking) | Pending | Depends on Phase 4 |
| **Phase 6** | Route Pools (Driver recurring pools, map polylines & distance) | Pending | Depends on Phase 5 |
| **Phase 7** | Daily Ride Generation Job (Snapshot fuel rates, lock time) | Pending | Depends on Phase 6 |
| **Phase 8** | Matching Engine (Pure deterministic scoring function + unit tests) | Pending | Depends on Phase 7 |
| **Phase 9** | Bookings, Escrow Wallet & Roster Lock Job (Atomic seats, ledger holds) | Pending | Depends on Phase 8 |
| **Phase 10** | Trust Graph, Reviews, Reports (Pairwise trustedge, mutual rating) | Pending | Depends on Phase 9 |
| **Phase 11** | Notifications (Socket.IO + In-app persistence) | Pending | Depends on Phase 10 |
| **Phase 12** | Admin Dashboard & Stats (Platform counts, report handling) | Pending | Depends on Phase 11 |
| **Phase 13** | Frontend Polish & Full End-to-End Verification Flow | Pending | Final Phase |

---

## 2. Current Implementation Status (End of Phase 2)

### Backend
* **Database & Config**: Mongoose models fully initialized using ESM. Natural keys correctly implemented for `User` (`collegeId`) and `Vehicle` (`registrationNumber`). Environment fully configured.
* **`backend/server.js`**:
  * Express app with CORS (`credentials: true`, pointing to `CLIENT_URL`), JSON parsing (`10mb` limit), and urlencoded body parsing.
  * Root health routes implemented: `GET /` and `GET /api/health`.
  * Error middleware wired: `notFound` (404) and `errorHandler`.
  * API mounted: `app.use('/api/auth', authRoutes)`.
* **Auth & RBAC**:
  * Controllers: `registerUser` (with unique checks and domain constraints), `loginUser`, `getMe`.
  * Middleware: `protect` (JWT verification) and `requireRole` (RBAC access checks) working correctly.

### Frontend
* **Build Stack**: React 19 + Vite 8 + Tailwind CSS v4 + React Router v7.
* **`frontend/src/services/api.js`**: Axios client configured with `baseURL`, a request interceptor for auto-injecting `Authorization: Bearer <token>`, and a response interceptor to handle `401 Unauthorized` responses gracefully.
* **`frontend/src/context/AuthContext.jsx`**:
  * Implemented full token verification against `/api/auth/me` on load.
  * Correctly toggles `loading` state while fetching session validity.
* **Routing**: `App.jsx` updated with `<Login>` and `<Register>` routes along with Phase 0 placeholders.

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
* **Phase to Reintroduce:** **Phases 3 through 12**
* **Context:** Root `/` and `/api/health` endpoints are active, and Phase 2 (`/api/auth`) is mounted.
* **What to mount sequentially:**
  * Phase 3: `app.use('/api/departments', departmentRoutes)`
  * Phase 4: `app.use('/api/vehicles', vehicleRoutes)`
  * Phase 5: `app.use('/api/fuelrates', fuelRateRoutes)`
  * Phase 6: `app.use('/api/routepools', routePoolRoutes)`
  * Phase 7 & 8: `app.use('/api/rides', rideRoutes)`
  * Phase 9: `app.use('/api/bookings', bookingRoutes)` & `app.use('/api/wallet', walletRoutes)`
  * Phase 10: `app.use('/api/reviews', reviewRoutes)` & `app.use('/api/reports', reportRoutes)`
  * Phase 11: `app.use('/api/notifications', notificationRoutes)`
  * Phase 12: `app.use('/api/admin', adminRoutes)`

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
* **Phase Effective:** **Phase 1 & Phase 10**
* **Context:** Previously, `Report` had an enum `reason` field (`unsafe_driving`, `no_show`, etc.).
* **Updated Design:** The `reason` field has been removed in favor of free-form `description` text. Controller and frontend report submissions in Phase 10 will send complaint context via `description` without enum constraints.

### [REG-09] Module System Standardization — ES Modules (ESM) Only
* **Phase Effective:** **Phase 1 Onwards**
* **Context:** Backend was originally scaffolded using CommonJS (`type: "commonjs"`, `require`, `module.exports`).
* **Updated Design:** The entire project (both backend and frontend) is standardized on modern ES Modules (`import` / `export` / `export default`). `backend/package.json` must be set to `"type": "module"`. In Node.js ESM, local relative imports must include explicit `.js` extensions (e.g., `import User from './models/User.js';`).

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
