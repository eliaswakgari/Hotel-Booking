import React, { Suspense, lazy, useState, useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion } from "framer-motion";
import { fetchProfile } from "../features/auth/authThunks";

// Add this to your main App.js or index.js to suppress the warning temporarily
const originalError = console.error;
console.error = (...args) => {
  if (args[0] && args[0].includes('Accessing element.ref was removed in React 19')) {
    return; // Suppress this specific warning
  }
  originalError.apply(console, args);
};

// 🧱 Error Boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught an error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen text-center">
          <h2 className="text-2xl font-semibold text-red-600">
            Something went wrong 😢
          </h2>
          <p className="text-gray-500 mt-2">Try refreshing the page.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

// 🧩 Lazy Loaded Components
const Home = lazy(() => import("../pages/Home"));
const HotelDetail = lazy(() => import("../pages/HotelDetail"));
const Login = lazy(() => import("../pages/Login"));
const Signup = lazy(() => import("../pages/Signup"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const GuestDashboard = lazy(() => import("../pages/guest/GuestDashboard"));
const Notifications = lazy(() => import("../pages/admin/Notifications"));
const BookingHistory = lazy(() => import("../pages/guest/BookingHistory"));
const NotFound = lazy(() => import("../pages/NotFound"));
const BookingVerify = lazy(() => import("../pages/guest/BookingVerify"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const HotelsManagement = lazy(() => import("../pages/admin/HotelsManagement"));
const UsersManagement = lazy(() => import("../pages/admin/UsersManagement"));
const BookingsManagement = lazy(() => import("../pages/admin/BookingsManagement"));
const AdminAnalytics = lazy(() => import("../pages/admin/analytics/AdminAnalytics"));
const Settings = lazy(() => import("../pages/admin/Settings"));
const PricingRules = lazy(() => import("../pages/admin/PricingRules"));
const AuditDashboard = lazy(() => import("../pages/admin/AuditDashboard")); 
const GuestLayout = lazy(() => import("../layouts/GuestLayout"));
const AdminLayout = lazy(() => import("../layouts/AdminLayout"));
import ChatbotPage from "../pages/ChatbotPage";
import NotificationDetails from "../pages/admin/NotificationDetails";
import BookingDetails from "../pages/admin/BookingDetails";
import GuestBookingDetails from "../pages/guest/GuestBookingDetails";

// 🔄 Loader
const Loader = () => {
  const [darkMode, setDarkMode] = useState(false);
  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
  }, []);
  return (
    <div className="flex items-center justify-center min-h-screen">
      <motion.div
        className={`w-16 h-16 rounded-full border-4 border-t-4 ${
          darkMode
            ? "border-gray-200 border-t-blue-500"
            : "border-blue-500 border-t-white"
        }`}
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      />
    </div>
  );
};

const AppRoutes = () => {
  const { user, loading } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const location = useLocation();

  // ✅ Fetch user profile when app loads or refreshes - with better error handling
  useEffect(() => {
    const loadProfile = async () => {
      try {
        await dispatch(fetchProfile()).unwrap();
      } catch (err) {
        // Silently handle auth errors - don't show them in console
        if (err?.message?.includes('Admin access only') || 
            err?.message?.includes('Authentication') ||
            err?.message?.includes('Unauthorized')) {
          // This is normal for unauthenticated users
          console.log('User not authenticated - this is normal for public access');
        } else {
          console.warn("Profile fetch error:", err?.message || "Unknown error");
        }
      } finally {
        setCheckingAuth(false);
      }
    };
    loadProfile();
  }, [dispatch]);

  if (checkingAuth || loading) return <Loader />;

  // ✅ Role-based guards
  const AdminRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    return user.role === "admin" ? children : <Navigate to="/guest" replace />;
  };

  const GuestRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    return user.role === "guest" ? children : <Navigate to="/admin" replace />;
  };

  const PublicOnlyRoute = ({ children }) => {
    if (user) {
      return user.role === "admin" ? (
        <Navigate to="/admin" replace />
      ) : (
        <Navigate to="/guest" replace />
      );
    }
    return children;
  };

  // ✅ Authenticated Route (for both admin and guest)
  const AuthenticatedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
    return children;
  };

  return (
    <ErrorBoundary>
      <Suspense fallback={<Loader />}>
        <Routes>
          {/* 🌍 Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/hotel/:id" element={<HotelDetail />} />

          {/* 🔑 Auth Routes */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <Login />
              </PublicOnlyRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicOnlyRoute>
                <Signup />
              </PublicOnlyRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* 🔔 Guest Notifications */}
          <Route
            path="/guest/notifications"
            element={
              <GuestRoute>
                <GuestLayout>
                  <Notifications />
                </GuestLayout>
              </GuestRoute>
            }
          />
          <Route
            path="/guest/notifications/:id"
            element={
              <GuestRoute>
                <GuestLayout>
                  <NotificationDetails />
                </GuestLayout>
              </GuestRoute>
            }
          />

          {/* 🔔 Admin Notifications */}
          <Route 
            path="/admin/notifications" 
            element={
              <AdminRoute>
                <Notifications />
              </AdminRoute>
            } 
          />
          <Route
            path="/admin/notifications/:id"
            element={
              <AdminRoute>
                <NotificationDetails />
              </AdminRoute>
            }
          />

          {/* 🧳 Guest Routes */}
          <Route
            path="/guest"
            element={
              <GuestRoute> 
                <AdminLayout>         
                  <GuestDashboard />
                </AdminLayout>
              </GuestRoute>
            }
          />
          
          <Route
            path="/guest/bookings"
            element={
              <GuestRoute>
                <BookingHistory />               
              </GuestRoute>
            }
          />

          {/* 📋 Guest Booking Details */}
          <Route
            path="/bookings/:id"
            element={
              <AuthenticatedRoute>
                {user?.role === 'admin' ? (
                  <Navigate to={`/admin/bookings/${location.pathname.split('/').pop()}`} replace />
                ) : (
                  <GuestLayout>
                    <GuestBookingDetails />
                  </GuestLayout>
                )}
              </AuthenticatedRoute>
            }
          />

          <Route
            path="/profile"
            element={
              <GuestRoute>
                <GuestLayout>
                  <Settings />
                </GuestLayout>
              </GuestRoute>
            }
          />
          <Route
            path="/guest/bookings/verify/:id"
            element={
              <GuestRoute>
                <GuestLayout>
                  <BookingVerify />
                </GuestLayout>
              </GuestRoute>
            }
          />

          {/* 🧑‍💼 Admin Routes */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/hotels"
            element={
              <AdminRoute>
                <HotelsManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersManagement />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/bookings"
            element={
              <AdminRoute>
                <BookingsManagement />
              </AdminRoute>
            }
          />

          {/* 📋 Admin Booking Details */}
          <Route
            path="/admin/bookings/:id"
            element={
              <AdminRoute>
                <BookingDetails />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/analytics"
            element={
              <AdminRoute>
                <AdminAnalytics />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/pricing-rules"
            element={
              <AdminRoute>
                <PricingRules />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/audit"
            element={
              <AdminRoute>
                <AuditDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <AdminRoute>
                <Settings />
              </AdminRoute>
            }
          />

          {/* 🤖 Chat Assistant */}
          <Route path="/chat-assistant" element={<ChatbotPage />} />

          {/* 🚫 404 Page */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
};

export default AppRoutes;