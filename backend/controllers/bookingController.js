const asyncHandler = require("express-async-handler");
const Booking = require("../models/Booking");
const Hotel = require("../models/Hotel");
const User = require("../models/User");
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const { createNotification } = require('./notificationController');
const { sendRefundEmail, sendRefundSMS } = require("../services/notificationService");

// Socket.IO instance
let io;
exports.setIO = (socketIOInstance) => {
  io = socketIOInstance;
};

// 🧮 Helper: calculate total price
const calculateTotalPrice = (hotel, checkIn, checkOut, adults, children, roomType) => {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (nights <= 0) return 0;
  
  let basePrice = hotel.basePrice || 0;
  
  // Apply room type multiplier if available
  const room = hotel.rooms?.find(r => r.type === roomType);
  if (room && room.price) {
    basePrice = room.price;
  }
  
  // Weekend pricing
  if ([5, 6].includes(start.getDay()) || [5, 6].includes(end.getDay())) {
    basePrice *= 1.2;
  }
  
  return basePrice * nights * (adults + children * 0.5);
};

// 🔍 Helper: Check room availability
const checkRoomAvailability = async (hotelId, roomNumber, checkIn, checkOut, excludeBookingId = null) => {
  const today = new Date().setHours(0, 0, 0, 0);
  const checkInDate = new Date(checkIn);
  
  // Validate check-in date (must be today or future)
  if (checkInDate < today) {
    throw new Error('Check-in date must be today or in the future');
  }
  
  // Validate check-out date (must be after check-in)
  const checkOutDate = new Date(checkOut);
  if (checkOutDate <= checkInDate) {
    throw new Error('Check-out date must be after check-in date');
  }
  
  // Check for overlapping bookings
  const query = {
    hotel: hotelId,
    roomNumber: roomNumber,
    status: { $in: ['confirmed', 'pending'] },
    $or: [
      {
        checkIn: { $lt: checkOutDate },
        checkOut: { $gt: checkInDate }
      }
    ]
  };
  
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  
  const overlappingBooking = await Booking.findOne(query);
  
  if (overlappingBooking) {
    throw new Error('This room is already booked for the selected dates');
  }
  
  return true;
};

