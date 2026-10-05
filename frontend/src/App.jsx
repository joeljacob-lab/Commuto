import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
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
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ReportsQueue from './pages/admin/ReportsQueue.jsx';
import Navbar from './components/Navbar';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';

function PlaceholderHome() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
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

        {/* Phase Status Card */}
        <div className="mt-10 w-full max-w-lg bg-white border border-slate-200 rounded-xl p-6 shadow-xs text-left">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              System Core Status
            </h2>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
              ● Phase 13 Ready
            </span>
          </div>

          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>Matching Engine &amp; corridor scoring active</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>Escrow wallet, atomic reservations &amp; 9 PM lock</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>Pairwise trust graph, reviews &amp; safety triage</span>
            </li>
            <li className="flex items-start">
              <span className="text-emerald-500 font-bold mr-2">✓</span>
              <span>Real-time Socket.IO notifications &amp; admin analytics</span>
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
        <Navbar />
        <Routes>
          <Route path="/" element={<PlaceholderHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
          {/* Admin routes */}
          <Route path="/admin/departments" element={<ProtectedRoute requiredRole="admin"><DepartmentManagement /></ProtectedRoute>} />
          <Route path="/admin/vehicles/pending" element={<ProtectedRoute requiredRole="admin"><VehicleVerificationQueue /></ProtectedRoute>} />
          <Route path="/admin/fuel-rates" element={<ProtectedRoute requiredRole="admin"><FuelRateSettings /></ProtectedRoute>} />
          <Route path="/admin/dashboard" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute requiredRole="admin"><ReportsQueue /></ProtectedRoute>} />
          {/* Driver routes */}
          <Route path="/driver/vehicles/add" element={<ProtectedRoute requiredRole="driver"><VehicleForm /></ProtectedRoute>} />
          <Route path="/driver/routepools/create" element={<ProtectedRoute requiredRole="driver"><CreateRoutePool /></ProtectedRoute>} />
          <Route path="/driver/routepools" element={<ProtectedRoute requiredRole="driver"><MyRoutePools /></ProtectedRoute>} />
          <Route path="/driver/rides" element={<ProtectedRoute requiredRole="driver"><MyRides /></ProtectedRoute>} />
          <Route path="/driver/rides/create-single" element={<ProtectedRoute requiredRole="driver"><CreateOneOffRide /></ProtectedRoute>} />
          {/* Public / Rider routes */}
          <Route path="/search-rides" element={<SearchRides />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;