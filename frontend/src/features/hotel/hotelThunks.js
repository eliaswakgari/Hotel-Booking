// features/hotel/hotelThunks.js
import { createAsyncThunk } from '@reduxjs/toolkit';
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

// NEW: Fetch available rooms instead of hotels
export const fetchAvailableRooms = createAsyncThunk('hotel/fetchAvailableRooms', async (params = {}, { rejectWithValue }) => {
  try { 
    const res = await api.fetchAvailableRooms(params); 
    return res.data; 
  } 
  catch (err) { 
    const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch available rooms';
    console.error('fetchAvailableRooms error:', err);
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