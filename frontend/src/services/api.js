import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Attach the JWT to every outgoing request automatically, so individual
// components never have to remember to do it themselves.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('commuto_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever responds 401 (expired/invalid token), clear local
// auth state so the UI doesn't sit in a broken "logged in but every
// request fails" state. Doesn't force-redirect here — AuthContext/
// ProtectedRoute decide what the UI does next.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('commuto_token');
      localStorage.removeItem('commuto_user');
    }
    return Promise.reject(error);
  }
);

// --- Auth endpoints ---
export const registerUser = (formData) => api.post('/auth/register', formData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const getCurrentUser = () => api.get('/auth/me');

export default api;