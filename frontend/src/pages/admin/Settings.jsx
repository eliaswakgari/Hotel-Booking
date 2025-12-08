import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProfile,
  updateProfile,
  changePassword,
} from "../../features/auth/authThunks";
import { toggleDarkMode } from "../../features/theme/themeSlice"; // Import the theme action
import axios from "axios";

// Configure axios to talk to the correct backend in both local dev and production
const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const resolveBackendBase = () => {
  const raw = import.meta.env.VITE_API_URL;
  if (!raw) return "";
  let base = raw.replace(/\/+$/, "");
  if (base.endsWith("/api")) {
    base = base.slice(0, -4);
  }
  return base;
};

const backendBase = resolveBackendBase();

const settingsAxios = axios.create({
  baseURL: isLocalhost
    ? "http://localhost:5000/api"
    : backendBase
      ? `${backendBase}/api`
      : "http://localhost:5000/api",
  withCredentials: true,
});

const Settings = () => {
  const dispatch = useDispatch();
  const { user, loading, error } = useSelector((state) => state.auth);
  const { darkMode } = useSelector((state) => state.theme); // Get dark mode from global state

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [uploading, setUploading] = useState(false);

  // ✅ Toggle dark mode using global state
  const handleToggleDarkMode = () => {
    dispatch(toggleDarkMode());
  };

  // ✅ Fetch profile only once on mount
  useEffect(() => {
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [dispatch, user]);

  // ✅ Update local state when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setEmail(user.email || "");
      setProfileImage(user.profileImage || null);
    }
  }, [user]);

  // ✅ Get initials from full name
  const getInitials = () => {
    if (!name) return "";
    const nameParts = name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("image", file);
    setUploading(true);

    try {
      const { data: uploadData } = await settingsAxios.post("/auth/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const result = await dispatch(updateProfile({ profileImage: uploadData.imageUrl }));
      if (result.payload) {
        setProfileImage(result.payload.profileImage || null);
        alert("Profile image updated successfully!");
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Error uploading image");
    } finally {
      setUploading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await dispatch(updateProfile({ name, email, profileImage })).unwrap();
      alert("Profile updated successfully!");
    } catch (err) {
      alert(err);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await dispatch(changePassword({ oldPassword, newPassword })).unwrap();
      alert("Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
    } catch (err) {
      alert(err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400">Loading...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-red-500">Error: {error}</div>
    </div>
  );

  if (!user) return (
    <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
      <div className="text-gray-600 dark:text-gray-400">No user found. Please login.</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-300">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Account Settings</h1>

        {/* Appearance Section - Airbnb Style */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Appearance</h2>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Dark Mode</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Toggle between light and dark theme
              </p>
            </div>
            <button
              onClick={handleToggleDarkMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 ${darkMode ? 'bg-rose-500' : 'bg-gray-200'
                }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${darkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
              />
            </button>
          </div>
        </section>

        {/* Profile Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Profile Information</h2>
          <form
            onSubmit={handleProfileUpdate}
            className="flex flex-col md:flex-row gap-6 items-start"
          >
            <div className="flex flex-col items-center gap-3">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover border-2 border-rose-500"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-rose-500 flex items-center justify-center text-white text-2xl font-bold border-2 border-rose-500">
                  {getInitials()}
                </div>
              )}
              <label className="cursor-pointer bg-rose-500 hover:bg-rose-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                {uploading ? "Uploading..." : "Change Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex-1 flex flex-col gap-4 w-full">
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Enter your full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  placeholder="Enter your email"
                />
              </div>

              <button
                type="submit"
                className="bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-lg font-medium transition-colors w-full md:w-auto px-6"
              >
                Update Profile
              </button>
            </div>
          </form>
        </section>

        {/* Password Section */}
        <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Change Password</h2>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4 max-w-md">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Current Password</label>
              <input
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              className="bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-lg font-medium transition-colors"
            >
              Update Password
            </button>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Settings;