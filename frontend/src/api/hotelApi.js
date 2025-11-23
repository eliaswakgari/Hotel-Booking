// api/hotelApi.js
import axios from 'axios';

const API = axios.create({ 
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true 
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
export const fetchAvailableRooms = (params = {}) => API.get('/hotels/rooms/available', { params }); // NEW
export const fetchHotelById = (id) => API.get(`/hotels/${id}`);
export const createHotel = (formData) => API.post('/hotels', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateHotel = (id, formData) => API.put(`/hotels/${id}`, formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const updateRoom = (hotelId, roomId, formData) => {
  const url = roomId === "new" 
    ? `/hotels/${hotelId}/rooms`
    : `/hotels/${hotelId}/rooms/${roomId}`;
  
  return API.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteHotel = (id) => API.delete(`/hotels/${id}`);