// api/dashboardApi.js
import axios from "axios";

const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const resolveBackendBase = () => {
  let raw = import.meta.env.VITE_API_URL;

  if (!raw && typeof window !== "undefined") {
    raw = window.location.origin;
  }

  if (!raw) return "";

  let base = raw.replace(/\/+$/, "");

  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }

  return base;
};

const backendBase = resolveBackendBase();

export const dashboardAPI = axios.create({
  baseURL: isLocalhost
    ? "http://localhost:5000/api/admin"
    : backendBase
      ? `${backendBase}/api/admin`
      : "",
  withCredentials: true,
});

dashboardAPI.interceptors.request.use(
  (config) => {
    let token = null;

    if (typeof window !== 'undefined') {
      try {
        token = window.localStorage.getItem('authToken') || null;
      } catch (_) {
        token = null;
      }
    }

    if (!token && typeof document !== 'undefined') {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; token=`);
      if (parts.length === 2) {
        token = parts.pop().split(';').shift();
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export const fetchDashboardMetrics = () => dashboardAPI.get("/dashboard-metrics");
export const fetchAnalytics = (period = 'month') => dashboardAPI.get(`/analytics?period=${period}`);
export const fetchRealtimeMetrics = () => dashboardAPI.get("/realtime-metrics");