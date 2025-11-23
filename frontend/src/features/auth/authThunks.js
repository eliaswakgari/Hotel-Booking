// src/features/auth/authThunks.js
import { createAsyncThunk } from "@reduxjs/toolkit";
import authAPI from "../../api/authApi";

// ---------------- FETCH PROFILE ----------------
export const fetchProfile = createAsyncThunk(
  "auth/fetchProfile",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.profile();
      return data;
    } catch (err) {
      // Don't treat 401/403 as errors for profile fetch
      // This allows the app to continue loading for public routes
      if (err.response?.status === 401 || err.response?.status === 403) {
        return rejectWithValue({
          message: "User not authenticated",
          isAuthError: true // Flag to identify auth errors
        });
      }
      return rejectWithValue(err.response?.data || { 
        message: "Fetch profile failed",
        retry: true 
      });
    }
  }
);

// ---------------- LOGOUT ----------------
export const logoutUserThunk = createAsyncThunk(
  "auth/logoutUser",
  async (_, { rejectWithValue }) => {
    try {
      await authAPI.logout();
    } catch (err) {
      return rejectWithValue(err.response?.data || { 
        message: "Logout failed",
        retry: true 
      });
    }
  }
);

// ---------------- UPDATE PROFILE ----------------
export const updateProfile = createAsyncThunk(
  "auth/updateProfile",
  async (profileData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.updateProfile(profileData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { 
        message: "Update profile failed",
        retry: true 
      });
    }
  }
);

// ---------------- CHANGE PASSWORD ----------------
export const changePassword = createAsyncThunk(
  "auth/changePassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.changePassword(passwordData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { 
        message: "Change password failed",
        retry: true 
      });
    }
  }
);

// ---------------- FORGOT PASSWORD ----------------
export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (emailData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.forgotPassword(emailData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { 
        message: "Failed to send reset email. Please try again.",
        retry: true 
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (userData, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.register(userData);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { 
        message: "Registration failed",
        retry: true 
      });
    }
  }
);

export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.login(credentials);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { 
        message: "Login failed",
        retry: true 
      });
    }
  }
);

// ---------------- RESET PASSWORD ----------------
export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async ({ token, password }, { rejectWithValue }) => {
    try {
      const { data } = await authAPI.resetPassword(token, { password });
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data || { 
        message: "Failed to reset password",
        retry: true 
      });
    }
  }
);