// components/BookingsManagement.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBookings,
  approveBooking,
  rejectBooking,
  issueRefund,
} from "../../features/booking/bookingSlice";
import AdminLayout from "../../layouts/AdminLayout";
import Swal from "sweetalert2";
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

const BookingsManagement = () => {
  const dispatch = useDispatch();
  const { bookings, totalPages, total, loading } = useSelector((state) => state.bookings);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [processingRefund, setProcessingRefund] = useState(null);

  const loadBookings = () => {
    dispatch(fetchBookings({ page, limit, search }));
  };

  useEffect(() => {
    loadBookings();
  }, [page, limit, search, dispatch]);

  // Real-time updates
  useEffect(() => {
    socket.on("bookingUpdated", () => loadBookings());
    socket.on("bookingDeleted", () => loadBookings());
    socket.on("bookingAdded", () => loadBookings());
    socket.on("bookingsCompleted", () => loadBookings());

    return () => {
      socket.off("bookingUpdated");
      socket.off("bookingDeleted");
      socket.off("bookingAdded");
      socket.off("bookingsCompleted");
    };
  }, [page, limit, search]);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setPage(1);
  };

  const handleLimitChange = (e) => {
    setLimit(Number(e.target.value));
    setPage(1);
  };

  const handleApprove = async (booking) => {
    const confirm = await Swal.fire({
      title: "Approve booking?",
      text: `Approve booking for ${booking.user?.name || "guest"}?`,
      icon: "question",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      await dispatch(approveBooking({ id: booking._id })).unwrap();
      Swal.fire("Success", "Booking approved successfully", "success");
      socket.emit("bookingAction", { action: "approved", bookingId: booking._id });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to approve booking";
      Swal.fire("Error", errorMessage, "error");
      console.error("Approve booking error:", err);
    }
  };

  const handleRefund = async (booking, type) => {
    const refundAmount = booking.totalPrice - (booking.refundedAmount || 0);
    const confirm = await Swal.fire({
      title: `${type === "full" ? "Full" : "Partial"} refund?`,
      text: `Issue ${type} refund for ${booking.user?.name || "guest"}? Amount: $${refundAmount}`,
      icon: "question",
      showCancelButton: true,
    });
    if (!confirm.isConfirmed) return;

    try {
      setProcessingRefund(booking._id);
      const res = await dispatch(issueRefund({ id: booking._id, type })).unwrap();
      
      // Force refresh bookings to get latest data
      await dispatch(fetchBookings());
      
      Swal.fire({
        icon: "success",
        title: "Refund Processed!",
        html: `<p>${res.message}</p><p>Refund Amount: $${res.refundAmount}</p>`,
      });
      socket.emit("bookingAction", { action: "refunded", bookingId: booking._id });
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || "Failed to issue refund";
      Swal.fire("Error", errorMessage, "error");
      console.error("Refund error:", err);
    } finally {
      setProcessingRefund(null);
    }
  };

  const getStatusBadge = (status) => {
    const statusColors = {
      pending: "bg-yellow-100 text-yellow-800",
      confirmed: "bg-green-100 text-green-800",
      cancelled: "bg-red-100 text-red-800",
      completed: "bg-blue-100 text-blue-800",
      refunded: "bg-gray-100 text-gray-800"
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[status] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Bookings Management</h2>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={handleSearchChange}
            className="border px-3 py-2 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select 
            value={limit} 
            onChange={handleLimitChange} 
            className="border px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {[5, 10, 20, 50].map((n) => (
              <option key={n} value={n}>{n} per page</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No bookings found.
        </div>
      ) : (
        <>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Booking ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Guest
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Room Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Room Number
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Check-In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Check-Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Total Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Refund
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {bookings.map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {booking.bookingId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div>
                          <div className="font-medium">{booking.user?.name || "—"}</div>
                          <div className="text-xs text-gray-400">{booking.user?.email || ""}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {booking.roomType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {booking.roomNumber}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(booking.checkIn).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {new Date(booking.checkOut).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        <div className="flex flex-col">
                          <span className="font-medium">
                            ${booking.refundedAmount > 0 ? Math.max(0, booking.totalPrice - booking.refundedAmount) : booking.totalPrice}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {getStatusBadge(booking.paymentStatus)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                        {booking.refundStatus !== 'none' ? (
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            booking.refundStatus === 'completed' ? 'bg-green-100 text-green-800' :
                            booking.refundStatus === 'partial' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {booking.refundStatus}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-col gap-2">
                          {/* Show Approve/Refund for pending bookings */}
                          {booking.status === "pending" && (
                            <div className="flex flex-col gap-1">
                              <button
                                onClick={() => handleApprove(booking)}
                                className="bg-green-500 text-white px-3 py-1 rounded-lg hover:bg-green-600 transition-colors text-xs"
                              >
                                Approve
                              </button>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleRefund(booking, "full")}
                                  disabled={processingRefund === booking._id}
                                  className={`${
                                    processingRefund === booking._id 
                                      ? "bg-gray-400 cursor-not-allowed" 
                                      : "bg-red-500 hover:bg-red-600"
                                  } text-white px-2 py-1 rounded text-xs transition-colors flex-1`}
                                >
                                  {processingRefund === booking._id ? "Processing..." : "Full Refund"}
                                </button>
                                <button
                                  onClick={() => handleRefund(booking, "partial")}
                                  disabled={processingRefund === booking._id}
                                  className={`${
                                    processingRefund === booking._id 
                                      ? "bg-gray-400 cursor-not-allowed" 
                                      : "bg-yellow-500 hover:bg-yellow-600"
                                  } text-white px-2 py-1 rounded text-xs transition-colors flex-1`}
                                >
                                  {processingRefund === booking._id ? "Processing..." : "Partial"}
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Show "Approved" for confirmed bookings without refund */}
                          {booking.status === "confirmed" && booking.refundStatus === "none" && (
                            <span className="text-green-600 text-xs font-medium">Approved</span>
                          )}
                          
                          {/* Show refund options for confirmed bookings that haven't been refunded */}
                          {booking.status === "confirmed" && booking.refundStatus === "none" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleRefund(booking, "full")}
                                disabled={processingRefund === booking._id}
                                className={`${
                                  processingRefund === booking._id 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-red-500 hover:bg-red-600"
                                } text-white px-2 py-1 rounded text-xs transition-colors flex-1`}
                              >
                                {processingRefund === booking._id ? "Processing..." : "Full Refund"}
                              </button>
                              <button
                                onClick={() => handleRefund(booking, "partial")}
                                disabled={processingRefund === booking._id}
                                className={`${
                                  processingRefund === booking._id 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-yellow-500 hover:bg-yellow-600"
                                } text-white px-2 py-1 rounded text-xs transition-colors flex-1`}
                              >
                                {processingRefund === booking._id ? "Processing..." : "Partial"}
                              </button>
                            </div>
                          )}
                          
                          {/* Show "Partially Refunded" for partial refunds */}
                          {booking.refundStatus === "partial" && (
                            <span className="text-yellow-600 text-xs font-medium">Partially Refunded</span>
                          )}
                          
                          {/* Show "Fully Refunded" for completed refunds */}
                          {booking.refundStatus === "completed" && (
                            <span className="text-green-600 text-xs font-medium">Fully Refunded ✓</span>
                          )}
                          
                          {/* Show message for completed bookings */}
                          {booking.status === "completed" && (
                            <span className="text-blue-600 text-xs font-medium">Stay Completed</span>
                          )}
                          
                          {/* Show refund options for cancelled bookings */}
                          {booking.status === "cancelled" && booking.refundStatus === "none" && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleRefund(booking, "full")}
                                disabled={processingRefund === booking._id}
                                className={`${
                                  processingRefund === booking._id 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-red-500 hover:bg-red-600"
                                } text-white px-2 py-1 rounded text-xs transition-colors flex-1`}
                              >
                                {processingRefund === booking._id ? "Processing..." : "Full Refund"}
                              </button>
                              <button
                                onClick={() => handleRefund(booking, "partial")}
                                disabled={processingRefund === booking._id}
                                className={`${
                                  processingRefund === booking._id 
                                    ? "bg-gray-400 cursor-not-allowed" 
                                    : "bg-yellow-500 hover:bg-yellow-600"
                                } text-white px-2 py-1 rounded text-xs transition-colors flex-1`}
                              >
                                {processingRefund === booking._id ? "Processing..." : "Partial"}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-between items-center mt-6">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total} bookings
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = i + 1;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      page === pageNum
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

export default BookingsManagement;