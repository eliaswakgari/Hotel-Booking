import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../layouts/AdminLayout";
import { fetchNotificationDetails, markAsRead } from "../../features/notification/notificationSlice";
import { getBookingDetails } from "../../api/bookingApi";
import { 
  FaArrowLeft, 
  FaCalendar, 
  FaUser, 
  FaDollarSign, 
  FaHome, 
  FaClock, 
  FaExclamationTriangle,
  FaInfoCircle,
  FaReceipt,
  FaTag,
  FaCog
} from "react-icons/fa";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const NotificationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { notification, loading } = useSelector((state) => state.notification);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [loadingBooking, setLoadingBooking] = useState(false);

  useEffect(() => {
    if (id) {
      dispatch(fetchNotificationDetails(id));
    }
  }, [dispatch, id]);

  // Fetch booking details if notification is related to a booking
  useEffect(() => {
    const fetchBookingData = async () => {
      if (notification?.booking) {
        setLoadingBooking(true);
        try {
          const response = await getBookingDetails(notification.booking);
          setBookingDetails(response.data);
        } catch (error) {
          console.error('Error fetching booking details:', error);
        } finally {
          setLoadingBooking(false);
        }
      }
    };

    if (notification) {
      fetchBookingData();
      
      // Mark notification as read when viewing details
      if (!notification.read) {
        dispatch(markAsRead(notification._id));
      }
    }
  }, [notification, dispatch]);

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
        return 'from-blue-500 to-blue-600';
      case 'booking_approved':
        return 'from-green-500 to-green-600';
      case 'booking_rejected':
        return 'from-red-500 to-red-600';
      case 'booking_cancelled':
        return 'from-orange-500 to-orange-600';
      case 'payment_received':
        return 'from-purple-500 to-purple-600';
      case 'refund_requested':
        return 'from-yellow-500 to-yellow-600';
      case 'refund_approved':
        return 'from-green-500 to-green-600';
      case 'refund_rejected':
        return 'from-red-500 to-red-600';
      case 'system_alert':
        return 'from-yellow-500 to-yellow-600';
      default:
        return 'from-gray-500 to-gray-600';
    }
  };

  const getPriorityColor = (type) => {
    return type?.includes('refund') || type?.includes('system') ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  const getPriorityText = (type) => {
    return type?.includes('refund') || type?.includes('system') ? 'High Priority' : 'Normal Priority';
  };

  const handleTakeAction = () => {
    if (notification?.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification?.booking) {
      navigate(`/admin/bookings/${notification.booking}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading notification details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!notification) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Notification Not Found</h3>
          <p className="text-gray-600 mb-4">The notification you're looking for doesn't exist.</p>
          <Link to="/admin/notifications" className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
            Back to Notifications
          </Link>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="w-full max-w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-3 hover:bg-gray-100 rounded-xl transition border border-gray-200"
          >
            <FaArrowLeft className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Notification Details</h1>
            <p className="text-gray-600">Complete overview of notification information</p>
          </div>
        </div>

        {/* Main Paper-like Container - Full width */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden w-full"
        >
          {/* Header Section with Gradient */}
          <div className={`bg-gradient-to-r ${getNotificationColor(notification.type)} p-8 text-white`}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-6">
                <div className="text-5xl bg-white/20 p-4 rounded-2xl backdrop-blur-sm">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-3">
                    <h1 className="text-2xl font-bold">{notification.title}</h1>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPriorityColor(notification.type)}`}>
                      {getPriorityText(notification.type)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      notification.read ? 'bg-white/20 text-white' : 'bg-yellow-400 text-gray-900'
                    }`}>
                      {notification.read ? 'Read' : 'New'}
                    </span>
                  </div>
                  <p className="text-white/90 text-lg leading-relaxed max-w-3xl">
                    {notification.message}
                  </p>
                  <div className="flex items-center gap-6 mt-4 text-white/80">
                    <div className="flex items-center gap-2">
                      <FaClock className="text-sm" />
                      <span className="text-sm">
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FaTag className="text-sm" />
                      <span className="text-sm capitalize">
                        {notification.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Main Content - 2/3 width */}
              <div className="xl:col-span-2 space-y-8">
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCog className="text-blue-500" />
                    Quick Actions
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    <Link
                      to="/admin/notifications"
                      className="bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition font-medium border border-gray-300"
                    >
                      Back to Notifications
                    </Link>
                    
                    {notification.booking && (
                      <Link
                        to={`/admin/bookings/${notification.booking}`}
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition font-medium"
                      >
                        Manage Booking
                      </Link>
                    )}

                    {notification.type === 'refund_requested' && (
                      <Link
                        to="/admin/refund-requests"
                        className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition font-medium"
                      >
                        Process Refund
                      </Link>
                    )}

                    {notification.actionUrl && (
                      <button
                        onClick={handleTakeAction}
                        className="bg-purple-500 text-white px-4 py-2 rounded-lg hover:bg-purple-600 transition font-medium"
                      >
                        Take Action
                      </button>
                    )}
                  </div>
                </div>

                {/* Booking Information */}
                {notification.booking && (
                  <div className="border border-gray-200 rounded-xl overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                        <FaCalendar className="text-blue-500" />
                        Booking Information
                      </h3>
                    </div>
                    
                    <div className="p-6">
                      {loadingBooking ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : bookingDetails ? (
                        <div className="space-y-6">
                          {/* Basic Info Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Booking ID</label>
                                <p className="text-lg font-semibold text-gray-900">{bookingDetails.bookingId}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Status</label>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  bookingDetails.status === 'confirmed' ? 'bg-green-100 text-green-800 border border-green-200' :
                                  bookingDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  bookingDetails.status === 'cancelled' ? 'bg-red-100 text-red-800 border border-red-200' :
                                  'bg-gray-100 text-gray-800 border border-gray-200'
                                }`}>
                                  {bookingDetails.status?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Total Amount</label>
                                <p className="text-2xl font-bold text-green-600">${bookingDetails.totalPrice}</p>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-500 block mb-2">Payment Status</label>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                  bookingDetails.paymentStatus === 'succeeded' ? 'bg-green-100 text-green-800 border border-green-200' :
                                  bookingDetails.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                                  'bg-red-100 text-red-800 border border-red-200'
                                }`}>
                                  {bookingDetails.paymentStatus?.toUpperCase()}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Dates & Room Info */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FaCalendar className="text-blue-500" />
                                Stay Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Check-in:</span>
                                  <span className="font-semibold">{new Date(bookingDetails.checkIn).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Check-out:</span>
                                  <span className="font-semibold">{new Date(bookingDetails.checkOut).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Nights:</span>
                                  <span className="font-semibold">
                                    {Math.ceil((new Date(bookingDetails.checkOut) - new Date(bookingDetails.checkIn)) / (1000 * 60 * 60 * 24))}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <div className="space-y-3">
                              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                                <FaHome className="text-green-500" />
                                Room Details
                              </h4>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Room Number:</span>
                                  <span className="font-semibold">{bookingDetails.roomNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Room Type:</span>
                                  <span className="font-semibold">{bookingDetails.roomType}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Guests:</span>
                                  <span className="font-semibold">
                                    {bookingDetails.adults} adults {bookingDetails.children ? `, ${bookingDetails.children} children` : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Refund Request Details */}
                          {notification.type === 'refund_requested' && bookingDetails.refundRequest && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mt-4">
                              <h4 className="text-lg font-bold text-yellow-800 mb-4 flex items-center gap-2">
                                <FaDollarSign className="text-yellow-600" />
                                Refund Request Details
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-yellow-700 font-medium">Requested Amount:</span>
                                    <span className="font-bold text-yellow-800">${bookingDetails.refundRequest.requestedAmount}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-yellow-700 font-medium">Requested At:</span>
                                    <span className="font-semibold">
                                      {new Date(bookingDetails.refundRequest.requestedAt).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex justify-between">
                                    <span className="text-yellow-700 font-medium">Refund Status:</span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      bookingDetails.refundStatus === 'requested' ? 'bg-yellow-100 text-yellow-800' :
                                      bookingDetails.refundStatus === 'approved' ? 'bg-green-100 text-green-800' :
                                      bookingDetails.refundStatus === 'rejected' ? 'bg-red-100 text-red-800' :
                                      'bg-gray-100 text-gray-800'
                                    }`}>
                                      {bookingDetails.refundStatus?.toUpperCase() || 'NONE'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="mt-4 pt-4 border-t border-yellow-300">
                                <label className="text-yellow-700 font-medium block mb-2">Reason for Refund:</label>
                                <p className="text-yellow-800 bg-yellow-100/50 p-3 rounded-lg border border-yellow-200">
                                  {bookingDetails.refundRequest.reason || 'No reason provided'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <FaExclamationTriangle className="text-gray-400 text-2xl mx-auto mb-2" />
                          Unable to load booking details
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Sidebar - 1/3 width */}
              <div className="space-y-6">
                {/* User Information */}
                {notification.sender && (
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FaUser className="text-purple-500" />
                      User Information
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                        {notification.sender.name?.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-gray-900 text-lg">{notification.sender.name}</p>
                        <p className="text-gray-600 text-sm">{notification.sender.email}</p>
                        {notification.sender.phone && (
                          <p className="text-gray-600 text-sm">{notification.sender.phone}</p>
                        )}
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2 py-1 bg-white rounded-full text-xs font-medium text-gray-700 border border-purple-200">
                            {notification.sender.role || 'User'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notification Metadata */}
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaInfoCircle className="text-gray-500" />
                    Notification Details
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize text-gray-900">
                        {notification.type?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Priority:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(notification.type)}`}>
                        {getPriorityText(notification.type)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-200">
                      <span className="text-gray-600">Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        notification.read ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {notification.read ? 'Read' : 'Unread'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-600">Created:</span>
                      <span className="font-medium text-gray-900 text-sm">
                        {new Date(notification.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* System Information */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaReceipt className="text-blue-500" />
                    System Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Notification ID:</span>
                      <span className="font-mono text-gray-900">{notification._id}</span>
                    </div>
                    {notification.actionUrl && (
                      <div className="pt-2 border-t border-blue-200">
                        <span className="text-gray-600 block mb-1">Action URL:</span>
                        <code className="text-xs bg-white/50 p-2 rounded border border-blue-200 block break-all">
                          {notification.actionUrl}
                        </code>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
};

export default NotificationDetails;