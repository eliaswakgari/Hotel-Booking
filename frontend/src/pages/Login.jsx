// src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import GuestLayout from "../layouts/GuestLayout";
import Swal from "sweetalert2";
import { FcGoogle } from "react-icons/fc";
import {
  AiOutlineLoading3Quarters,
  AiFillEye,
  AiFillEyeInvisible,
  AiOutlineClose,
} from "react-icons/ai";
import { motion, AnimatePresence } from "framer-motion";
import { loginUser } from "../features/auth/authThunks";
import { setUser, clearError, clearValidationErrors } from "../features/auth/authSlice";

const Login = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { user, loading, error, validationErrors } = useSelector((state) => state.auth);

  // ===============================
  // Handle Validation Errors
  // ===============================
  useEffect(() => {
    if (validationErrors && validationErrors.length > 0) {
      // Convert validation errors to field-specific errors
      const newFieldErrors = { email: "", password: "" };
      
      validationErrors.forEach(error => {
        if (error.path === 'email') {
          newFieldErrors.email = error.msg;
        } else if (error.path === 'password') {
          newFieldErrors.password = error.msg;
        }
      });
      
      setFieldErrors(newFieldErrors);
      
      // Show detailed validation errors
      const errorMessages = validationErrors.map(err => `• ${err.msg}`).join('\n');
      Swal.fire({
        title: "Please check your input",
        html: `<div class="text-left"><p class="mb-2">Please correct the following errors:</p>${errorMessages}</div>`,
        icon: "warning",
        confirmButtonText: "Try Again",
        confirmButtonColor: "#3B82F6",
      });
    }
  }, [validationErrors]);

  // ===============================
  // Handle General Errors
  // ===============================
  useEffect(() => {
    if (error && !validationErrors.length) {
      Swal.fire({
        title: "Login Failed",
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
    }
  }, [error]);

  // ===============================
  // Clear errors when form changes
  // ===============================
  useEffect(() => {
    if (fieldErrors.email && formData.email) {
      setFieldErrors(prev => ({ ...prev, email: "" }));
    }
    if (fieldErrors.password && formData.password) {
      setFieldErrors(prev => ({ ...prev, password: "" }));
    }
  }, [formData]);

  // ===============================
  // Navigate by role after login
  // ===============================
  const navigateByRole = (user) => {
    if (!user) return;
    switch (user.role) {
      case "admin":
        navigate("/admin");
        break;
      case "guest":
        navigate("/guest");
        break;
      default:
        navigate("/");
    }
  };

  useEffect(() => {
    if (user && !loading) {
      navigateByRole(user);
    }
  }, [user, loading]);

  // ===============================
  // Handle Form Submit
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(clearError());
    dispatch(clearValidationErrors());
    setFieldErrors({ email: "", password: "" });
    
    try {
      const result = await dispatch(loginUser(formData)).unwrap();
      if (result.success) {
        Swal.fire("Success", result.message || "Login successful!", "success");
      }
    } catch (err) {
      // Error handling is done in useEffect above
    }
  };

  // ===============================
  // Handle Retry
  // ===============================
  const handleRetry = () => {
    dispatch(clearError());
    dispatch(clearValidationErrors());
    setFieldErrors({ email: "", password: "" });
    // Keep email, clear password for retry
    setFormData(prev => ({ ...prev, password: "" }));
    setShowPassword(false);
  };

  // ===============================
  // Handle Google Login
  // ===============================
  const handleGoogleLogin = () => {
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
    const googleAuthWindow = window.open(
      `${apiUrl}/auth/google`,
      "_blank",
      "width=500,height=600"
    );

    window.addEventListener("message", (event) => {
      const backendOrigin = "http://localhost:5000";
      if (event.origin !== backendOrigin) return;
      const { user: googleUser, token } = event.data;
      if (googleUser && token) {
        dispatch(setUser(googleUser));
        Swal.fire("Success", "Google login successful!", "success");
        navigateByRole(googleUser);
      }
    });
  };

  // ===============================
  // Input change handlers with validation clearing
  // ===============================
  const handleEmailChange = (e) => {
    setFormData({ ...formData, email: e.target.value });
    if (fieldErrors.email) {
      setFieldErrors(prev => ({ ...prev, email: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    setFormData({ ...formData, password: e.target.value });
    if (fieldErrors.password) {
      setFieldErrors(prev => ({ ...prev, password: "" }));
    }
  };

  // ===============================
  // JSX
  // ===============================
  return (
    <GuestLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-600 p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            Welcome Back 👋
          </h2>
          <p className="text-center text-white/80 mb-8">
            Login to your account to continue booking
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Email Input */}
            <div>
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleEmailChange}
                required
                className={`p-3 rounded-lg border focus:outline-none focus:ring-2 w-full ${
                  fieldErrors.email 
                    ? "border-red-500 focus:ring-red-400 bg-red-50" 
                    : "border-gray-300 focus:ring-blue-400"
                }`}
              />
              <AnimatePresence>
                {fieldErrors.email && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1 mt-1 text-red-500 text-sm"
                  >
                    <AiOutlineClose size={12} />
                    <span>{fieldErrors.email}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Password Input */}
            <div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  required
                  className={`p-3 rounded-lg border focus:outline-none focus:ring-2 w-full pr-10 ${
                    fieldErrors.password 
                      ? "border-red-500 focus:ring-red-400 bg-red-50" 
                      : "border-gray-300 focus:ring-blue-400"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                >
                  <motion.span
                    key={showPassword ? "visible" : "hidden"}
                    initial={{ opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 90 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                  >
                    {showPassword ? (
                      <AiFillEyeInvisible size={22} />
                    ) : (
                      <AiFillEye size={22} />
                    )}
                  </motion.span>
                </button>
              </div>
              <AnimatePresence>
                {fieldErrors.password && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-1 mt-1 text-red-500 text-sm"
                  >
                    <AiOutlineClose size={12} />
                    <span>{fieldErrors.password}</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 1,
                      ease: "linear",
                    }}
                    className="inline-block"
                  >
                    <AiOutlineLoading3Quarters />
                  </motion.span>
                  Logging in...
                </>
              ) : (
                "Login"
              )}
            </button>

            {/* Google Login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold py-3 rounded-lg transition duration-300 shadow hover:bg-gray-100"
            >
              <FcGoogle size={22} /> Login with Google
            </button>
          </form>

          {/* Links */}
          <div className="flex justify-between items-center mt-6 text-sm text-white/80">
            <Link
              to="/signup"
              className="hover:text-white underline transition duration-200"
            >
              Don't have an account? Register
            </Link>
            <Link
              to="/forgot-password"
              className="hover:text-white underline transition duration-200"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};

export default Login;