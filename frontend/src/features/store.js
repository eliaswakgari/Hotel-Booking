// store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './auth/authSlice';
import hotelReducer from './hotel/hotelSlice';
import bookingReducer from './booking/bookingSlice';
import usersReducer from './users/usersSlice'; // <- added users slice
import analytics from '../pages/admin/analytics/analyticsSlice';
import dashboardReducer from '../features/dashboard/dashboardSlice'
import auditReducer from "../features/audit/auditSlice";
import themeReducer from '../features/theme/themeSlice';
import notificationReducer from '../features/notification/notificationSlice'
export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotel: hotelReducer,
    bookings: bookingReducer,
    analytics:analytics,
    users: usersReducer, // <- include users reducer here
    dashboard:dashboardReducer,
    audit: auditReducer,
    theme: themeReducer,
    notification:notificationReducer,
  },
});

export default store;
