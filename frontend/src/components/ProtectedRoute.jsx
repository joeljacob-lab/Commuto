import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute — wraps a page that requires authentication, and
 * optionally a specific role. Waits for AuthContext's `loading` to finish
 * (token verification against GET /me) before deciding, so a logged-in
 * user isn't briefly bounced to /login while that check is in flight.
 *
 * Usage:
 *   <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
 *   <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AdminDashboard /></ProtectedRoute>} />
 */
function ProtectedRoute({ children, requiredRole }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500 text-sm">
        Checking your session...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && !user.roles?.includes(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;