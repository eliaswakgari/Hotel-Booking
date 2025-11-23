import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import GuestLayout from "../layouts/GuestLayout";
import Swal from "sweetalert2";
import { clearMessages, clearError } from "../features/auth/authSlice";
import { resetPassword } from "../features/auth/authThunks"; // ✅ Import from thunks

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState("");
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();

  const { loading, error, resetPasswordStatus, validationErrors } = useSelector((state) => state.auth);

  // Show success or error messages
  useEffect(() => {
    if (resetPasswordStatus) {
      Swal.fire({
        title: "Success",
        text: resetPasswordStatus,
        icon: "success",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#3B82F6",
      }).then(() => {
        navigate("/login");
      });
      dispatch(clearMessages());
    }
  }, [resetPasswordStatus, dispatch, navigate]);

  // Handle validation errors
  useEffect(() => {
    if (validationErrors && validationErrors.length > 0) {
      const passwordError = validationErrors.find(err => err.path === 'password');
      if (passwordError) {
        setFieldError(passwordError.msg);
      }
    }
  }, [validationErrors]);

  // Handle general errors
  useEffect(() => {
    if (error) {
      Swal.fire({
        title: "Error",
        text: error,
        icon: "error",
        confirmButtonText: "Try Again",
        confirmButtonColor: "#3B82F6",
        showCancelButton: true,
        cancelButtonText: "Cancel",
      }).then((result) => {
        if (result.isConfirmed) {
          handleRetry();
        }
      });
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(clearError());
    setFieldError("");

    // Client-side validation
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setFieldError("Password must be at least 8 characters");
      return;
    }

    dispatch(resetPassword({ token, password }));
  };

  const handleRetry = () => {
    dispatch(clearError());
    setFieldError("");
    setPassword("");
    setConfirmPassword("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (fieldError) {
      setFieldError("");
    }
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (fieldError) {
      setFieldError("");
    }
  };

  return (
    <GuestLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Reset Password</h2>
          <p className="text-gray-600 text-center mb-6">
            Enter your new password below
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={handlePasswordChange}
                required
                className={`p-3 rounded-lg border focus:outline-none focus:ring-2 w-full ${
                  fieldError 
                    ? "border-red-500 focus:ring-red-400 bg-red-50" 
                    : "border-gray-300 focus:ring-blue-400"
                }`}
              />
            </div>

            <div>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                required
                className={`p-3 rounded-lg border focus:outline-none focus:ring-2 w-full ${
                  fieldError 
                    ? "border-red-500 focus:ring-red-400 bg-red-50" 
                    : "border-gray-300 focus:ring-blue-400"
                }`}
              />
              {fieldError && (
                <div className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <span>•</span>
                  <span>{fieldError}</span>
                </div>
              )}
              {!fieldError && password.length > 0 && (
                <div className="text-gray-500 text-sm mt-1">
                  Password must contain: uppercase, lowercase, number, special character
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resetting...
                </>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>
        </div>
      </div>
    </GuestLayout>
  );
};

export default ResetPassword;