// Add this at the top of bookingController.js for debugging
const debugLog = (message, data = null) => {
  console.log(`🔍 DEBUG: ${message}`, data ? JSON.stringify(data, null, 2) : '');
};
exports.createBooking = asyncHandler(async (req, res) => {
  const {
    hotelId,
    checkIn,
    checkOut,
    adults,
    children,
    roomType,
    roomNumber, // This might now be optional
    totalPrice,
    paymentIntentId
  } = req.body;

  // If roomNumber is not provided, find an available room
  let finalRoomNumber = roomNumber;
  
  if (!finalRoomNumber) {
    const hotel = await Hotel.findById(hotelId);
    if (hotel) {
      const availableRoom = hotel.rooms.find(r => 
        r.type === roomType && 
        r.status === "available"
      );
      if (availableRoom) {
        finalRoomNumber = availableRoom.number;
      }
    }
  }

  // Validate required fields (roomNumber is now optional)
  if (!hotelId || !checkIn || !checkOut || !adults || !roomType || !totalPrice) {
    return res.status(400).json({ 
      message: "Please provide all required booking details" 
    });
  }

  // If we still don't have a room number, return error
  if (!finalRoomNumber) {
    return res.status(400).json({ 
      message: `No available ${roomType} rooms found` 
    });
  }

  // Rest of the function remains the same, using finalRoomNumber...
  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  const today = new Date().setHours(0, 0, 0, 0);

  if (checkInDate < today) {
    return res.status(400).json({ message: "Check-in date cannot be in the past" });
  }

  if (checkOutDate <= checkInDate) {
    return res.status(400).json({ message: "Check-out date must be after check-in date" });
  }

  // Check if hotel exists
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  // Check room availability using the final room number
  const isAvailable = await checkRoomAvailability(hotelId, finalRoomNumber, checkIn, checkOut);
  if (!isAvailable) {
    return res.status(400).json({ message: "Selected room is not available for the chosen dates" });
  }

  try {
    // Generate unique booking ID
    const bookingId = `BK${Date.now()}${Math.random().toString(36).substr(2, 5)}`.toUpperCase();

    // Create booking
    const booking = await Booking.create({
      bookingId,
      user: req.user._id,
      hotel: hotelId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      adults: parseInt(adults),
      children: parseInt(children || 0),
      roomType,
      roomNumber: finalRoomNumber, // Use the final room number
      totalPrice: parseFloat(totalPrice),
      paymentIntentId,
      // Start as pending so admin can approve and mark payment as succeeded
      status: 'pending',
      paymentStatus: 'pending'
    });

    // Populate booking data for response
    const newBooking = await Booking.findById(booking._id)
      .populate('user', 'name email')
      .populate('hotel', 'name location');

    // Create notification for admin users
    try {
      const adminUsers = await User.find({ role: 'admin' });
      
      const notificationPromises = adminUsers.map(admin => 
        createNotification({
          recipient: admin._id,
          sender: req.user._id,
          booking: newBooking._id,
          type: 'booking_created',
          title: 'New Booking Request',
          message: `${req.user.name} has created a new booking from ${checkIn} to ${checkOut}`,
          actionUrl: `/admin/bookings/${newBooking._id}`
        })
      );

      await Promise.all(notificationPromises);
    } catch (notificationError) {
      console.error('Error creating notification:', notificationError);
    }

    res.status(201).json({
      message: 'Booking created successfully',
      booking: newBooking,
      bookingId: newBooking.bookingId,
      roomNumber: finalRoomNumber
    });

  } catch (error) {
    console.error('Booking creation error:', error);
    res.status(500).json({ 
      message: error.message || 'Failed to create booking' 
    });
  }
});

// ======================
// ✅ GET MY BOOKINGS
// ======================
exports.getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate("hotel", "name images basePrice")
    .sort({ createdAt: -1 });
  res.json(bookings);
});

