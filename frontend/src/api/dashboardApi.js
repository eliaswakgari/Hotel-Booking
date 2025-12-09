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

export const fetchDashboardMetrics = () => dashboardAPI.get("/dashboard-metrics");
export const fetchAnalytics = (period = 'month') => dashboardAPI.get(`/analytics?period=${period}`);
export const fetchRealtimeMetrics = () => dashboardAPI.get("/realtime-metrics");