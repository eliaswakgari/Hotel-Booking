import React, { useState, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { FaBars, FaTimes, FaHome, FaEnvelope, FaUser, FaHistory, FaTachometerAlt, FaBell } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { logoutUserThunk } from "../features/auth/authThunks";
import { fetchNotifications, markAsRead, markAllAsRead } from "../features/notification/notificationSlice";
import { toast } from "react-toastify";
import { FiMessageCircle } from "react-icons/fi";
import { io } from "socket.io-client";

const Header = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { notifications, unreadCount } = useSelector((state) => state.notification);

  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationDropdownOpen, setNotificationDropdownOpen] = useState(false);
  const [socket, setSocket] = useState(null);

  // Fetch notifications when user is logged in
  useEffect(() => {
    if (user) {
      console.log('🔄 Fetching notifications for user:', user._id);
      dispatch(fetchNotifications())
        .unwrap()
        .then(() => console.log('✅ Notifications fetched successfully'))
        .catch(error => console.error('❌ Error fetching notifications:', error));
    }
  }, [dispatch, user]);

  // Socket for real-time notifications - IMPROVED
  useEffect(() => {
    if (!user) return;

    console.log('🔌 Connecting to socket for user:', user._id);
    const newSocket = io("http://localhost:5000", {
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Join user's personal room for notifications
    newSocket.emit('join', user._id);

    newSocket.on('connect', () => {
      console.log('✅ Socket connected successfully');
    });

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error);
    });

    newSocket.on('newNotification', (notification) => {
      console.log('📢 New notification received:', notification);
      dispatch(fetchNotifications()); // Refresh notifications

      // Show toast for unread notifications that belong to this user
      if (notification.recipient === user._id || (user.role === 'admin' && notification.type === 'refund_requested')) {
        toast.info(`🔔 ${notification.title}: ${notification.message}`, {
          position: "top-right",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          toastId: notification._id // Prevent duplicates
        });
      }
    });

    newSocket.on('notificationUpdated', (notification) => {
      console.log('🔄 Notification updated:', notification);
      dispatch(fetchNotifications());
    });

    newSocket.on('allNotificationsRead', () => {
      console.log('📭 All notifications marked as read');
      dispatch(fetchNotifications());
    });

    newSocket.on('notificationDeleted', (notificationId) => {
      console.log('🗑️ Notification deleted:', notificationId);
      dispatch(fetchNotifications());
    });

    // Handle refund-specific notifications
    newSocket.on('refundRequested', (data) => {
      console.log('💸 Refund request notification:', data);
      if (user.role === 'admin') {
        dispatch(fetchNotifications());
        toast.info(`💰 New Refund Request: ${data.message}`, {
          position: "top-right",
          autoClose: 6000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
        });
      }
    });

    return () => {
      console.log('🔌 Disconnecting socket');
      newSocket.disconnect();
    };
  }, [dispatch, user]);

  const getUserInitials = () => {
    if (!user?.name) return "U";
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleNotificationClick = async (notification) => {
    try {
      // If notification is unread, mark it as read first
      if (!notification.read) {
        await dispatch(markAsRead(notification._id)).unwrap();
      }

      // Navigate based on user role and notification type
      if (user.role === 'admin' && notification.booking) {
        // For admins with booking-related notifications, go to booking details
        navigate(`/admin/notifications/${notification._id}`);
      } else {
        // Otherwise go to notification details
        navigate(`/admin/notifications/${notification._id}`);
      }

      setNotificationDropdownOpen(false);
    } catch (error) {
      console.error('Error handling notification click:', error);
      toast.error("Failed to process notification");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      toast.success("All notifications marked as read");
      setNotificationDropdownOpen(false);
    } catch (error) {
      console.error('Mark all as read error:', error);
      toast.error("Failed to mark notifications as read");
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'refund_requested':
        return '💰';
      case 'booking_created':
        return '📅';
      case 'booking_approved':
        return '✅';
      case 'payment_received':
        return '💳';
      default:
        return '🔔';
    }
  };

  const navLinks = [];

  if (user?.role === "admin") {
    navLinks.push({
      name: "Dashboard",
      to: "/admin",
      icon: <FaTachometerAlt className="inline mr-2" />,
    });
  }

  if (user?.role === "guest") {
    navLinks.push({
      name: "My Bookings",
      to: "/guest/bookings",
      icon: <FaHistory className="inline mr-2" />,
    });
  }

  const handleLogout = async () => {
    try {
      await dispatch(logoutUserThunk()).unwrap();
      if (socket) {
        socket.disconnect();
      }
      toast.success("Logged out successfully!");
      navigate("/login");
    } catch (err) {
      console.error(err);
      toast.error("Logout failed!");
    }
  };

  // Filter notifications for display (show latest 5)
  const displayedNotifications = notifications.slice(0, 5);

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50 transition-colors duration-500">
      <div className="max-w-7xl mx-auto px-4 flex justify-between items-center h-16">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold flex items-center gap-2 text-rose-500">
          <FaHome /> HotelBooking
        </Link>

        {/* Chat Assistant Link */}
        <NavLink
          to="/chat-assistant"
          className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
        >
          <FiMessageCircle size={18} />
          <span className="hidden sm:inline">Chat Assistant</span>
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6 items-center">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.to}
              className="flex items-center gap-1 text-gray-700 hover:text-rose-500 px-3 py-1 rounded transition font-medium"
            >
              {link.icon}
              {link.name}
            </Link>
          ))}

          {/* Notification Bell - Only for logged-in users */}
          {user && (
            <div
              className="relative"
              onMouseEnter={() => setNotificationDropdownOpen(true)}
              onMouseLeave={() => setNotificationDropdownOpen(false)}
            >
              <button className="relative flex items-center gap-2 font-semibold text-gray-700 hover:text-rose-500 transition p-2">
                <FaBell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              <AnimatePresence>
                {notificationDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                          <FaBell className="text-rose-500" />
                          Notifications
                          {unreadCount > 0 && (
                            <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
                              {unreadCount} new
                            </span>
                          )}
                        </h3>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="overflow-y-auto max-h-64">
                      {displayedNotifications.length === 0 ? (
                        <div className="p-6 text-center text-gray-500">
                          <FaBell className="text-3xl text-gray-300 mx-auto mb-2" />
                          <p>No notifications</p>
                          <p className="text-sm">You're all caught up!</p>
                        </div>
                      ) : (
                        displayedNotifications.map((notification) => (
                          <div
                            key={notification._id}
                            className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition group ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                              }`}
                            onClick={() => handleNotificationClick(notification)}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start gap-3 flex-1">
                                <div className="text-lg mt-0.5">
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <p className={`font-medium text-sm truncate ${!notification.read ? 'text-blue-900' : 'text-gray-900'
                                      }`}>
                                      {notification.title}
                                    </p>
                                    {!notification.read && (
                                      <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                        New
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-gray-600 mb-1 line-clamp-2">
                                    {notification.message}
                                  </p>
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-gray-400">
                                      {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                                      {new Date(notification.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    {notification.type === 'refund_requested' && (
                                      <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                        Refund
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    <div className="p-3 border-t border-gray-100 bg-gray-50">
                      <Link
                        to="/admin/notifications"
                        className="block text-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                        onClick={() => setNotificationDropdownOpen(false)}
                      >
                        View All Notifications
                      </Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* User Dropdown */}
          {user ? (
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <button className="flex items-center gap-2 font-semibold text-gray-700 hover:text-rose-500 transition">
                {user?.profileImage ? (
                  <img
                    src={user.profileImage}
                    alt={`${user.name}'s avatar`}
                    className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold">
                    {getUserInitials()}
                  </div>
                )}
                <span className="hidden lg:inline">{user?.name || "User"}</span>
              </button>

              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="text-sm font-medium text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <p className="text-xs text-rose-500 font-medium capitalize mt-1">
                        {user.role}
                      </p>
                    </div>
                    <Link
                      to={user?.role === "admin" ? "/admin/settings" : "/profile"}
                      className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                      onClick={() => setDropdownOpen(false)}
                    >
                      Profile Settings
                    </Link>
                    {user?.role === "admin" && (
                      <Link
                        to="/admin/notifications"
                        className="block px-4 py-2 text-gray-700 hover:bg-gray-50 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Notifications
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="w-full text-left block px-4 py-2 text-gray-700 hover:bg-gray-50 transition border-t border-gray-100"
                    >
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link
              to="/login"
              className="font-semibold text-gray-700 hover:text-rose-500 px-3 py-1 rounded transition flex items-center gap-1"
            >
              <FaUser /> Login
            </Link>
          )}
        </nav>

        {/* Mobile Hamburger Menu */}
        <button
          className="md:hidden text-2xl text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          {menuOpen ? <FaTimes /> : <FaBars />}
        </button>
      </div>

      {/* Mobile Navigation */}
      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-200 text-gray-700 px-4 overflow-hidden"
          >
            {/* Add notification section for mobile */}
            {user && unreadCount > 0 && (
              <div className="py-3 border-b border-gray-100 bg-blue-50">
                <Link
                  to="/admin/notifications"
                  className="flex items-center gap-2 text-blue-600 font-medium"
                  onClick={() => setMenuOpen(false)}
                >
                  <FaBell />
                  Notifications ({unreadCount})
                </Link>
              </div>
            )}

            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.to}
                className="block py-3 flex items-center gap-2 hover:text-rose-500 border-b border-gray-100"
                onClick={() => setMenuOpen(false)}
              >
                {link.icon} {link.name}
              </Link>
            ))}

            {/* User info in mobile menu */}
            {user && (
              <div className="py-3 border-t border-gray-200">
                <div className="flex items-center gap-2 py-2">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={`${user.name}'s avatar`}
                      className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center text-sm font-bold">
                      {getUserInitials()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                    <p className="text-xs text-rose-500 font-medium capitalize">
                      {user.role}
                    </p>
                  </div>
                </div>
                <Link
                  to={user?.role === "admin" ? "/admin/settings" : "/profile"}
                  className="block py-2 text-gray-700 hover:text-rose-500"
                  onClick={() => setMenuOpen(false)}
                >
                  Profile Settings
                </Link>
                {user?.role === "admin" && (
                  <Link
                    to="/admin/notifications"
                    className="block py-2 text-gray-700 hover:text-rose-500"
                    onClick={() => setMenuOpen(false)}
                  >
                    Notifications
                  </Link>
                )}
                <button
                  onClick={() => {
                    handleLogout();
                    setMenuOpen(false);
                  }}
                  className="w-full text-left block py-2 text-gray-700 hover:text-rose-500 border-t border-gray-100 mt-2"
                >
                  Logout
                </button>
              </div>
            )}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;