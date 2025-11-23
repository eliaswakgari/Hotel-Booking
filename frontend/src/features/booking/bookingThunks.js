import { createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/bookingApi";

export const createBooking = createAsyncThunk(
  "booking/createBooking",
  async (data, { rejectWithValue }) => {
    try {
      const res = await api.createBooking(data);
      return res.data;
    } catch (err) {
      return rejectWithValue(err.response.data.message);
    }
  }
);
