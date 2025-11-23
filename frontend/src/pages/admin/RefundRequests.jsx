import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../layouts/AdminLayout";
import { getRefundRequests, issueRefund, rejectRefundRequest } from "../../features/booking/bookingSlice";
import { FaMoneyBillWave, FaTimes, FaCheck, FaClock } from "react-icons/fa";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const RefundRequests = () => {
  const dispatch = useDispatch();
  const { refundRequests, loading } = useSelector((state) => state.booking);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    dispatch(getRefundRequests());
  }, [dispatch]);

  const handleProcessRefund = async (bookingId, type = 'full') => {
    setProcessingId(bookingId);
    try {
      const { value: adminNotes } = await Swal.fire({
        title: `Process ${type} Refund`,
        input: 'textarea',
        inputLabel: 'Admin Notes (Optional)',
        inputPlaceholder: 'Enter any notes for the user...',
        showCancelButton: true,
        confirmButtonText: 'Process Refund',
        cancelButtonText: 'Cancel'
      });

      if (adminNotes !== undefined) {
        await dispatch(issueRefund({ bookingId, type, adminNotes })).unwrap();
        Swal.fire("Success", `Refund processed successfully!`, "success");
        dispatch(getRefundRequests()); // Refresh list
      }
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to process refund", "error");
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectRefund = async (bookingId) => {
    try {
      const { value: adminNotes } = await Swal.fire({
        title: 'Reject Refund Request',
        input: 'textarea',
        inputLabel: 'Reason for Rejection',
        inputPlaceholder: 'Explain why the refund is being rejected...',
        inputValidator: (value) => {
          if (!value) {
            return 'Please provide a reason for rejection';
          }
        },
        showCancelButton: true,
        confirmButtonText: 'Reject Request',
        cancelButtonText: 'Cancel'
      });

      if (adminNotes) {
        await dispatch(rejectRefundRequest({ bookingId, adminNotes })).unwrap();
        Swal.fire("Rejected", "Refund request has been rejected", "success");
        dispatch(getRefundRequests()); // Refresh list
      }
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to reject refund request", "error");
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading refund requests...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Refund Requests</h1>
            <p className="text-gray-600">Manage guest refund requests</p>
          </div>
          <div className="flex items-center gap-2 bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg">
            <FaClock className="text-yellow-600" />
            <span className="font-medium">{refundRequests.length} Pending Requests</span>
          </div>
        </div>

        {refundRequests.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border">
            <FaMoneyBillWave className="text-gray-400 text-6xl mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Pending Refund Requests</h3>
            <p className="text-gray-500">All refund requests have been processed.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {refundRequests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white border border-yellow-200 rounded-lg p-6 shadow-sm"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Booking: {request.bookingId}
                    </h3>
                    <p className="text-gray-600">
                      Guest: {request.user?.name} ({request.user?.email})
                    </p>
                    <p className="text-gray-600">
                      Hotel: {request.hotel?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-yellow-600">
                      ${request.refundRequest?.requestedAmount || request.totalPrice}
                    </p>
                    <p className="text-sm text-gray-500">Requested Amount</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-700">
                    <strong>Reason:</strong> {request.refundRequest?.reason || 'No reason provided'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Requested: {new Date(request.refundRequest?.requestedAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleProcessRefund(request._id, 'full')}
                    disabled={processingId === request._id}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <FaCheck />
                    {processingId === request._id ? 'Processing...' : 'Approve Full Refund'}
                  </button>
                  
                  <button
                    onClick={() => handleProcessRefund(request._id, 'partial')}
                    disabled={processingId === request._id}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <FaCheck />
                    {processingId === request._id ? 'Processing...' : 'Approve Partial'}
                  </button>
                  
                  <button
                    onClick={() => handleRejectRefund(request._id)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    <FaTimes />
                    Reject
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default RefundRequests;