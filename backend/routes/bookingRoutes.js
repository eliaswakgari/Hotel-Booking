const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createBooking,
  getBookings,
  getMyBookings,
  getBookingDetails, // ✅ ADD THIS IMPORT
  approveBooking,
  rejectBooking,
  issueRefund,
  autoCompleteBookings,
  checkAvailability,
  createPaymentIntent,
  requestRefund,
  getRefundRequests,
  rejectRefundRequest
} = require('../controllers/bookingController');

// User routes
router.route('/')
  .post(protect, createBooking)
  .get(protect, admin, getBookings);

// ✅ ADD: Get user's bookings
router.get('/my-bookings', protect, getMyBookings);

// ✅ ADD: Get specific booking details
router.get('/:id', protect, getBookingDetails); // ✅ ADD THIS ROUTE

// ✅ ADD: Availability check route
router.get('/check-availability', protect, checkAvailability);

// Refund routes
router.post('/:id/request-refund', protect, requestRefund);
router.get('/admin/refund-requests', protect, admin, getRefundRequests);
router.post('/:id/reject-refund', protect, admin, rejectRefundRequest);

// Admin routes
router.put('/:id/approve', protect, admin, approveBooking);
router.put('/:id/reject', protect, admin, rejectBooking);
router.post('/:id/refund', protect, admin, issueRefund);
router.post('/auto-complete', protect, admin, autoCompleteBookings);

// Payment intent route
router.post('/create-payment-intent', protect, createPaymentIntent);

module.exports = router;