import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../layouts/AdminLayout";
import { fetchBookingById } from "../../features/booking/bookingSlice";
import { markAsRead } from "../../features/notification/notificationSlice";
import { FaArrowLeft, FaCalendar, FaUser, FaHome, FaDollarSign, FaClock, FaCheck, FaTimes, FaReceipt } from "react-icons/fa";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBooking, loading } = useSelector((state) => state.bookings);
  const { user } = useSelector((state) => state.auth);

  const [activeTab, setActiveTab] = useState("details");

  useEffect(() => {
    if (id) {
      dispatch(fetchBookingById(id));
    }
  }, [dispatch, id]);

  // Mark notification as read when viewing booking details
  useEffect(() => {
    if (currentBooking && user?.role === 'admin') {
      // You might want to pass notification ID from navigation state
      const notificationId = window.location.state?.notificationId;
      if (notificationId) {
        dispatch(markAsRead(notificationId));
      }
    }
  }, [currentBooking, user, dispatch]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (!currentBooking) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <FaReceipt className="text-gray-400 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Not Found</h2>
          <p className="text-gray-600 mb-6">The requested booking could not be found.</p>
          <button
            onClick={() => navigate("/admin/bookings")}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition"
          >
            Back to Bookings
          </button>
        </div>
      </AdminLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'succeeded':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateNights = (checkIn, checkOut) => {
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  };

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/admin/bookings")}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
            >
              <FaArrowLeft />
              Back to Bookings
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">Booking ID: {currentBooking.bookingId}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(currentBooking.status)}`}>
              {currentBooking.status.charAt(0).toUpperCase() + currentBooking.status.slice(1)}
            </span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(currentBooking.paymentStatus)}`}>
              Payment: {currentBooking.paymentStatus}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex gap-8 px-6">
              {['details', 'guest', 'payment', 'timeline'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-2 border-b-2 font-medium text-sm transition ${
                    activeTab === tab
                      ? 'border-purple-500 text-purple-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Details Tab */}
            {activeTab === 'details' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-2 gap-6"
              >
                {/* Booking Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaCalendar className="text-purple-500" />
                      Booking Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-in:</span>
                        <span className="font-medium">{formatDate(currentBooking.checkIn)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Check-out:</span>
                        <span className="font-medium">{formatDate(currentBooking.checkOut)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Nights:</span>
                        <span className="font-medium">
                          {calculateNights(currentBooking.checkIn, currentBooking.checkOut)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Type:</span>
                        <span className="font-medium">{currentBooking.roomType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Room Number:</span>
                        <span className="font-medium">{currentBooking.roomNumber}</span>
                      </div>
                    </div>
                  </div>

                  {/* Guest Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaUser className="text-purple-500" />
                      Guest Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Name:</span>
                        <span className="font-medium">{currentBooking.user?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Email:</span>
                        <span className="font-medium">{currentBooking.user?.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Phone:</span>
                        <span className="font-medium">{currentBooking.user?.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Adults:</span>
                        <span className="font-medium">{currentBooking.adults}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Children:</span>
                        <span className="font-medium">{currentBooking.children || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hotel & Payment Information */}
                <div className="space-y-6">
                  {/* Hotel Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaHome className="text-purple-500" />
                      Hotel Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Hotel Name:</span>
                        <span className="font-medium">{currentBooking.hotel?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Address:</span>
                        <span className="font-medium text-right">
                          {currentBooking.hotel?.location?.address || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Base Price:</span>
                        <span className="font-medium">
                          ${currentBooking.hotel?.basePrice || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Information */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <FaDollarSign className="text-purple-500" />
                      Payment Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total Price:</span>
                        <span className="font-medium text-green-600">
                          ${currentBooking.totalPrice?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Refunded Amount:</span>
                        <span className="font-medium text-red-600">
                          ${currentBooking.refundedAmount?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Payment Intent:</span>
                        <span className="font-medium text-xs">
                          {currentBooking.paymentIntentId || 'N/A'}
                        </span>
                      </div>
                      {currentBooking.refundStatus && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Refund Status:</span>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            currentBooking.refundStatus === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {currentBooking.refundStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Guest Tab */}
            {activeTab === 'guest' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Guest Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Personal Information</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Full Name:</span>
                          <span className="font-medium">{currentBooking.user?.name || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Email:</span>
                          <span className="font-medium">{currentBooking.user?.email || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Phone:</span>
                          <span className="font-medium">{currentBooking.user?.phone || 'N/A'}</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Booking Preferences</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Adults:</span>
                          <span className="font-medium">{currentBooking.adults}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Children:</span>
                          <span className="font-medium">{currentBooking.children || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Guests:</span>
                          <span className="font-medium">
                            {currentBooking.adults + (currentBooking.children || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Payment Tab */}
            {activeTab === 'payment' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Payment Details</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="text-2xl font-bold text-green-600">
                        ${currentBooking.totalPrice?.toFixed(2) || '0.00'}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-50 rounded">
                        <span className="text-gray-600 block text-sm">Payment Status</span>
                        <span className={`font-medium ${getPaymentStatusColor(currentBooking.paymentStatus)} px-2 py-1 rounded text-sm`}>
                          {currentBooking.paymentStatus}
                        </span>
                      </div>
                      
                      <div className="p-3 bg-gray-50 rounded">
                        <span className="text-gray-600 block text-sm">Payment Method</span>
                        <span className="font-medium">Credit Card (Stripe)</span>
                      </div>
                    </div>

                    {currentBooking.paymentIntentId && (
                      <div className="p-3 bg-gray-50 rounded">
                        <span className="text-gray-600 block text-sm mb-1">Payment Intent ID</span>
                        <code className="text-xs bg-gray-100 p-2 rounded block">
                          {currentBooking.paymentIntentId}
                        </code>
                      </div>
                    )}

                    {currentBooking.refundedAmount > 0 && (
                      <div className="p-3 bg-red-50 rounded border border-red-200">
                        <span className="text-red-600 block text-sm">Refunded Amount</span>
                        <span className="text-xl font-bold text-red-600">
                          -${currentBooking.refundedAmount.toFixed(2)}
                        </span>
                        {currentBooking.refundStatus && (
                          <span className="text-red-600 text-sm block mt-1">
                            Status: {currentBooking.refundStatus}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Timeline Tab */}
            {activeTab === 'timeline' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-2xl"
              >
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Booking Timeline</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                        <FaCheck className="text-white text-sm" />
                      </div>
                      <div>
                        <p className="font-medium">Booking Created</p>
                        <p className="text-gray-600 text-sm">
                          {new Date(currentBooking.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {currentBooking.status === 'confirmed' && (
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <FaCheck className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="font-medium">Booking Confirmed</p>
                          <p className="text-gray-600 text-sm">
                            Payment processed successfully
                          </p>
                        </div>
                      </div>
                    )}

                    {currentBooking.status === 'cancelled' && (
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <FaTimes className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="font-medium">Booking Cancelled</p>
                          <p className="text-gray-600 text-sm">
                            {currentBooking.updatedAt ? new Date(currentBooking.updatedAt).toLocaleString() : 'Recently'}
                          </p>
                        </div>
                      </div>
                    )}

                    {currentBooking.refundedAmount > 0 && (
                      <div className="flex items-start gap-4">
                        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                          <FaDollarSign className="text-white text-sm" />
                        </div>
                        <div>
                          <p className="font-medium">Refund Processed</p>
                          <p className="text-gray-600 text-sm">
                            Amount: ${currentBooking.refundedAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            onClick={() => navigate("/admin/bookings")}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
          >
            Back to List
          </button>
          {currentBooking.status === 'pending' && (
            <>
              <button
                onClick={() => {
                  // Add approve booking logic here
                  Swal.fire("Info", "Approve booking functionality would go here", "info");
                }}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                Approve Booking
              </button>
              <button
                onClick={() => {
                  // Add reject booking logic here
                  Swal.fire("Info", "Reject booking functionality would go here", "info");
                }}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                Reject Booking
              </button>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default BookingDetails;