/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('commuto_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('commuto_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  // Starts true whenever a token exists, so ProtectedRoute doesn't
  // redirect to /login for a split second before verification finishes.
  const [loading, setLoading] = useState(!!localStorage.getItem('commuto_token'));

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('commuto_token');
    localStorage.removeItem('commuto_user');
  };

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('commuto_token', userToken);
    localStorage.setItem('commuto_user', JSON.stringify(userData));
  };

  const updateUser = (updatedFields) => {
    setUser((prev) => {
      const nextUser = { ...prev, ...updatedFields };
      localStorage.setItem('commuto_user', JSON.stringify(nextUser));
      return nextUser;
    });
  };

  // Phase 2: on app load, if a token exists, verify it against the
  // backend instead of blindly trusting the cached localStorage user.
  // Handles the case where the token expired since the last visit, or
  // the account was changed/removed server-side.
  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await getCurrentUser();
        setUser(data.user);
        localStorage.setItem('commuto_user', JSON.stringify(data.user));
      } catch {
        // Token invalid/expired — the api.js response interceptor already
        // cleared localStorage; mirror that in state here too.
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
    // Deliberately only re-runs if the token itself changes (e.g. after
    // login/logout), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;