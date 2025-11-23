// controllers/reviewController.js
const asyncHandler = require('express-async-handler');
const Review = require('../models/Review');

// Create review
exports.createReview = asyncHandler(async (req, res) => {
  const { hotelId, rating, comment } = req.body;
  
  // Check if user already reviewed this hotel
  const existingReview = await Review.findOne({
    user: req.user._id,
    hotel: hotelId
  });

  if (existingReview) {
    return res.status(400).json({ 
      message: "You have already reviewed this hotel" 
    });
  }

  const review = await Review.create({
    user: req.user._id,
    hotel: hotelId,
    rating,
    comment
  });

  // Populate user info for response
  await review.populate('user', 'name email');

  res.status(201).json(review);
});

// Get reviews for hotel
exports.getReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ hotel: req.params.hotelId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
});