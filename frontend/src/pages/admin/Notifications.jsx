import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../../layouts/AdminLayout";
import { 
  fetchNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from "../../features/notification/notificationSlice";
import { FaBell, FaCheck, FaTrash, FaEye, FaEyeSlash, FaExternalLinkAlt, FaFilter } from "react-icons/fa";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const Notifications = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { notifications, unreadCount, loading } = useSelector((state) => state.notification);
  const [filter, setFilter] = useState('all'); // 'all', 'unread', 'read'

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  // Calculate stats
  const totalNotifications = notifications.length;
  const readNotifications = notifications.filter(n => n.read).length;
  const unreadNotifications = unreadCount;

const handleMarkAsRead = async (notificationId, e) => {
  e.stopPropagation();
  try {
    await dispatch(markAsRead(notificationId)).unwrap();
    // Success - state will be updated automatically
  } catch (error) {
    console.error("Mark as read error:", error);
    Swal.fire({
      title: "Error",
      text: error?.message || "Failed to mark notification as read",
      icon: "error",
      confirmButtonText: "OK"
    });
  }
};

const handleNotificationClick = async (notification) => {
  try {
    // If notification is unread, mark it as read first
    if (!notification.read) {
      await dispatch(markAsRead(notification._id)).unwrap();
    }
    // Then navigate to the details page
    navigate(`/admin/notifications/${notification._id}`);
  } catch (error) {
    console.error("Failed to mark notification as read:", error);
    // Even if marking as read fails, still navigate to details
    navigate(`/admin/notifications/${notification._id}`);
  }
};
  const handleMarkAllAsRead = async () => {
    try {
      await dispatch(markAllAsRead()).unwrap();
      Swal.fire("Success", "All notifications marked as read", "success");
    } catch (error) {
      Swal.fire("Error", "Failed to mark notifications as read", "error");
    }
  };

  const handleDeleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "This notification will be permanently deleted!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!"
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteNotification(notificationId)).unwrap();
        Swal.fire("Deleted!", "Notification has been deleted.", "success");
      } catch (error) {
        Swal.fire("Error", "Failed to delete notification", "error");
      }
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_created':
        return '📅';
      case 'booking_approved':
        return '✅';
      case 'booking_rejected':
        return '❌';
      case 'booking_cancelled':
        return '🚫';
      case 'payment_received':
        return '💰';
      case 'refund_requested':
        return '💸';
      case 'refund_approved':
        return '✅';
      case 'refund_rejected':
        return '❌';
      case 'system_alert':
        return '⚠️';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'booking_created':
        return 'bg-blue-100 text-blue-800';
      case 'booking_approved':
        return 'bg-green-100 text-green-800';
      case 'booking_rejected':
        return 'bg-red-100 text-red-800';
      case 'booking_cancelled':
        return 'bg-orange-100 text-orange-800';
      case 'payment_received':
        return 'bg-purple-100 text-purple-800';
      case 'refund_requested':
        return 'bg-yellow-100 text-yellow-800';
      case 'refund_approved':
        return 'bg-green-100 text-green-800';
      case 'refund_rejected':
        return 'bg-red-100 text-red-800';
      case 'system_alert':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notifications...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Notifications
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage and view all your notifications
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-lg p-2 border">
              <FaBell className="text-purple-500" />
              <span className="text-sm font-medium">
                {unreadCount} unread
              </span>
            </div>
            
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
              >
                <FaCheck size={14} />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Filters with Beautiful Badges */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <FaFilter className="text-purple-500" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Notifications</h3>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {/* All Filter Badge */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('all')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                filter === 'all'
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white border-purple-500 shadow-lg shadow-purple-500/25'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-400 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                filter === 'all' ? 'bg-white/20' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
              }`}>
                <FaBell size={16} />
              </div>
              <div className="text-left">
                <div className="font-semibold">All Notifications</div>
                <div className={`text-sm ${filter === 'all' ? 'text-purple-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  {totalNotifications} total
                </div>
              </div>
              <div className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                filter === 'all' ? 'bg-white/30 text-white' : 'bg-purple-500 text-white'
              }`}>
                {totalNotifications}
              </div>
            </motion.button>

            {/* Unread Filter Badge */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('unread')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                filter === 'unread'
                  ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-yellow-500 shadow-lg shadow-yellow-500/25'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-yellow-300 dark:hover:border-yellow-400 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                filter === 'unread' ? 'bg-white/20' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
              }`}>
                <FaEyeSlash size={16} />
              </div>
              <div className="text-left">
                <div className="font-semibold">Unread</div>
                <div className={`text-sm ${filter === 'unread' ? 'text-yellow-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Requires attention
                </div>
              </div>
              <div className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                filter === 'unread' ? 'bg-white/30 text-white' : 'bg-yellow-500 text-white'
              }`}>
                {unreadNotifications}
              </div>
            </motion.button>

            {/* Read Filter Badge */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setFilter('read')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 border-2 ${
                filter === 'read'
                  ? 'bg-gradient-to-r from-green-500 to-green-600 text-white border-green-500 shadow-lg shadow-green-500/25'
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-green-300 dark:hover:border-green-400 hover:shadow-md'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                filter === 'read' ? 'bg-white/20' : 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
              }`}>
                <FaEye size={16} />
              </div>
              <div className="text-left">
                <div className="font-semibold">Read</div>
                <div className={`text-sm ${filter === 'read' ? 'text-green-100' : 'text-gray-500 dark:text-gray-400'}`}>
                  Already viewed
                </div>
              </div>
              <div className={`ml-2 px-2 py-1 rounded-full text-xs font-bold ${
                filter === 'read' ? 'bg-white/30 text-white' : 'bg-green-500 text-white'
              }`}>
                {readNotifications}
              </div>
            </motion.button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBell className="text-gray-400 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No notifications found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {filter === 'all' 
                  ? "You're all caught up! No notifications to display at the moment." 
                  : `No ${filter} notifications found. Try changing your filter.`
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredNotifications.map((notification, index) => (
                <motion.div
                  key={notification._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700 transition cursor-pointer group ${
                    !notification.read ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${getNotificationColor(notification.type)}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${
                            !notification.read 
                              ? 'text-blue-900 dark:text-blue-100' 
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {notification.title}
                          </h3>
                          {!notification.read && (
                            <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                              New
                            </span>
                          )}
                          {/* View Details Indicator */}
                          <span className="text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                            <FaExternalLinkAlt size={10} />
                            View details
                          </span>
                        </div>
                        
                        <p className="text-gray-600 dark:text-gray-300 mb-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                          <span>
                            {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                            {new Date(notification.createdAt).toLocaleTimeString()}
                          </span>
                          {notification.booking && (
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                              Booking: {notification.booking.bookingId}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                            notification.type === 'refund_requested' ? 'bg-yellow-100 text-yellow-800' :
                            notification.type === 'booking_created' ? 'bg-blue-100 text-blue-800' :
                            notification.type === 'payment_received' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {notification.type?.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      {!notification.read && (
                        <button
                          onClick={(e) => handleMarkAsRead(notification._id, e)}
                          className="p-2 text-green-600 hover:bg-green-100 dark:hover:bg-green-900 rounded-lg transition opacity-70 hover:opacity-100"
                          title="Mark as read"
                        >
                          <FaEye size={14} />
                        </button>
                      )}
                      
                      <button
                        onClick={(e) => handleDeleteNotification(notification._id, e)}
                        className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition opacity-70 hover:opacity-100"
                        title="Delete notification"
                      >
                        <FaTrash size={14} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};

export default Notifications;