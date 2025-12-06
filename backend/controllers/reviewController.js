// controllers/reviewController.js
const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');

// Create review (optionally room-specific via roomNumber)
exports.createReview = asyncHandler(async (req, res) => {
  const { hotelId, roomNumber, rating, comment } = req.body;
  
  // Check if user already reviewed this hotel/room combination
  const existingReview = await Review.findOne({
    user: req.user._id,
    hotel: hotelId,
    roomNumber: roomNumber || null,
  });

  if (existingReview) {
    return res.status(400).json({ 
      message: "You have already reviewed this hotel" 
    });
  }

  const review = await Review.create({
    user: req.user._id,
    hotel: hotelId,
    roomNumber: roomNumber || null,
    rating,
    comment
  });

  // Populate user info for response
  await review.populate('user', 'name email');

  res.status(201).json(review);
});

// Get reviews for hotel or for a specific room within the hotel
exports.getReviews = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { roomNumber } = req.query;

  const query = { hotel: hotelId };
  if (roomNumber) {
    query.roomNumber = roomNumber;
  }

  const reviews = await Review.find(query)
    .populate('user', 'name')
    .sort({ createdAt: -1 });

  res.json(reviews);
});