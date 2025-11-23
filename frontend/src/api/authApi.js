// src/api/authApi.js
import axios from "axios";

// Base axios instance
const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/auth`
    : "http://localhost:5000/api/auth",
  withCredentials: true,
});

// =============== AUTH ENDPOINTS =============== //
export const authAPI = {
  register: (userData) => API.post("/register", userData),
  login: (userData) => API.post("/login", userData),
  logout: () => API.post("/logout"),
  profile: () => API.get("/profile"),
  updateProfile: (profileData) => API.put("/profile", profileData),
  changePassword: (passwordData) => API.put("/change-password", passwordData),
  forgotPassword: (emailData) => API.post("/forgot-password", emailData),
  resetPassword: (token, passwordData) =>
    API.put(`/reset-password/${token}`, passwordData),
};

export default authAPI;