// ======================
// ✅ GET BOOKINGS (Admin)
// ======================
exports.getBookings = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10, search = "" } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const query = {};
  if (search) {
    query.$or = [
      { bookingId: { $regex: search, $options: "i" } },
      { status: { $regex: search, $options: "i" } },
      { refundStatus: { $regex: search, $options: "i" } },
      { roomNumber: { $regex: search, $options: "i" } },
      { roomType: { $regex: search, $options: "i" } },
    ];
  }

  const total = await Booking.countDocuments(query);
  const bookings = await Booking.find(query)
    .populate("user", "name email phone")
    .populate("hotel", "name basePrice")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ createdAt: -1 });

  res.json({
    bookings,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// ======================
// ✅ AUTO-COMPLETE BOOKINGS (Mark completed bookings)
// ======================
exports.autoCompleteBookings = asyncHandler(async (req, res) => {
  const today = new Date();
  
  // Find bookings where check-out date has passed but status is still confirmed
  const completedBookings = await Booking.find({
    checkOut: { $lt: today },
    status: 'confirmed'
  }).populate('hotel');

  // Update booking status and free up rooms
  for (const booking of completedBookings) {
    booking.status = 'completed';
    await booking.save();

    // Free up the room
    const hotel = await Hotel.findById(booking.hotel._id);
    if (hotel) {
      const room = hotel.rooms.find(r => r.number === booking.roomNumber);
      if (room) {
        room.status = 'available';
        await hotel.save();
      }
    }
  }

  if (io) io.emit("bookingsCompleted", completedBookings);

  res.json({
    message: `Completed ${completedBookings.length} bookings`,
    completed: completedBookings.length
  });
});

// ======================
// ✅ APPROVE BOOKING - Fix room availability check
// ======================
exports.approveBooking = asyncHandler(async (req, res) => {
  debugLog('Approve booking called', { 
    bookingId: req.params.id,
    user: req.user ? req.user._id : 'no user'
  });

  try {
    const booking = await Booking.findById(req.params.id);
    debugLog('Booking found', { 
      bookingId: booking?._id,
      status: booking?.status,
      roomNumber: booking?.roomNumber
    });

    if (!booking) {
      debugLog('Booking not found');
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if booking is in pending status
    if (booking.status !== 'pending') {
      debugLog('Invalid booking status for approval', { currentStatus: booking.status });
      return res.status(400).json({ 
        message: `Cannot approve booking with status: ${booking.status}. Only pending bookings can be approved.` 
      });
    }

    try {
      debugLog('Checking room availability', {
        hotel: booking.hotel,
        roomNumber: booking.roomNumber,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut
      });
      
      // Check if room is still available - MODIFIED to be less restrictive
      const today = new Date().setHours(0, 0, 0, 0);
      const checkInDate = new Date(booking.checkIn);
      const checkOutDate = new Date(booking.checkOut);
      
      // Validate dates
      if (checkInDate < today) {
        throw new Error('Check-in date has passed');
      }
      
      if (checkOutDate <= checkInDate) {
        throw new Error('Check-out date must be after check-in date');
      }
      
      // Check for overlapping bookings excluding this one
      const overlappingBooking = await Booking.findOne({
        hotel: booking.hotel,
        roomNumber: booking.roomNumber,
        status: { $in: ['confirmed'] }, // Only check confirmed bookings, not pending
        $or: [
          {
            checkIn: { $lt: checkOutDate },
            checkOut: { $gt: checkInDate }
          }
        ],
        _id: { $ne: booking._id }
      });

      if (overlappingBooking) {
        throw new Error('This room is already booked for the selected dates by another confirmed booking');
      }
      
      debugLog('Room availability check passed');
    } catch (error) {
      debugLog('Room availability check failed', { error: error.message });
      return res.status(400).json({ 
        message: `Cannot approve booking: ${error.message}` 
      });
    }

    // Update booking status
    booking.paymentStatus = "succeeded";
    booking.status = "confirmed";
    await booking.save();
    debugLog('Booking status updated to confirmed');

    // Update room status to occupied
    const hotel = await Hotel.findById(booking.hotel);
    if (hotel) {
      const room = hotel.rooms.find(r => r.number === booking.roomNumber);
      if (room) {
        room.status = "occupied";
        await hotel.save();
        debugLog('Room status updated to occupied', { roomNumber: room.number });
      } else {
        debugLog('Room not found in hotel', { roomNumber: booking.roomNumber });
      }
    } else {
      debugLog('Hotel not found', { hotelId: booking.hotel });
    }

    if (io) io.emit("bookingApproved", booking);

    debugLog('Booking approval completed successfully');
    res.json(booking);
  } catch (error) {
    debugLog('Approve booking error', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({ 
      message: "Internal server error during approval",
      error: error.message 
    });
  }
});

// Add this helper function if not already present
const updateRoomStatus = async (hotelId, roomNumber, status) => {
  try {
    const hotel = await Hotel.findById(hotelId);
    if (hotel) {
      const room = hotel.rooms.find(r => r.number === roomNumber);
      if (room) {
        room.status = status;
        await hotel.save();
        console.log(`Room ${roomNumber} status updated to: ${status}`);
        return true;
      }
    }
    return false;
  } catch (error) {
    console.error("Error updating room status:", error);
    throw error;
  }
};

// Update the rejectBooking function in bookingController.js
exports.rejectBooking = asyncHandler(async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Change status to cancelled but don't process refund automatically
    booking.status = "cancelled";
    booking.paymentStatus = "failed";
    await booking.save();

    // Free up the room when booking is rejected - Room becomes available for rebooking
    await updateRoomStatus(booking.hotel, booking.roomNumber, "available");

    if (io) io.emit("bookingRejected", booking);

    res.json({
      ...booking.toObject(),
      message: "Booking rejected. You can now process refund if needed."
    });
  } catch (error) {
    console.error("Reject booking error:", error);
    res.status(400).json({ message: error.message });
  }
});

// ======================
// ✅ CHECK ROOM AVAILABILITY
// ======================
exports.checkAvailability = asyncHandler(async (req, res) => {
  const { hotelId, roomNumber, checkIn, checkOut } = req.query;

  if (!hotelId || !roomNumber || !checkIn || !checkOut) {
    return res.status(400).json({ message: "Missing required parameters" });
  }

  try {
    const isAvailable = await checkRoomAvailability(hotelId, roomNumber, checkIn, checkOut);
    res.json({ available: isAvailable });
  } catch (error) {
    res.status(400).json({ available: false, message: error.message });
  }
});

// ======================
// ✅ CREATE PAYMENT INTENT
// ======================
// ======================
// ✅ CREATE PAYMENT INTENT
// ======================
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { 
    hotelId, 
    checkIn, 
    checkOut, 
    adults, 
    children, 
    roomType, 
    roomNumber, 
    totalPrice 
  } = req.body;

  if (!hotelId || !checkIn || !checkOut || !adults || !roomType || !roomNumber) {
    return res.status(400).json({ 
      message: "Missing required booking details" 
    });
  }

  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return res.status(404).json({ message: "Hotel not found" });

    const room = hotel.rooms.find(r => 
      r.number === roomNumber && 
      r.type === roomType
    );

    if (!room) {
      return res.status(400).json({ 
        message: "Selected room not found or room type mismatch" 
      });
    }

    // Check room availability
    await checkRoomAvailability(hotelId, roomNumber, checkIn, checkOut);

    if (room.status !== "available") {
      return res.status(400).json({ message: "Selected room is not available" });
    }

    // Calculate total price
    const calculatedPrice = calculateTotalPrice(
      hotel, 
      checkIn, 
      checkOut, 
      adults, 
      children,
      roomType
    );

    const finalPrice = totalPrice || calculatedPrice;

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalPrice * 100),
      currency: 'usd',
      metadata: {
        hotelId,
        checkIn,
        checkOut,
        adults,
        children
      }
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      finalPrice
    });

  } catch (error) {
    console.error("Payment intent error:", error);
    res.status(400).json({ message: error.message });
  }
});

