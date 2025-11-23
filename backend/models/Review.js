// models/Review.js
const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  hotel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0.5,
    max: 5,
    validate: {
      validator: function(value) {
        return value % 0.5 === 0; // Allow only 0.5 increments
      },
      message: 'Rating must be in increments of 0.5'
    }
  },
  comment: {
    type: String,
    required: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

// Compound index to ensure one review per user per hotel
reviewSchema.index({ user: 1, hotel: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);