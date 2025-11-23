// features/hotel/hotelSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as api from '../../api/hotelApi';

export const fetchHotels = createAsyncThunk('hotel/fetchHotels', async (_, { rejectWithValue }) => {
  try { 
    const res = await api.fetchHotels(); 
    return res.data; 
  }
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch hotels';
    return rejectWithValue(errorMessage);
  }
});

export const fetchHotelById = createAsyncThunk('hotel/fetchHotelById', async (id, { rejectWithValue }) => {
  try { 
    const res = await api.fetchHotelById(id); 
    return res.data; 
  }
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch hotel';
    return rejectWithValue(errorMessage);
  }
});

export const addHotel = createAsyncThunk('hotel/addHotel', async (formData, { rejectWithValue }) => {
  try { 
    const res = await api.createHotel(formData); 
    return res.data; 
  }
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to add hotel';
    return rejectWithValue(errorMessage);
  }
});

export const updateHotel = createAsyncThunk('hotel/updateHotel', async ({ id, formData }, { rejectWithValue }) => {
  try { 
    const res = await api.updateHotel(id, formData); 
    return res.data; 
  }
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to update hotel';
    return rejectWithValue(errorMessage);
  }
});

export const updateRoom = createAsyncThunk('hotel/updateRoom', async ({ hotelId, roomId, formData }, { rejectWithValue }) => {
  try { 
    const res = await api.updateRoom(hotelId, roomId, formData); 
    return res.data; 
  }
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to update room';
    return rejectWithValue(errorMessage);
  }
});

export const deleteHotel = createAsyncThunk('hotel/deleteHotel', async (id, { rejectWithValue }) => {
  try { 
    await api.deleteHotel(id); 
    return id; 
  }
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to delete hotel';
    return rejectWithValue(errorMessage);
  }
});

// NEW: Fetch available rooms instead of available hotels
export const fetchAvailableRooms = createAsyncThunk('hotel/fetchAvailableRooms', async (params = {}, { rejectWithValue }) => {
  try { 
    const res = await api.fetchAvailableRooms(params); 
    return res.data; 
  }
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch available rooms';
    return rejectWithValue(errorMessage);
  }
});

const hotelSlice = createSlice({
  name: 'hotel',
  initialState: { 
    hotels: [], 
    availableRooms: [], // Store available rooms
    availableRoomsData: {}, // Store the complete response data
    pagination: {},
    loading: false, 
    error: null
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // Update room status locally for immediate UI update
    updateRoomStatus: (state, action) => {
      const { hotelId, roomNumber, status } = action.payload;
      
      // Update in hotels array
      const hotel = state.hotels.find(h => h._id === hotelId);
      if (hotel && hotel.rooms) {
        const room = hotel.rooms.find(r => r.number === roomNumber);
        if (room) {
          room.status = status;
        }
      }
      
      // Update in availableRooms array - remove if status is not available
      if (status !== 'available') {
        state.availableRooms = state.availableRooms.filter(roomData => 
          !(roomData.hotel._id === hotelId && roomData.room.number === roomNumber)
        );
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Hotels (All hotels - for admin)
      .addCase(fetchHotels.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => { 
        state.loading = false; 
        
        if (Array.isArray(action.payload)) {
          state.hotels = action.payload;
          state.pagination = {};
        } else if (action.payload && Array.isArray(action.payload.hotels)) {
          state.hotels = action.payload.hotels;
          state.pagination = {
            total: action.payload.total,
            page: action.payload.page,
            totalPages: action.payload.totalPages,
            hasNextPage: action.payload.hasNextPage,
            hasPrevPage: action.payload.hasPrevPage
          };
        } else {
          state.hotels = [];
          state.pagination = {};
        }
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'An error occurred while fetching hotels';
      })
      
      // Fetch Available Rooms (For guests - only available rooms)
      .addCase(fetchAvailableRooms.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchAvailableRooms.fulfilled, (state, action) => { 
        state.loading = false;
        
        // Store the complete response
        state.availableRoomsData = action.payload;
        
        // Extract available rooms array
        if (Array.isArray(action.payload.availableRooms)) {
          state.availableRooms = action.payload.availableRooms;
        } else {
          state.availableRooms = [];
        }
      })
      .addCase(fetchAvailableRooms.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'An error occurred while fetching available rooms';
      })
      
      // Fetch Hotel By ID
      .addCase(fetchHotelById.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => { 
        state.loading = false;
        // Update the specific hotel in the hotels array
        const index = state.hotels.findIndex(h => h._id === action.payload._id);
        if (index !== -1) {
          state.hotels[index] = action.payload;
        } else {
          state.hotels.push(action.payload);
        }
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'An error occurred while fetching hotel';
      })
      
      // Add Hotel
      .addCase(addHotel.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(addHotel.fulfilled, (state, action) => { 
        state.loading = false;
        state.hotels.push(action.payload); 
      })
      .addCase(addHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'An error occurred while adding hotel';
      })
      
      // Update Hotel
      .addCase(updateHotel.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.hotels.findIndex(h => h._id === action.payload._id);
        if (index !== -1) state.hotels[index] = action.payload;
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'An error occurred while updating hotel';
      })
      
      // Update Room
      .addCase(updateRoom.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(updateRoom.fulfilled, (state, action) => {
        state.loading = false;
        // Update the hotel with the updated room data
        const hotelIndex = state.hotels.findIndex(h => h._id === action.payload.hotel._id);
        if (hotelIndex !== -1) {
          state.hotels[hotelIndex] = action.payload.hotel;
        }
      })
      .addCase(updateRoom.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'An error occurred while updating room';
      })
      
      // Delete Hotel
      .addCase(deleteHotel.pending, (state) => { 
        state.loading = true; 
        state.error = null;
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.loading = false;
        state.hotels = state.hotels.filter(h => h._id !== action.payload);
        // Also remove from available rooms
        state.availableRooms = state.availableRooms.filter(roomData => 
          roomData.hotel._id !== action.payload
        );
      })
      .addCase(deleteHotel.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' 
          ? action.payload 
          : 'An error occurred while deleting hotel';
      });
  },
});

export const { clearError, updateRoomStatus } = hotelSlice.actions;
export default hotelSlice.reducer;