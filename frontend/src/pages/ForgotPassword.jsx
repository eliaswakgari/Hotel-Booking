import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import GuestLayout from "../layouts/GuestLayout";
import Swal from "sweetalert2";
import { clearMessages, clearError } from "../features/auth/authSlice";
import { forgotPassword } from "../features/auth/authThunks"; // ✅ Import from thunks

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState("");
  
  const dispatch = useDispatch();
  const { loading, error, forgotPasswordStatus, validationErrors } = useSelector((state) => state.auth);

  // Show success or error messages
  useEffect(() => {
    if (forgotPasswordStatus) {
      Swal.fire({
        title: "Success",
        text: forgotPasswordStatus,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#3B82F6",
      });
      dispatch(clearMessages());
      setEmail(""); // Clear email on success
    }
  }, [forgotPasswordStatus, dispatch]);

  // Handle validation errors
  useEffect(() => {
    if (validationErrors && validationErrors.length > 0) {
      const emailError = validationErrors.find(err => err.path === 'email');
      if (emailError) {
        setFieldError(emailError.msg);
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
    
    // Basic client-side validation
    if (!email || !email.includes('@')) {
      setFieldError("Please enter a valid email address");
      return;
    }

    dispatch(forgotPassword({ email }));
  };

  const handleRetry = () => {
    dispatch(clearError());
    setFieldError("");
    // Keep email for user to retry
  };

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (fieldError) {
      setFieldError("");
    }
  };

  return (
    <GuestLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-200">
          <h2 className="text-2xl font-bold mb-2 text-center text-gray-800">Forgot Password</h2>
          <p className="text-gray-600 text-center mb-6">
            Enter your email and we'll send you a reset link
          </p>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={handleEmailChange}
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
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

          {/* Additional help text */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800 text-center">
              💡 Check your spam folder if you don't see the email in your inbox
            </p>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};

export default ForgotPassword;