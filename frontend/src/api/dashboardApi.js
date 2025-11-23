// api/dashboardApi.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/admin`
  : "http://localhost:5000/api/admin";

export const dashboardAPI = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export const fetchDashboardMetrics = () => dashboardAPI.get("/dashboard-metrics");
export const fetchAnalytics = (period = 'month') => dashboardAPI.get(`/analytics?period=${period}`);
export const fetchRealtimeMetrics = () => dashboardAPI.get("/realtime-metrics");