// api/hotelApi.js
import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/hotels`
    : "http://localhost:5000/api/hotels",
  withCredentials: true,
});

// Add interceptors for better error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Hotel API functions
export const fetchHotels = () => API.get('/hotels');
export const fetchAvailableHotels = () => API.get('/hotels/available'); // Remove this if not needed
export const fetchAvailableRooms = (params = {}) =>
  API.get("/rooms/available", { params });

export const fetchAvailableRoomsByHotel = (hotelId, params = {}) =>
  API.get(`/${hotelId}/available-rooms`, { params });

export const fetchRoomById = (roomId) => API.get(`/rooms/${roomId}`);

export const createHotel = (formData) => API.post('/hotels', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateHotel = (id, formData) => API.put(`/hotels/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateRoom = (hotelId, roomId, formData) => {
  if (roomId === "new") {
    // Create a new room
    return API.post(`/hotels/${hotelId}/rooms`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }

  // Update existing room
  return API.put(`/hotels/${hotelId}/rooms/${roomId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteHotel = (id) => API.delete(`/hotels/${id}`);





