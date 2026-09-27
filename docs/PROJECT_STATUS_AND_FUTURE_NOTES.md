# Commuto — Project Status & Future Reference Registry

**File Purpose:**  
This document tracks the current execution state of the Commuto project, detailed component status, and a **Future Reference Registry** of code segments, imports, or behaviors that have been temporarily adjusted, simplified, or stubbed in the current phase and must be reintroduced or updated in a specific future phase.

> **Maintenance Rule:** This file is updated only when explicitly requested by the user.

---

## 1. Overall Phase Progress

| Phase | Description | Status | Target / Completed |
|---|---|---|---|
| **Phase 0** | Project Scaffolding, DB Config, Socket.IO Server, React/Vite/Tailwind Shell, AuthContext Skeleton | **COMPLETED** | Fully verified & error-free |
| **Phase 1** | Data Models (12 Mongoose Models with Natural Keys) | **READY TO START** | Next Phase |
| **Phase 2** | Auth & RBAC (JWT, bcrypt, college domain email, `/api/auth/me`) | Pending | Depends on Phase 1 |
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

## 2. Current Implementation Status (End of Phase 0)

### Backend
* **`backend/config/db.js`**: Connects via Mongoose to `process.env.MONGODB_URI`. Logs connection host or displays helpful diagnostic warning if connection is refused in development mode.
* **`backend/server.js`**:
  * Express app with CORS (`credentials: true`, pointing to `CLIENT_URL`), JSON parsing (`10mb` limit), and urlencoded body parsing.
  * HTTP server wrapping Express with **Socket.IO** attached (`app.set('io', io)`).
  * Root health routes implemented: `GET /` and `GET /api/health` (reports uptime, timestamp, and database ready state).
  * Error middleware wired: `notFound` (404) and `errorHandler`.
* **`backend/.env` & `backend/.env.example`**: Configured with standard environment variables (`PORT=5000`, `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `COLLEGE_EMAIL_DOMAIN`, Cloudinary keys).
* **`backend/middleware/errorMiddleware.js`**: Standardized JSON error response formatting with production stack suppression.

### Frontend
* **Build Stack**: React 19 + Vite 8 + Tailwind CSS v4 + React Router v7. Builds with 0 errors (`npm run build` passes cleanly).
* **`frontend/src/services/api.js`**: Axios client configured with `baseURL: http://localhost:5000/api` and request interceptor that auto-injects `Authorization: Bearer <token>` from `localStorage`.
* **`frontend/src/context/AuthContext.jsx`**:
  * Exposes `user`, `token`, `loading`, `isAuthenticated`, `login`, `logout`, `updateUser`, and `useAuth()` hook.
  * Direct state initialization from `localStorage` (`commuto_token` and `commuto_user`).
* **`frontend/src/App.jsx`**: Configured with `BrowserRouter`, `AuthProvider`, and clean Phase 0 landing page with zero linter errors or warnings.
* **`frontend/src/index.css` & `App.css`**: Configured for clean Tailwind v4 utility styling with no template layout restrictions.

---

## 3. Future Reference Registry (Items Temporarily Deferred / Reserved)

The following items were simplified or deferred to keep the codebase completely free of linter errors (`no-unused-vars`, cascading re-render warnings, etc.) during Phase 0. They are scheduled to be re-added in subsequent phases:

### [REG-01] `AuthContext.jsx` — Token Verification on App Launch (`/api/auth/me`)
* **Phase to Reintroduce:** **Phase 2 (Auth & RBAC)**
* **Context:** In Phase 0, `user` and `token` are loaded synchronously from `localStorage`. Calling `setToken(storedToken)` inside `useEffect` caused an unnecessary re-render warning in React.
* **What to add back in Phase 2:**
  ```jsx
  // Inside AuthContext.jsx:
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser(res.data.user);
        } catch (err) {
          console.error('Session expired or invalid token', err);
          logout();
        }
      }
      setLoading(false);
    };
    verifySession();
  }, [token]);
  ```

### [REG-02] `AuthContext.jsx` — `api` Client Import
* **Phase to Reintroduce:** **Phase 2 (Auth & RBAC)**
* **Context:** `import api from '../services/api';` was removed from `AuthContext.jsx` in Phase 0 because no API endpoints exist yet, which triggered ESLint's `no-unused-vars` error.
* **What to add back in Phase 2:** Re-import `api` when wiring login, registration, and `/api/auth/me` session validation.

### [REG-03] `AuthContext.jsx` — `loading` State Dynamic Toggle
* **Phase to Reintroduce:** **Phase 2 (Auth & RBAC)**
* **Context:** `const [loading] = useState(false);` (or `const loading = false;`) was used in Phase 0 because auth initialization is synchronous. `setLoading` was flagged as unused by ESLint.
* **What to add back in Phase 2:** Restore `const [loading, setLoading] = useState(true);` to allow splash/loading spinners while the initial JWT check against the backend is running.

### [REG-04] `server.js` — API Route Mounts
* **Phase to Reintroduce:** **Phases 2 through 12**
* **Context:** Only root `/` and `/api/health` endpoints are active in `server.js`.
* **What to mount sequentially:**
  * Phase 2: `app.use('/api/auth', authRoutes)`
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
