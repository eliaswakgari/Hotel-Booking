// src/features/auth/authSlice.js
import { createSlice } from "@reduxjs/toolkit";
import {
  registerUser,
  loginUser,
  logoutUserThunk,
  fetchProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
} from "./authThunks";

const initialState = {
  user: null,
  loading: false,
  error: null,
  validationErrors: [],
  forgotPasswordStatus: null,
  resetPasswordStatus: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null;
      state.error = null;
      state.validationErrors = [];
      state.loading = false;
      state.forgotPasswordStatus = null;
      state.resetPasswordStatus = null;
    },
    clearError: (state) => {
      state.error = null;
      state.validationErrors = [];
    },
    clearMessages: (state) => {
      state.forgotPasswordStatus = null;
      state.resetPasswordStatus = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    clearValidationErrors: (state) => {
      state.validationErrors = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // REGISTER
      .addCase(registerUser.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.validationErrors = [];
      })
      .addCase(registerUser.fulfilled, (s, a) => {
        s.loading = false;
        s.validationErrors = [];

        // Ensure we do not auto-login after signup; require explicit login
        try {
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('authToken');
          }
        } catch (e) {
          // ignore storage errors
        }
      })
      .addCase(registerUser.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload?.message || "Registration failed";
        s.validationErrors = a.payload?.errors || [];
      })

      // LOGIN
      .addCase(loginUser.pending, (s) => {
        s.loading = true;
        s.error = null;
        s.validationErrors = [];
      })
      .addCase(loginUser.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.data;
        s.validationErrors = [];

        // Persist token for subsequent API calls if present
        if (a.payload?.data?.token) {
          localStorage.setItem('authToken', a.payload.data.token);
        }
      })
      .addCase(loginUser.rejected, (s, a) => {
        s.loading = false;
        s.error = a.payload?.message || "Login failed";
        s.validationErrors = a.payload?.errors || [];
      })

      // LOGOUT
      .addCase(logoutUserThunk.fulfilled, (s) => {
        s.user = null;
        s.loading = false;
        s.validationErrors = [];

        // Clear any persisted auth token on explicit logout
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('authToken');
        }
      })

      // FETCH PROFILE - Don't set error for auth failures
      .addCase(fetchProfile.pending, (s) => {
        s.loading = true;
      })
      .addCase(fetchProfile.fulfilled, (s, a) => {
        s.loading = false;
        s.user = a.payload.data;
        s.error = null; // Clear any previous errors
      })
      .addCase(fetchProfile.rejected, (s, a) => {
        s.loading = false;
        // Only set error if it's not an authentication error
        if (!a.payload?.isAuthError) {
          s.error = a.payload?.message || "Fetch profile failed";
        } else {
          s.error = null; // Clear error for normal auth failures
        }
      })

      // UPDATE PROFILE
      .addCase(updateProfile.fulfilled, (s, a) => {
        s.user = a.payload.data;
        s.validationErrors = [];
      })
      .addCase(updateProfile.rejected, (s, a) => {
        s.error = a.payload?.message || "Update profile failed";
        s.validationErrors = a.payload?.errors || [];
      })

      // CHANGE PASSWORD
      .addCase(changePassword.fulfilled, (s) => {
        s.validationErrors = [];
      })
      .addCase(changePassword.rejected, (s, a) => {
        s.error = a.payload?.message || "Change password failed";
        s.validationErrors = a.payload?.errors || [];
      })

      // FORGOT PASSWORD
      .addCase(forgotPassword.fulfilled, (s, a) => {
        s.forgotPasswordStatus = a.payload.message;
        s.validationErrors = [];
      })
      .addCase(forgotPassword.rejected, (s, a) => {
        s.error = a.payload?.message || "Failed to send reset email";
        s.validationErrors = a.payload?.errors || [];
      })

      // RESET PASSWORD
      .addCase(resetPassword.fulfilled, (s, a) => {
        s.resetPasswordStatus = a.payload.message;
        s.validationErrors = [];
      })
      .addCase(resetPassword.rejected, (s, a) => {
        s.error = a.payload?.message || "Failed to reset password";
        s.validationErrors = a.payload?.errors || [];
      });
  },
});

export const { 
  logout, 
  clearError, 
  clearMessages, 
  setUser, 
  clearValidationErrors
} = authSlice.actions;
export default authSlice.reducer;