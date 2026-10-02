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

// --- Department endpoints ---
export const getDepartments = () => api.get('/departments');
export const createDepartment = (data) => api.post('/departments', data);
export const updateDepartment = (id, data) => api.put(`/departments/${id}`, data);
export const deleteDepartment = (id) => api.delete(`/departments/${id}`);

// --- Vehicle endpoints ---
export const addVehicle = (data) => api.post('/vehicles', data);
export const getMyVehicles = () => api.get('/vehicles/me');
export const getPendingVehicles = () => api.get('/vehicles/pending');
export const updateVehicleStatus = (id, status) => api.put(`/vehicles/${id}/status`, { status });

// --- Fuel Rate endpoints ---
export const getCurrentFuelRate = () => api.get('/fuelrates/current');
export const getFuelRateHistory = () => api.get('/fuelrates/history');
export const setFuelRate = (data) => api.post('/fuelrates', data);

// --- RoutePool endpoints ---
export const createRoutePool = (data) => api.post('/routepools', data);
export const getMyRoutePools = () => api.get('/routepools/my');
export const toggleRoutePoolStatus = (id) => api.put(`/routepools/${id}/status`);
export const deleteRoutePool = (id) => api.delete(`/routepools/${id}`);

// --- Ride endpoints ---
export const createOneOffRide = (data) => api.post('/rides', data);
export const getMyDriverRides = () => api.get('/rides/my');
export const getRideDetails = (id) => api.get(`/rides/${id}`);
export const triggerDailyGeneration = (date) => api.post('/rides/generate-daily', { date });

// ----Ride search endpoint----
export const searchRides = (params) => {
  const queryString = new URLSearchParams(params).toString();
  return api.get(`/rides/search?${queryString}`);
};

export default api;