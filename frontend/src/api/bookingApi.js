import axios from "axios";

// Prefer local backend when running on localhost
const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const API = axios.create({
  baseURL: isLocalhost
    ? "http://localhost:5000/api/bookings"
    : import.meta.env.VITE_API_URL
      ? `${import.meta.env.VITE_API_URL}/api/bookings`
      : "http://localhost:5000/api/bookings",
  withCredentials: true,
});

// Add request interceptor to include token in headers
API.interceptors.request.use(
  (config) => {
    const token = getCookie('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(' Token added to request');
    } else {
      console.warn(' No token found in cookies');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

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
      console.error(' Authentication failed');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Get user's bookings (hits GET /api/bookings/my-bookings)
export const getMyBookings = () => {
  console.log(' Fetching my bookings...');
  return API.get("/my-bookings");
};

// FETCH ALL BOOKINGS (Admin) - GET /api/bookings
export const getBookings = () => {
  console.log(' Fetching all bookings...');
  return API.get("/");
};

// Other API calls
export const approveBookingApi = (id) => {
  console.log(' Approving booking:', id);
  return API.put(`/${id}/approve`);
};

export const rejectBookingApi = (id) => {
  console.log(' Rejecting booking:', id);
  return API.put(`/${id}/reject`);
};

export const refundBookingApi = (id, type) => {
  console.log(' Processing refund:', { id, type });
  return API.post(`/${id}/refund`, { type });
};

export const createBooking = (data) => {
  console.log(' Creating booking...');
  return API.post("/", data);
};

// ADD: Request refund
export const requestRefundApi = (id, data) => {
  console.log(' Requesting refund:', { id, data });
  return API.post(`/${id}/request-refund`, data);
};

// Get booking details (return full Axios response like other helpers)
export const getBookingDetails = (bookingId) => {
  console.log(' Fetching booking details:', bookingId);
  return API.get(`/${bookingId}`);
};