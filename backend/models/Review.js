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
  roomNumber: {
    type: String,
    required: false
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

// Compound index to ensure one review per user per hotel per room
// When roomNumber is null/undefined, this effectively stays hotel-level
reviewSchema.index({ user: 1, hotel: 1, roomNumber: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

// On startup, automatically drop the legacy unique index (user_1_hotel_1)
// that was created before roomNumber was added. This prevents duplicate-key
// errors like E11000 on { user, hotel } when trying to review multiple rooms.
mongoose.connection.once('open', async () => {
  try {
    const indexes = await Review.collection.indexes();
    const legacyIndex = indexes.find((idx) => idx.name === 'user_1_hotel_1');

    if (legacyIndex) {
      await Review.collection.dropIndex('user_1_hotel_1');
      console.log('Dropped legacy Review index user_1_hotel_1');
    }
  } catch (err) {
    console.error('Error checking/dropping legacy Review index:', err.message);
  }
});

module.exports = Review;