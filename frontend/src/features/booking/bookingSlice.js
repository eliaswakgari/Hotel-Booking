// features/booking/bookingSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from '../../api/bookingApi';
// ✅ ADD: Fetch booking by ID
export const fetchBookingById = createAsyncThunk(
  'bookings/fetchBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.getBookingDetails(bookingId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchBookings = createAsyncThunk('bookings/fetchBookings', async () => {
  const res = await api.getBookings();
  return res.data;
});

export const approveBooking = createAsyncThunk('bookings/approveBooking', async ({ id }) => {
  const res = await api.approveBookingApi(id);
  return res.data;
});

export const rejectBooking = createAsyncThunk('bookings/rejectBooking', async ({ id }) => {
  const res = await api.rejectBookingApi(id);
  return res.data;
});

export const issueRefund = createAsyncThunk('bookings/issueRefund', async ({ id, type }) => {
  const res = await api.refundBookingApi(id, type);
  return res.data;
});

// ... rest of your slice code remains the same

const initialState = { 
  bookings: [], 
  currentBooking: null, // ✅ ADD: For single booking details
  loading: false, 
  error: null, 
  totalPages: 1, 
  total: 0 
};

const bookingsSlice = createSlice({
  name: "bookings",
  initialState,
  reducers: {
    // Add a manual update reducer if needed
    updateBooking: (state, action) => {
      const { bookingId, updates } = action.payload;
      const booking = state.bookings.find(b => b._id === bookingId);
      if (booking) {
        Object.assign(booking, updates);
      }
    },
    // ✅ ADD: Clear current booking when leaving details page
    clearCurrentBooking: (state) => {
      state.currentBooking = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Bookings
      .addCase(fetchBookings.pending, state => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false;
        state.bookings = action.payload.bookings || [];
        state.totalPages = action.payload.totalPages || 1;
        state.total = action.payload.total || 0;
      })
      .addCase(fetchBookings.rejected, (state, action) => { 
        state.loading = false; 
        state.error = action.error.message; 
      })

      // ✅ ADD: Fetch Booking By ID
      .addCase(fetchBookingById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBooking = action.payload;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.currentBooking = null;
      })

      // Approve Booking
      .addCase(approveBooking.fulfilled, (state, action) => {
        const booking = state.bookings.find(b => b._id === action.payload._id);
        if (booking) {
          booking.status = action.payload.status;
          booking.paymentStatus = action.payload.paymentStatus;
          // Keep the original totalPrice unless it's changed in the response
          if (action.payload.totalPrice !== undefined) {
            booking.totalPrice = action.payload.totalPrice;
          }
        }
        // Also update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = { ...state.currentBooking, ...action.payload };
        }
      })

      // Reject Booking
      .addCase(rejectBooking.fulfilled, (state, action) => {
        const booking = state.bookings.find(b => b._id === action.payload._id);
        if (booking) {
          booking.status = action.payload.status;
          booking.paymentStatus = action.payload.paymentStatus;
          // Keep the original totalPrice unless it's changed in the response
          if (action.payload.totalPrice !== undefined) {
            booking.totalPrice = action.payload.totalPrice;
          }
        }
        // Also update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === action.payload._id) {
          state.currentBooking = { ...state.currentBooking, ...action.payload };
        }
      })

      // Issue Refund
      .addCase(issueRefund.fulfilled, (state, action) => {
        console.log('Refund fulfilled payload:', action.payload);
        
        // Handle different response structures
        const updatedBooking = action.payload.booking || action.payload;
        if (!updatedBooking || !updatedBooking._id) {
          console.error('Invalid refund response:', action.payload);
          return;
        }

        const booking = state.bookings.find(b => b._id === updatedBooking._id);
        if (booking) {
          // Update all relevant fields
          booking.refundStatus = updatedBooking.refundStatus;
          booking.refundedAmount = updatedBooking.refundedAmount || 0;
          booking.totalPrice = updatedBooking.totalPrice;
          booking.status = updatedBooking.status;
          booking.paymentStatus = updatedBooking.paymentStatus;
          
          console.log('Updated booking after refund:', {
            id: booking._id,
            totalPrice: booking.totalPrice,
            refundedAmount: booking.refundedAmount,
            refundStatus: booking.refundStatus
          });
        }
        
        // Also update current booking if it's the same
        if (state.currentBooking && state.currentBooking._id === updatedBooking._id) {
          state.currentBooking = { ...state.currentBooking, ...updatedBooking };
        }
      })
      .addCase(issueRefund.rejected, (state, action) => {
        console.error('Refund rejected:', action.error);
        state.error = action.error.message;
      });
  },
});

export const { updateBooking, clearCurrentBooking } = bookingsSlice.actions;
export default bookingsSlice.reducer;