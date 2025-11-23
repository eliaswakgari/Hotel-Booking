// components/BookingDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import GuestLayout from "../layouts/GuestLayout";
import { FaArrowLeft, FaCalendar, FaUser, FaDollarSign, FaMapMarkerAlt, FaPhone, FaEnvelope } from "react-icons/fa";
import Swal from "sweetalert2";

const BookingDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/bookings/${id}`);
        setBooking(data);
      } catch (err) {
        console.error("Fetch Booking Error:", err);
        setError(err.response?.data?.message || "Failed to load booking details");
        Swal.fire("Error", "Failed to load booking details", "error");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchBookingDetails();
    }
  }, [id]);

  const handlePrint = () => {
    if (!booking) return;
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Booking Confirmation - ${booking.bookingId}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; }
          h1 { color: #333; border-bottom: 2px solid #333; padding-bottom: 10px; }
          .section { margin: 20px 0; }
          .section-title { font-weight: bold; color: #555; margin-bottom: 8px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
          .info-item { margin: 8px 0; }
          .status { padding: 4px 8px; border-radius: 4px; font-weight: bold; }
          .confirmed { background: #d4edda; color: #155724; }
          .pending { background: #fff3cd; color: #856404; }
          .cancelled { background: #f8d7da; color: #721c24; }
          .refunded { background: #e2e3e5; color: #383d41; }
          button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Booking Confirmation</h1>
        
        <div class="section">
          <div class="section-title">Booking Information</div>
          <div class="info-grid">
            <div class="info-item"><strong>Booking ID:</strong> ${booking.bookingId}</div>
            <div class="info-item"><strong>Status:</strong> <span class="status ${booking.status}">${booking.status}</span></div>
            <div class="info-item"><strong>Check-In:</strong> ${new Date(booking.checkIn).toLocaleDateString()}</div>
            <div class="info-item"><strong>Check-Out:</strong> ${new Date(booking.checkOut).toLocaleDateString()}</div>
            <div class="info-item"><strong>Nights:</strong> ${Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))}</div>
            <div class="info-item"><strong>Total Price:</strong> $${booking.totalPrice?.toFixed(2) || '0.00'}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Hotel Information</div>
          <div class="info-item"><strong>Hotel:</strong> ${booking.hotel?.name || 'N/A'}</div>
          <div class="info-item"><strong>Location:</strong> ${booking.hotel?.location?.address || 'N/A'}</div>
        </div>

        <div class="section">
          <div class="section-title">Room Information</div>
          <div class="info-grid">
            <div class="info-item"><strong>Room Type:</strong> ${booking.roomType}</div>
            <div class="info-item"><strong>Room Number:</strong> ${booking.roomNumber}</div>
            <div class="info-item"><strong>Adults:</strong> ${booking.adults}</div>
            <div class="info-item"><strong>Children:</strong> ${booking.children || 0}</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Guest Information</div>
          <div class="info-item"><strong>Name:</strong> ${booking.user?.name || 'N/A'}</div>
          <div class="info-item"><strong>Email:</strong> ${booking.user?.email || 'N/A'}</div>
          <div class="info-item"><strong>Phone:</strong> ${booking.user?.phone || 'N/A'}</div>
        </div>

        <button onclick="window.print();">Print Confirmation</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <GuestLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading booking details...</p>
          </div>
        </div>
      </GuestLayout>
    );
  }

  if (error || !booking) {
    return (
      <GuestLayout>
        <div className="text-center py-16">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {error || "Booking not found"}
          </h3>
          <button
            onClick={() => navigate("/my-bookings")}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to My Bookings
          </button>
        </div>
      </GuestLayout>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getPaymentStatusColor = (status) => {
    switch (status) {
      case 'succeeded': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'refunded': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <GuestLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate("/my-bookings")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition"
          >
            <FaArrowLeft />
            Back to My Bookings
          </button>
        </div>

        {/* Booking Card */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Booking #{booking.bookingId}
              </h1>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <FaCalendar size={12} />
                  Booked on {new Date(booking.createdAt).toLocaleDateString()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                  {booking.status?.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(booking.paymentStatus)}`}>
                  Payment: {booking.paymentStatus?.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* Booking Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Dates & Guests */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Stay Details</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-In:</span>
                  <span className="font-medium">{new Date(booking.checkIn).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Check-Out:</span>
                  <span className="font-medium">{new Date(booking.checkOut).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Nights:</span>
                  <span className="font-medium">
                    {Math.ceil((new Date(booking.checkOut) - new Date(booking.checkIn)) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Guests:</span>
                  <span className="font-medium">
                    {booking.adults} adult{booking.adults !== 1 ? 's' : ''}
                    {booking.children > 0 && `, ${booking.children} child${booking.children !== 1 ? 'ren' : ''}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Room Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Room Information</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Type:</span>
                  <span className="font-medium">{booking.roomType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Room Number:</span>
                  <span className="font-medium">{booking.roomNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Price:</span>
                  <span className="font-medium text-green-600">
                    $${booking.totalPrice?.toFixed(2) || '0.00'}
                  </span>
                </div>
                {booking.refundedAmount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Refunded Amount:</span>
                    <span className="font-medium text-red-600">
                      -$${booking.refundedAmount?.toFixed(2)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hotel Information */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Hotel Information</h3>
            <div className="flex items-start gap-4">
              {booking.hotel?.images?.[0] && (
                <img 
                  src={booking.hotel.images[0]} 
                  alt={booking.hotel.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900">{booking.hotel?.name}</h4>
                <p className="text-gray-600 flex items-center gap-1 mt-1">
                  <FaMapMarkerAlt size={12} />
                  {booking.hotel?.location?.address || 'Address not available'}
                </p>
                {booking.hotel?.amenities && booking.hotel.amenities.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">Amenities:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {booking.hotel.amenities.slice(0, 4).map((amenity, index) => (
                        <span key={index} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              onClick={handlePrint}
              className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition"
            >
              Print Confirmation
            </button>
            {booking.status === 'confirmed' && (
              <button
                onClick={() => navigate(`/request-refund/${booking._id}`)}
                className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
              >
                Request Refund
              </button>
            )}
          </div>
        </div>
      </div>
    </GuestLayout>
  );
};

export default BookingDetails;