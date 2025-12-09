import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { registerUser } from "../features/auth/authThunks";
import GuestLayout from "../layouts/GuestLayout";
import Swal from "sweetalert2";
import { FcGoogle } from "react-icons/fc";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { motion } from "framer-motion";

const Signup = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, password, confirmPassword } = formData;

    if (password !== confirmPassword) {
      return Swal.fire("Error", "Passwords do not match", "error");
    }

    try {
      await dispatch(registerUser({ name, email, password })).unwrap();

      // ✅ Show success message first, then redirect to login
      Swal.fire({
        title: "Success",
        text: "Registered successfully! Please login to continue.",
        icon: "success",
        confirmButtonText: "Go to Login",
        confirmButtonColor: "#2563eb",
      }).then(() => {
        navigate("/login", { state: location.state || {} }); // Redirect after alert confirmation, preserving redirect info
      });
    } catch (error) {
      Swal.fire("Error", error?.message || "Registration failed", "error");
    }
  };


  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/google`;
  };

  return (
    <GuestLayout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-500 to-blue-500 p-4">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-xl w-full max-w-md p-8 border border-white/20">
          <h2 className="text-3xl font-bold text-center text-white mb-6">
            Create Account ✨
          </h2>
          <p className="text-center text-white/80 mb-8">
            Register to access exclusive hotel booking deals
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Name */}
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Email */}
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleChange}
              required
              className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />

            {/* Password with toggle */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full pr-10"
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

            {/* Confirm Password with toggle */}
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="p-3 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-full pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
              >
                <motion.span
                  key={showConfirm ? "visible" : "hidden"}
                  initial={{ opacity: 0, rotate: -90 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 90 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  {showConfirm ? (
                    <AiFillEyeInvisible size={22} />
                  ) : (
                    <AiFillEye size={22} />
                  )}
                </motion.span>
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition duration-300 shadow-md hover:shadow-lg"
            >
              Register
            </button>

            {/* Google Signup */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center justify-center gap-2 bg-white text-gray-800 font-semibold py-3 rounded-lg transition duration-300 shadow hover:bg-gray-100"
            >
              <FcGoogle size={22} /> Sign up with Google
            </button>
          </form>

          <div className="flex justify-between items-center mt-6 text-sm text-white/80">
            <a
              href="/login"
              className="hover:text-white underline transition duration-200"
            >
              Already have an account? Login
            </a>
            <a
              href="/forgot-password"
              className="hover:text-white underline transition duration-200"
            >
              Forgot Password?
            </a>
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};

export default Signup;
