// features/dashboard/dashboardSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from '../../api/dashboardApi';

export const fetchDashboardMetrics = createAsyncThunk(
  'dashboard/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.fetchDashboardMetrics();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch dashboard metrics');
    }
  }
);

export const fetchAnalytics = createAsyncThunk(
  'dashboard/fetchAnalytics',
  async (period, { rejectWithValue }) => {
    try {
      const { data } = await api.fetchAnalytics(period);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch analytics');
    }
  }
);

export const fetchRealtimeMetrics = createAsyncThunk(
  'dashboard/fetchRealtimeMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.fetchRealtimeMetrics();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch realtime metrics');
    }
  }
);

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState: {
    metrics: null,
    analytics: null,
    realtimeMetrics: null,
    loading: false,
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateMetricsRealtime: (state, action) => {
      state.metrics = { ...state.metrics, ...action.payload };
    },
    updateAnalyticsRealtime: (state, action) => {
      state.analytics = { ...state.analytics, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Dashboard Metrics
      .addCase(fetchDashboardMetrics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardMetrics.fulfilled, (state, action) => {
        state.loading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchDashboardMetrics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Analytics
      .addCase(fetchAnalytics.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.loading = false;
        state.analytics = action.payload;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Realtime Metrics
      .addCase(fetchRealtimeMetrics.fulfilled, (state, action) => {
        state.realtimeMetrics = action.payload;
      });
  }
});

export const { clearError, updateMetricsRealtime, updateAnalyticsRealtime } = dashboardSlice.actions;
export default dashboardSlice.reducer;