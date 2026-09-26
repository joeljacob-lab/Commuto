/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Initialize state directly from localStorage
  const [token, setToken] = useState(() => localStorage.getItem('commuto_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('commuto_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading] = useState(false);
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

  // Reserved for Phase 2: verify token validity with backend GET /api/auth/me
  useEffect(() => {
    if (token) {
      // Will verify token with backend in Phase 2
    }
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