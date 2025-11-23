import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import GuestLayout from "../../layouts/GuestLayout";
import { getBookingDetails } from "../../api/bookingApi";
import { 
  FaArrowLeft, 
  FaCalendar, 
  FaHome, 
  FaDollarSign, 
  FaUser, 
  FaClock,
  FaPrint,
  FaDownload,
  FaExclamationTriangle
} from "react-icons/fa";
import { motion } from "framer-motion";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";
import QRCode from "qrcode";

const GuestBookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        setLoading(true);
        const response = await getBookingDetails(id);
        const bookingData = response.data;

        // Check if the current user owns this booking
        if (bookingData.user._id !== user._id) {
          setError("Access denied. This booking doesn't belong to you.");
          return;
        }

        setBooking(bookingData);
      } catch (err) {
        console.error('Error fetching booking details:', err);
        setError(err.response?.data?.message || "Failed to load booking details");
      } finally {
        setLoading(false);
      }
    };

    if (id && user) {
      fetchBooking();
    }
  }, [id, user, dispatch]);

  const handleDownload = async () => {
    try {
      const verifyUrl = `${window.location.origin}/verify-booking/${booking._id}`;
      const qrCodeDataUrl = await QRCode.toDataURL(verifyUrl);

      const element = document.createElement("div");
      element.innerHTML = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: auto; padding: 20px; border: 1px solid #ccc;">
          <h1 style="text-align: center; color: #2c3e50;">Booking Receipt</h1>
          <img src="${booking.hotel?.images?.[0] || "https://via.placeholder.com/400"}"
               alt="${booking.hotel?.name}"
               style="width:100%; max-height:200px; object-fit:cover; margin-bottom: 15px; border-radius: 8px;" />
          <h2 style="color: #34495e;">${booking.hotel?.name}</h2>
          <table style="width:100%; border-collapse: collapse; margin-top: 10px;">
            <tr><td style="padding:8px; border:1px solid #ccc;">Booking ID</td><td style="padding:8px; border:1px solid #ccc;">${booking.bookingId}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ccc;">Check-in</td><td style="padding:8px; border:1px solid #ccc;">${new Date(booking.checkIn).toLocaleDateString()}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ccc;">Check-out</td><td style="padding:8px; border:1px solid #ccc;">${new Date(booking.checkOut).toLocaleDateString()}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ccc;">Room</td><td style="padding:8px; border:1px solid #ccc;">${booking.roomNumber} (${booking.roomType})</td></tr>
            <tr><td style="padding:8px; border:1px solid #ccc;">Guests</td><td style="padding:8px; border:1px solid #ccc;">${booking.adults} adults, ${booking.children || 0} children</td></tr>
            <tr><td style="padding:8px; border:1px solid #ccc;">Total</td><td style="padding:8px; border:1px solid #ccc;">$${booking.totalPrice}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ccc;">Status</td><td style="padding:8px; border:1px solid #ccc;">${booking.status}</td></tr>
            <tr><td style="padding:8px; border:1px solid #ccc;">Payment Status</td><td style="padding:8px; border:1px solid #ccc;">${booking.paymentStatus}</td></tr>
          </table>

          <div style="margin-top: 30px; display:flex; justify-content:space-between; align-items:center;">
            <div>
              <p><strong>Guest Signature:</strong> __________________________</p>
              <p><strong>Admin Approval:</strong> __________________________</p>
            </div>
            <div style="text-align:right;">
              <img src="${qrCodeDataUrl}" alt="QR Code" style="width:100px; height:100px;"/>
              <p style="font-size:12px; color:#7f8c8d;">Scan to verify</p>
            </div>
          </div>
        </div>
      `;

      html2pdf()
        .from(element)
        .set({
          margin: 10,
          filename: `Booking_${booking.bookingId}.pdf`,
          html2canvas: { scale: 2 },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .save();
    } catch (error) {
      console.error('Error generating PDF:', error);
      Swal.fire("Error", "Failed to generate PDF", "error");
    }
  };

  if (loading) {
    return (
      <GuestLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </GuestLayout>
    );
  }

  if (error) {
    return (
      <GuestLayout>
        <div className="text-center py-12">
          <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/guest/bookings" className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
            Back to My Bookings
          </Link>
        </div>
      </GuestLayout>
    );
  }

  if (!booking) {
    return (
      <GuestLayout>
        <div className="text-center py-12">
          <FaExclamationTriangle className="text-yellow-500 text-4xl mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">Booking Not Found</h3>
          <p className="text-gray-600 mb-4">The booking you're looking for doesn't exist.</p>
          <Link to="/guest/bookings" className="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600">
            Back to My Bookings
          </Link>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-3 hover:bg-gray-100 rounded-xl transition border border-gray-200"
            >
              <FaArrowLeft className="text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Booking Details</h1>
              <p className="text-gray-600">Complete overview of your booking</p>
            </div>
          </div>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition"
          >
            <FaDownload size={16} />
            Download PDF
          </button>
        </div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden"
        >
          {/* Header Section */}
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{booking.hotel?.name}</h2>
                <p className="text-purple-100">Booking ID: {booking.bookingId}</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">${booking.totalPrice}</p>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {booking.status?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Column */}
              <div className="space-y-6">
                {/* Stay Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaCalendar className="text-blue-500" />
                    Stay Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-semibold">{new Date(booking.checkIn).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-semibold">{new Date(booking.checkOut).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nights:</span>
                      <span className="font-semibold">
                        {Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Room Details */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaHome className="text-green-500" />
                    Room Details
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Number:</span>
                      <span className="font-semibold">{booking.roomNumber}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Type:</span>
                      <span className="font-semibold">{booking.roomType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Guests:</span>
                      <span className="font-semibold">
                        {booking.adults} adults {booking.children ? `, ${booking.children} children` : ''}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Payment Information */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaDollarSign className="text-green-500" />
                    Payment Information
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Amount:</span>
                      <span className="font-bold text-green-600">${booking.totalPrice}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status:</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.paymentStatus === 'succeeded' ? 'bg-green-100 text-green-800' :
                        booking.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {booking.paymentStatus?.toUpperCase()}
                      </span>
                    </div>
                    {booking.refundedAmount > 0 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Refunded Amount:</span>
                        <span className="font-bold text-red-600">-${booking.refundedAmount}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking Timeline */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FaClock className="text-purple-500" />
                    Booking Timeline
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Booked On:</span>
                      <span className="font-semibold">{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                    {booking.refundRequestedAt && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Refund Requested:</span>
                        <span className="font-semibold">{new Date(booking.refundRequestedAt).toLocaleDateString()}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Refund Request Section */}
            {booking.refundStatus === 'requested' && (
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                <h4 className="text-lg font-bold text-yellow-800 mb-2">Refund Request Pending</h4>
                <p className="text-yellow-700">
                  Your refund request is being processed. We'll notify you once it's completed.
                </p>
                {booking.refundReason && (
                  <div className="mt-2">
                    <p className="text-yellow-600 font-medium">Reason:</p>
                    <p className="text-yellow-800">{booking.refundReason}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </GuestLayout>
  );
};

export default GuestBookingDetails;