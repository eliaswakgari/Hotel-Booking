// src/api/usersApi.js
import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

// Add request interceptor for token
API.interceptors.request.use((config) => {
  const token = getCookie('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Helper function to get cookie
const getCookie = (name) => {
  if (typeof document === 'undefined') return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
  return null;
};

// Response interceptor to handle auth errors
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Authentication failed');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Users API endpoints
export const usersAPI = {
  // Get all users (Admin only)
  getUsers: () => API.get("/users"),
  
  // Update user role
  updateUserRole: (userId, role) => API.put(`/users/${userId}/role`, { role }),
  
  // Toggle user ban status
  toggleUserBan: (userId) => API.put(`/users/${userId}/ban`),
  
  // Verify user payment
  verifyPayment: (userId) => API.put(`/users/${userId}/verify-payment`),
};

export default usersAPI;