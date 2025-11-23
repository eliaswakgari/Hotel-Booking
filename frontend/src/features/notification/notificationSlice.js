// features/notification/notificationSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import * as api from "../../api/notificationApi";

// ✅ ADD: Fetch notification details thunk
export const fetchNotificationDetails = createAsyncThunk(
  'notification/fetchNotificationDetails',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.getNotificationDetails(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ ADD: Fetch all notifications thunk
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.getNotifications();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ ADD: Mark as read thunk
export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.markAsRead(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ ADD: Mark all as read thunk
export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.markAllAsRead();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// ✅ ADD: Delete notification thunk
export const deleteNotification = createAsyncThunk(
  'notification/deleteNotification',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await api.deleteNotification(notificationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  notifications: [],
  notification: null, // Single notification for details page
  unreadCount: 0,
  loading: false,
  error: null,
};

const notificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    // ✅ ADD: Clear notification details when leaving page
    clearNotificationDetails: (state) => {
      state.notification = null;
    },
    // ✅ ADD: Clear errors
    clearError: (state) => {
      state.error = null;
    },
    // ✅ ADD: Manual update for real-time functionality
    updateNotification: (state, action) => {
      const updatedNotification = action.payload;
      const index = state.notifications.findIndex(n => n._id === updatedNotification._id);
      if (index !== -1) {
        state.notifications[index] = updatedNotification;
      }
      if (state.notification && state.notification._id === updatedNotification._id) {
        state.notification = updatedNotification;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch All Notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications || action.payload;
        state.unreadCount = action.payload.unreadCount || 
          (action.payload.notifications ? action.payload.notifications.filter(n => !n.read).length : 0);
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Notification Details
      .addCase(fetchNotificationDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.notification = action.payload;
      })
      .addCase(fetchNotificationDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Mark as Read - SINGLE DEFINITION (REMOVED DUPLICATE)
      .addCase(markAsRead.fulfilled, (state, action) => {
        const updatedNotification = action.payload;
        
        // Update in notifications list
        const index = state.notifications.findIndex(n => n._id === updatedNotification._id);
        if (index !== -1) {
          state.notifications[index] = {
            ...state.notifications[index],
            ...updatedNotification,
            read: true // Ensure read status is true
          };
        }
        
        // Update in single notification if it's the current one
        if (state.notification && state.notification._id === updatedNotification._id) {
          state.notification = {
            ...state.notification,
            ...updatedNotification,
            read: true
          };
        }
        
        // Update unread count - only decrement if it was previously unread
        const wasUnread = state.notifications.find(n => n._id === updatedNotification._id)?.read === false;
        if (wasUnread) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Mark All as Read
      .addCase(markAllAsRead.fulfilled, (state, action) => {
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          read: true
        }));
        state.unreadCount = 0;
        // Also update the single notification if it exists
        if (state.notification) {
          state.notification.read = true;
        }
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Delete Notification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deletedId = action.payload._id || action.payload;
        state.notifications = state.notifications.filter(n => n._id !== deletedId);
        // Clear single notification if it's the deleted one
        if (state.notification && state.notification._id === deletedId) {
          state.notification = null;
        }
        // Update unread count if needed
        if (action.payload.read === false) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      .addCase(deleteNotification.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

// ✅ EXPORT all actions
export const { clearNotificationDetails, clearError, updateNotification } = notificationSlice.actions;
export default notificationSlice.reducer;