// api/notificationApi.js
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

// ✅ Get all notifications
export const getNotifications = () => {
  console.log('📞 Fetching notifications...');
  return API.get("/notifications");
};

// ✅ Get single notification details
export const getNotificationDetails = (notificationId) => {
  console.log('📞 Fetching notification details:', notificationId);
  return API.get(`/notifications/${notificationId}`);
};
// api/notificationApi.js
export const markAsRead = async (notificationId) => {
  try {
    console.log('📞 Marking notification as read:', notificationId);
    const response = await API.put(`/notifications/${notificationId}/read`);
    return response.data;
  } catch (error) {
    console.error('Mark as read API error:', error);
    
    // Provide more specific error message
    if (error.response?.status === 404) {
      throw new Error('Notification not found or you do not have permission to access it');
    } else if (error.response?.status === 401) {
      throw new Error('Authentication required');
    } else {
      throw new Error(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
};

export const markAllAsRead = async () => {
  try {
    console.log('📞 Marking all notifications as read');
    const response = await API.put("/notifications/read-all");
    return response.data;
  } catch (error) {
    console.error('Mark all as read API error:', error);
    throw new Error(error.response?.data?.message || 'Failed to mark all notifications as read');
  }
};

// ✅ Delete notification
export const deleteNotification = (notificationId) => {
  console.log('📞 Deleting notification:', notificationId);
  return API.delete(`/notifications/${notificationId}`);
};

export default API;