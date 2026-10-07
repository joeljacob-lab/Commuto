import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import ReportsQueue from './pages/admin/ReportsQueue.jsx';
import Navbar from './components/Navbar';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import RideDetails from './pages/RideDetails';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import Toaster from './components/ui/toaster';

function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="h-16 w-16 rounded-full bg-secondary text-primary flex items-center justify-center text-2xl font-bold font-mono mb-4 border border-border">
        404
      </div>
      <h1 className="text-2xl font-serif font-bold text-foreground mb-2">Page Not Found</h1>
      <p className="text-muted-foreground text-sm mb-6 max-w-sm">
        The corridor or terminal you were looking for doesn&apos;t exist or has moved.
      </p>
      <a href="/" className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-[var(--radius)] hover:bg-[#832323] transition">
        Return Home
      </a>
    </div>
  );
}

function HomeOrDashboard() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Dashboard /> : <Landing />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster defaultPosition="top-center" />
        <Navbar />
        <Routes>
          <Route path="/" element={<HomeOrDashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/rides/:id" element={<ProtectedRoute><RideDetails /></ProtectedRoute>} />
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