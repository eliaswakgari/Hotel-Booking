// features/analytics/analyticsSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Configure axios to talk to the correct backend in both local dev and production
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

const analyticsAxios = axios.create({
  baseURL: isLocalhost
    ? "http://localhost:5000/api/admin"
    : backendBase
      ? `${backendBase}/api/admin`
      : "",
  withCredentials: true,
});

// Attach auth token like other admin APIs
analyticsAxios.interceptors.request.use(
  (config) => {
    let token = null;

    if (typeof window !== "undefined") {
      try {
        token = window.localStorage.getItem("authToken") || null;
      } catch (_) {
        token = null;
      }
    }

    if (!token && typeof document !== "undefined") {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; token=`);
      if (parts.length === 2) {
        token = parts.pop().split(";").shift();
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ✅ Async thunk to fetch analytics data (per-hotel performance)
export const fetchAnalytics = createAsyncThunk(
  "analytics/fetchAnalytics",
  async (period = "month", { rejectWithValue }) => {
    try {
      const { data } = await analyticsAxios.get(`/analytics?period=${period}`);
      // Backend returns an object; UI expects an array of hotel stats
      return data?.hotelPerformance || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const analyticsSlice = createSlice({
  name: "analytics",
  initialState: {
    data: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch analytics";
      });
  },
});

export default analyticsSlice.reducer;
