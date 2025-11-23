import React, { useState, useEffect } from "react";
import { getMyBookings, requestRefundApi } from "../../api/bookingApi"; // ✅ Add requestRefundApi import
import GuestLayout from "../../layouts/GuestLayout";
import Swal from "sweetalert2";
import html2pdf from "html2pdf.js";
import QRCode from "qrcode";

const BookingHistory = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // ======================
  // 📦 Fetch My Bookings - FIXED
  // ======================
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await getMyBookings();
      setBookings(response.data);
    } catch (err) {
      console.error('Error fetching bookings:', err);
      Swal.fire("Error", "Failed to fetch bookings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // =============================
  // 🧾 Generate PDF with QR Code
  // =============================
  const handleDownload = async (booking) => {
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

  // =========================
  // 💸 Refund Request Handler - FIXED
  // =========================
  const handleRefund = async (booking) => {
    try {
      const { value: reason } = await Swal.fire({
        title: `Request Refund for ${booking.hotel?.name}`,
        input: 'textarea',
        inputLabel: 'Refund Reason',
        inputPlaceholder: 'Please explain why you are requesting a refund...',
        inputAttributes: {
          'aria-label': 'Type your refund reason here'
        },
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'Please provide a reason for the refund';
          }
        }
      });

      if (reason) {
        // ✅ FIX: Now using the imported function
        await requestRefundApi(booking._id, { reason });
        Swal.fire("Success", "Refund request submitted successfully!", "success");
        fetchBookings(); // Refresh the list
      }
    } catch (err) {
      console.error('Refund request error:', err);
      Swal.fire("Error", err.response?.data?.message || err.message, "error");
    }
  };

  // ==========================
  // 🖥️ UI Rendering
  // ==========================
  return (
    <GuestLayout>
      <div className="p-6">
        <h2 className="text-3xl font-bold mb-6 text-center">My Bookings</h2>

        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg mb-4">You have no bookings yet.</p>
            <a href="/hotels" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
              Browse Hotels
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookings.map((booking) => (
              <div
                key={booking._id}
                className="bg-white dark:bg-gray-800 shadow-lg rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700"
              >
                <img
                  src={booking.hotel?.images?.[0] || "https://via.placeholder.com/400"}
                  alt={booking.hotel?.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {booking.hotel?.name}
                    </h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status?.toUpperCase()}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    📅 {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                  </p>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    🏨 Room {booking.roomNumber} • {booking.roomType}
                  </p>
                  
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                    👥 {booking.adults} adults {booking.children ? `, ${booking.children} children` : ''}
                  </p>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-xl font-bold text-gray-900 dark:text-white">
                      ${booking.totalPrice}
                    </span>
                    <span className={`text-sm font-medium ${
                      booking.paymentStatus === 'succeeded' ? 'text-green-600' : 
                      booking.paymentStatus === 'pending' ? 'text-yellow-600' : 
                      'text-red-600'
                    }`}>
                      {booking.paymentStatus?.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownload(booking)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                    >
                      Download PDF
                    </button>

                    {booking.status === 'confirmed' && booking.refundStatus !== 'requested' && (
                      <button
                        onClick={() => handleRefund(booking)}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                      >
                        Request Refund
                      </button>
                    )}
                  </div>

                  {booking.refundStatus === 'requested' && (
                    <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
                      <p className="text-yellow-800 text-sm text-center">
                        ⏳ Refund Requested
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </GuestLayout>
  );
};

export default BookingHistory;