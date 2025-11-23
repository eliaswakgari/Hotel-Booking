// frontend/src/features/audit/auditSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

export const fetchAuditMetrics = createAsyncThunk(
  "audit/fetchAuditMetrics",
  async () => {
    const { data } = await axios.get("/api/audit");
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
