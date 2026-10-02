import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute';
import DepartmentManagement from './pages/admin/DepartmentManagement';
import Login from './pages/Login';
import Register from './pages/Register';
import VehicleForm from './pages/driver/VehicleForm.jsx';
import VehicleVerificationQueue from './pages/admin/VehicleVerificationQueue.jsx';
import FuelRateSettings from './pages/admin/FuelRateSettings';
import CreateRoutePool from './pages/driver/CreateRoutePool';
import MyRoutePools from './pages/driver/MyRoutePools';
import CreateOneOffRide from './pages/driver/CreateOneOffRide';
import MyRides from './pages/driver/MyRides';
import SearchRides from './pages/SearchRides.jsx';

function PlaceholderHome() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      {/* Header / Navbar Skeleton */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-9 w-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl shadow-xs">
              C
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">Commuto</span>
              <span className="hidden sm:inline-block ml-2 text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                Phase 0 Scaffold
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-slate-700 font-medium">Hello, {user?.name || 'User'}</span>
                <button
                  type="button"
                  onClick={logout}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-md transition cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-slate-500 hidden sm:inline">Guest Mode</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 flex flex-col items-center justify-center text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-200/60 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6">
          <span>College-Exclusive Carpool &amp; Cost-Sharing</span>
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-3xl">
          Because someone&apos;s already <span className="text-indigo-600">driving your way.</span>
        </h1>

        <p className="mt-5 text-lg text-slate-600 max-w-2xl leading-relaxed">
          Commuto turns your campus timetable into an internal transit network. Verified students traveling the same corridor split daily fuel cost fairly.
        </p>

        {/* Phase 0 Status Card */}
        <div className="mt-10 w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              System Initialization Status
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              ● Ready for Phase 1
            </span>
          </div>

          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>Express &amp; Socket.IO server configured with health endpoints</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>Mongoose configuration and database connection ready</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>React 19 + Vite + Tailwind v4 + React Router scaffolded</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>AuthContext &amp; Axios API client initialized</span>
            </li>
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-500">
          Commuto • MCA Final Year Project • Architecture: Modular Monolith
        </div>
      </footer>
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
      <h1 className="text-4xl font-bold text-slate-800 mb-2">404</h1>
      <p className="text-slate-600 mb-4">Page not found</p>
      <Link to="/" className="text-indigo-600 hover:underline text-sm font-medium">
        Return Home
      </Link>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PlaceholderHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<NotFound />} />
          <Route path="/admin/departments" element={<ProtectedRoute requiredRole="admin"> <DepartmentManagement /> </ProtectedRoute>}/>
          <Route path="/driver/vehicles/add" element={<ProtectedRoute requiredRole="driver"><VehicleForm /></ProtectedRoute>} />
          <Route path="/admin/vehicles/pending" element={<ProtectedRoute requiredRole="admin"><VehicleVerificationQueue /></ProtectedRoute>} />
          <Route path="/admin/fuel-rates" element={<ProtectedRoute requiredRole="admin"><FuelRateSettings /></ProtectedRoute>}/>
          <Route path="/driver/routepools/create" element={<ProtectedRoute requiredRole="driver"><CreateRoutePool /></ProtectedRoute>}/>
          <Route path="/driver/routepools" element={<ProtectedRoute requiredRole="driver"><MyRoutePools /></ProtectedRoute>}/>
          <Route path="/driver/rides" element={<ProtectedRoute requiredRole="driver"><MyRides /></ProtectedRoute>}/>
          <Route path="/driver/rides/create-single" element={<ProtectedRoute requiredRole="driver"><CreateOneOffRide /></ProtectedRoute>}/>
          <Route path="/search-rides" element={<SearchRides />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;