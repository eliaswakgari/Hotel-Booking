import axios from 'axios';
const API_URL = 'http://localhost:5000/api/reviews';

export const createReview = (data) => axios.post(API_URL, data, { withCredentials: true });
export const fetchReviews = (hotelId) => axios.get(`${API_URL}/${hotelId}`);