// ✅ REQUEST REFUND - FIXED (Single definition)
// ======================
exports.requestRefund = asyncHandler(async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email')
      .populate('hotel', 'name');
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user owns the booking
    if (booking.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Prevent refund requests on unpaid / already refunded / already requested bookings
    if (booking.paymentStatus !== 'succeeded') {
      return res.status(400).json({
        message: 'Refunds can only be requested for successfully paid bookings',
      });
    }

    // If a refund is already fully processed
    if (booking.refundStatus === 'completed' || booking.status === 'refunded') {
      return res.status(400).json({
        message: 'This booking has already been fully refunded and cannot be refunded again',
      });
    }

    // If a partial refund or any amount has already been processed
    if (booking.refundStatus === 'partial' || booking.refundedAmount > 0) {
      return res.status(400).json({
        message:
          'A refund has already been processed for this booking. Further adjustments must be handled by the hotel/admin.',
      });
    }

    // If there is already a pending refund request
    if (booking.refundStatus === 'requested') {
      return res.status(400).json({
        message: 'There is already a pending refund request for this booking',
      });
    }

    // Update booking with refund request
    booking.refundStatus = 'requested';
    booking.refundReason = req.body.reason;
    booking.refundRequestedAt = new Date();
    await booking.save();

    // ✅ FIXED: CREATE NOTIFICATION FOR ALL ADMIN USERS
    try {
      // Find all admin users
      const adminUsers = await User.find({ role: 'admin' });
      
      // Create notifications for all admin users
      const notificationPromises = adminUsers.map(admin => 
        createNotification({
          recipient: admin._id,
          sender: req.user._id,
          booking: booking._id,
          type: 'refund_requested',
          title: 'New Refund Request',
          message: `User ${req.user.name} requested refund for booking ${booking.bookingId}. Reason: ${req.body.reason}`,
          actionUrl: `/admin/bookings/${booking._id}`,
          priority: 'high'
        })
      );

      await Promise.all(notificationPromises);
      
      console.log(`📢 Created refund notifications for ${adminUsers.length} admin users`);
      
      // Emit socket event for real-time notification
      if (io) {
        io.emit('refundRequested', {
          bookingId: booking.bookingId,
          userName: req.user.name,
          message: `User ${req.user.name} requested refund for booking ${booking.bookingId}`
        });
      }
    } catch (notificationError) {
      console.error('Error creating refund notification:', notificationError);
      // Don't fail the refund request if notification fails
    }

    res.json({
      message: "Refund request submitted successfully",
      booking: await Booking.findById(booking._id)
        .populate('user', 'name email')
        .populate('hotel', 'name')
    });
  } catch (error) {
    console.error('Refund request error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// ======================
// ✅ GET REFUND REQUESTS (Admin)
// ======================
exports.getRefundRequests = asyncHandler(async (req, res) => {
  let { page = 1, limit = 10 } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const query = {
    refundStatus: 'requested'
  };

  const total = await Booking.countDocuments(query);
  const refundRequests = await Booking.find(query)
    .populate("user", "name email phone")
    .populate("hotel", "name basePrice")
    .skip((page - 1) * limit)
    .limit(limit)
    .sort({ 'refundRequest.requestedAt': -1 });

  res.json({
    refundRequests,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
});

// ======================
// ✅ UPDATE ISSUE REFUND (Admin) - Enhanced with refund request handling
// ======================
exports.issueRefund = asyncHandler(async (req, res) => {
  const { type, adminNotes } = req.body;
  
  debugLog('Issue refund called', { 
    bookingId: req.params.id,
    refundType: type,
    adminNotes,
    user: req.user ? req.user._id : 'no user'
  });

  try {
    const booking = await Booking.findById(req.params.id).populate("user", "name email phone");
    debugLog('Booking found for refund', { 
      bookingId: booking?._id,
      status: booking?.status,
      totalPrice: booking?.totalPrice,
      refundedAmount: booking?.refundedAmount,
      refundStatus: booking?.refundStatus
    });

    if (!booking) {
      debugLog('Booking not found for refund');
      return res.status(404).json({ message: "Booking not found" });
    }

    // Validate refund type
    if (type !== "full" && type !== "partial") {
      debugLog('Invalid refund type', { refundType: type });
      return res.status(400).json({ message: "Invalid refund type. Use 'full' or 'partial'" });
    }

    const remainingAmount = booking.totalPrice - booking.refundedAmount;
    debugLog('Refund calculation', { 
      totalPrice: booking.totalPrice,
      refundedAmount: booking.refundedAmount,
      remainingAmount: remainingAmount
    });

    if (remainingAmount <= 0) {
      debugLog('No amount left to refund');
      return res.status(400).json({ message: "Nothing left to refund" });
    }

    let refundAmount = 0;
    if (type === "full") {
      refundAmount = remainingAmount;
    } else if (type === "partial") {
      // Use requested amount if available, otherwise use 50%
      refundAmount = booking.refundRequest?.requestedAmount || Math.min(booking.totalPrice * 0.5, remainingAmount);
    }

    debugLog('Refund amount calculated', { refundAmount });

    try {
      // Stripe refund if paymentIntent exists and is valid
      let refund = { id: "mock_refund_" + Date.now(), amount: refundAmount };
      
      if (booking.paymentIntentId) {
        debugLog('Processing Stripe refund', { paymentIntentId: booking.paymentIntentId });
        
        if (booking.paymentIntentId.startsWith('pi_')) {
          try {
            refund = await stripe.refunds.create({
              payment_intent: booking.paymentIntentId,
              amount: Math.round(refundAmount * 100),
            });
            debugLog('Stripe refund processed successfully', { refundId: refund.id });
          } catch (stripeError) {
            debugLog('Stripe refund error', { error: stripeError.message });
            // Continue with mock refund for development
            console.warn("Using mock refund due to Stripe error");
          }
        } else {
          debugLog('Invalid Stripe payment intent format', { paymentIntentId: booking.paymentIntentId });
        }
      } else {
        debugLog('No paymentIntentId found, using mock refund');
      }

      // Update booking with refund details
      booking.refundedAmount += refundAmount;
      booking.refundStatus = type === "full" ? "completed" : "partial";
      
      // Update refund request with admin notes
      if (booking.refundRequest) {
        booking.refundRequest.adminNotes = adminNotes;
        booking.refundRequest.processedAt = new Date();
        booking.refundRequest.processedBy = req.user._id;
      }

      debugLog('Updating booking refund status', {
        newRefundedAmount: booking.refundedAmount,
        newRefundStatus: booking.refundStatus
      });

      // If fully refunded, update status and free up room
      if (type === "full") {
        booking.status = "refunded";
        booking.paymentStatus = "refunded";
        debugLog('Booking fully refunded, updating status to refunded');
        
        // Free up the room when fully refunded
        try {
          await updateRoomStatus(booking.hotel, booking.roomNumber, "available");
          debugLog('Room status updated to available after full refund');
        } catch (roomError) {
          debugLog('Error updating room status', { error: roomError.message });
          // Continue even if room update fails
        }
      }

      await booking.save();
      debugLog('Booking saved with refund details');

      // Send notifications to user
      try {
        if (booking.user?.email) {
          await sendRefundEmail(booking.user.email, booking.bookingId, refundAmount, type, adminNotes);
          debugLog('Refund processed email sent to user');
        }
        
        // Create notification for user about refund approval
        await createNotification({
          recipient: booking.user._id,
          sender: req.user._id,
          booking: booking._id,
          type: 'refund_approved',
          title: 'Refund Processed',
          message: `Your refund request for booking ${booking.bookingId} has been processed. Amount: $${refundAmount}. ${adminNotes ? `Notes: ${adminNotes}` : ''}`,
          actionUrl: `/my-bookings`
        });
      } catch (notificationError) {
        debugLog('Notification error', { error: notificationError.message });
        // Continue even if notifications fail
      }

      if (io) io.emit("bookingRefunded", booking);

      debugLog('Refund process completed successfully');
      res.json({
        message: `${type === "full" ? "Full" : "Partial"} refund processed successfully`,
        refundAmount,
        booking,
        refundId: refund.id
      });

    } catch (refundError) {
      debugLog('Refund processing error', { 
        error: refundError.message,
        stack: refundError.stack 
      });
      res.status(500).json({
        message: "Refund processing failed",
        error: refundError.message,
      });
    }

  } catch (error) {
    debugLog('General refund error', { 
      error: error.message,
      stack: error.stack 
    });
    res.status(500).json({
      message: "Internal server error during refund",
      error: error.message,
    });
  }
});

// ======================
// ✅ REJECT REFUND REQUEST (Admin)
// ======================
exports.rejectRefundRequest = asyncHandler(async (req, res) => {
  const { adminNotes } = req.body;
  
  debugLog('Reject refund request called', { 
    bookingId: req.params.id,
    adminNotes,
    user: req.user ? req.user._id : 'no user'
  });

  try {
    const booking = await Booking.findById(req.params.id).populate("user", "name email phone");
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (booking.refundStatus !== 'requested') {
      return res.status(400).json({ message: "No pending refund request found for this booking" });
    }

    // Update refund request with rejection
    booking.refundStatus = 'none';
    if (booking.refundRequest) {
      booking.refundRequest.adminNotes = adminNotes;
      booking.refundRequest.processedAt = new Date();
      booking.refundRequest.processedBy = req.user._id;
      booking.refundRequest.status = 'rejected';
    }

    await booking.save();

    // Send notification to user about rejection
    try {
      await createNotification({
        recipient: booking.user._id,
        sender: req.user._id,
        booking: booking._id,
        type: 'refund_rejected',
        title: 'Refund Request Rejected',
        message: `Your refund request for booking ${booking.bookingId} has been rejected. ${adminNotes ? `Reason: ${adminNotes}` : ''}`,
        actionUrl: `/my-bookings`
      });

      if (booking.user?.email) {
        await sendRefundEmail(
          booking.user.email, 
          booking.bookingId, 
          0, 
          'rejected',
          adminNotes
        );
      }
    } catch (notificationError) {
      console.error('Error sending rejection notification:', notificationError);
    }

    if (io) io.emit("refundRequestRejected", booking);

    res.json({
      message: "Refund request rejected successfully",
      booking
    });

  } catch (error) {
    console.error('Reject refund request error:', error);
    res.status(500).json({
      message: "Internal server error during refund request rejection",
      error: error.message,
    });
  }
});

// ✅ ADD: Get Booking Details
exports.getBookingDetails = asyncHandler(async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('hotel', 'name location images amenities basePrice')
      .populate('refundRequest.processedBy', 'name');

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check if user has permission to view this booking
    const isOwner = booking.user._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(booking);
  } catch (error) {
    console.error('Get booking details error:', error);
    res.status(500).json({ message: "Server error" });
  }
});
exports.createPaymentIntent = asyncHandler(async (req, res) => {
  const { 
    hotelId, 
    checkIn, 
    checkOut, 
    adults, 
    children = 0, 
    roomType
  } = req.body;

  // Enhanced validation with detailed error messages
  const missingFields = [];
  if (!hotelId) missingFields.push('hotelId');
  if (!checkIn) missingFields.push('checkIn');
  if (!checkOut) missingFields.push('checkOut');
  if (!adults) missingFields.push('adults');
  if (!roomType) missingFields.push('roomType');

  if (missingFields.length > 0) {
    return res.status(400).json({ 
      message: `Missing required booking details: ${missingFields.join(', ')}` 
    });
  }

  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // ✅ FIXED: Find an available room of the specified type instead of requiring roomNumber
    const availableRoom = hotel.rooms.find(r => 
      r.type === roomType && 
      r.status === "available"
    );

    if (!availableRoom) {
      return res.status(400).json({ 
        message: `No available ${roomType} rooms found` 
      });
    }

    // Use the found room's number
    const roomNumber = availableRoom.number;

    // Check room availability for dates
    try {
      await checkRoomAvailability(hotelId, roomNumber, checkIn, checkOut);
    } catch (availabilityError) {
      return res.status(400).json({ 
        message: availabilityError.message 
      });
    }

    // Calculate total price
    const calculatedPrice = calculateTotalPrice(hotel, checkIn, checkOut, adults, children, roomType);
    const finalPrice = calculatedPrice;

    console.log('🔍 Creating payment intent with details:', {
      hotelId,
      roomNumber, // ✅ Now automatically assigned
      roomType,
      checkIn,
      checkOut,
      adults,
      children,
      calculatedPrice,
      finalPrice
    });

    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(finalPrice * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        hotelId: hotelId.toString(),
        checkIn: checkIn,
        checkOut: checkOut,
        adults: adults.toString(),
        children: children.toString(),
        roomType: roomType,
        roomNumber: roomNumber, // ✅ Now included
        calculatedPrice: finalPrice.toString(),
        autoAssignedRoom: 'true' // Flag to indicate room was auto-assigned
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('✅ Payment intent created successfully:', paymentIntent.id);

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      totalPrice: finalPrice,
      roomNumber: roomNumber, // ✅ Return the assigned room number to frontend
      autoAssigned: true
    });

  } catch (error) {
    console.error("❌ Payment intent creation error:", error);
    
    // Handle specific Stripe errors
    if (error.type === 'StripeInvalidRequestError') {
      return res.status(400).json({ 
        message: "Invalid payment request", 
        error: error.message 
      });
    }
    
    res.status(500).json({ 
      message: "Error creating payment intent", 
      error: error.message 
    });
  }
});