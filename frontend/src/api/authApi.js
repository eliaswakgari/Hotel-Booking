// src/api/authApi.js
import axios from "axios";

// Base axios instance
const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const API = axios.create({
  // In local dev, always talk to local backend regardless of VITE_API_URL
  baseURL: isLocalhost
    ? "http://localhost:5000/api/auth"
    : import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api/auth`
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