// frontend/src/features/audit/auditSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

// Configure axios for audit endpoints (local + production)
const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const resolveBackendBase = () => {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return "";
  let base = raw.replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }
  return base;
};

const backendBase = resolveBackendBase();

const auditAxios = axios.create({
  baseURL: isLocalhost
    ? "http://localhost:5000/api"
    : backendBase
      ? `${backendBase}/api`
      : "http://localhost:5000/api",
  withCredentials: true,
});

export const fetchAuditMetrics = createAsyncThunk(
  "audit/fetchAuditMetrics",
  async () => {
    const { data } = await auditAxios.get("/audit");
    return data;
  }
);

const auditSlice = createSlice({
  name: "audit",
  initialState: {
    metrics: {},
    loading: false,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditMetrics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAuditMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchAuditMetrics.rejected, (state) => {
        state.loading = false;
      });
  },
});

export default auditSlice.reducer;
