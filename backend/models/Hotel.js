const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  number: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['Standard', 'Deluxe', 'Suite', 'Premium','Executive','Accessible','Presidential','Honeymoon', 'Family'],
    default: 'Standard'
  },
  status: {
    type: String,
    required: true,
    enum: ['available', 'occupied', 'maintenance'],
    default: 'available'
  },
  price: {
    type: Number,
    default: 0
  },
  roomImages: [{
    type: String
  }],
  maxGuests: {
    type: Number,
    default: 2
  }
}, {
  timestamps: true,
  // Add this to ensure unique room numbers within the array
  _id: true // Ensure each subdocument gets its own _id
});

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    default: "My Hotel"
  },
  description: {
    type: String,
    required: true
  },
  basePrice: {
    type: Number,
    required: true,
    default: 100
  },
  amenities: [{
    type: String
  }],
  location: {
    address: {
      type: String,
      default: ""
    },
    city: {
      type: String,
      default: ""
    },
    country: {
      type: String,
      default: ""
    },
    coordinates: {
      lat: {
        type: Number,
        default: null
      },
      lng: {
        type: Number,
        default: null
      }
    }
  },
  rooms: [roomSchema],
  pricingRules: [{
    day: String,
    multiplier: Number
  }],
  images: [{
    type: String
  }],
  reviews: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: {
        validator: function(value) {
          return value >= 1 && value <= 5;
        },
        message: 'Rating must be between 1 and 5'
      }
    },
    comment: {
      type: String,
      required: true,
      maxlength: 1000
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalReviews: {
    type: Number,
    default: 0
  },
  popularity: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for reviews
hotelSchema.virtual('reviewList', {
  ref: 'Review',
  localField: '_id',
  foreignField: 'hotel'
});

// Compound index for unique room numbers within a hotel
hotelSchema.index({ '_id': 1, 'rooms.number': 1 }, { unique: true });

// Middleware to ensure unique room numbers before saving
hotelSchema.pre('save', function(next) {
  if (this.isModified('rooms')) {
    const roomNumbers = new Set();
    const duplicateRooms = [];
    
    this.rooms.forEach(room => {
      if (roomNumbers.has(room.number)) {
        duplicateRooms.push(room.number);
      } else {
        roomNumbers.add(room.number);
      }
    });
    
    if (duplicateRooms.length > 0) {
      return next(new Error(`Duplicate room numbers found: ${duplicateRooms.join(', ')}`));
    }
  }
  
  // Calculate average rating
  if (this.reviews && this.reviews.length > 0) {
    const totalRating = this.reviews.reduce((sum, review) => sum + review.rating, 0);
    this.averageRating = parseFloat((totalRating / this.reviews.length).toFixed(1));
    this.totalReviews = this.reviews.length;
    
    // Calculate popularity based on reviews and average rating
    this.popularity = this.averageRating * Math.log(this.totalReviews + 1);
  } else {
    this.averageRating = 0;
    this.totalReviews = 0;
    this.popularity = 0;
  }
  next();
});

// Index for better performance
hotelSchema.index({ 'averageRating': -1 });
hotelSchema.index({ 'totalReviews': -1 });
hotelSchema.index({ 'popularity': -1 });
hotelSchema.index({ 'reviews.createdAt': -1 });

// Static method to get hotels by rating
hotelSchema.statics.findByRating = function(minRating = 0) {
  return this.find({ averageRating: { $gte: minRating } })
    .sort({ averageRating: -1, totalReviews: -1 });
};

// Static method to get popular hotels
hotelSchema.statics.findPopular = function(limit = 10) {
  return this.find({ popularity: { $gt: 0 } })
    .sort({ popularity: -1 })
    .limit(limit);
};

// Instance method to add a room with duplicate check
hotelSchema.methods.addRoom = function(roomData) {
  // Check for duplicate room number
  const existingRoom = this.rooms.find(room => room.number === roomData.number);
  if (existingRoom) {
    throw new Error(`Room number ${roomData.number} already exists`);
  }
  
  this.rooms.push({
    _id: new mongoose.Types.ObjectId(),
    ...roomData
  });
  
  return this.save();
};

// Instance method to update a room
hotelSchema.methods.updateRoom = function(roomNumber, updateData) {
  const roomIndex = this.rooms.findIndex(room => room.number === roomNumber);
  
  if (roomIndex === -1) {
    throw new Error(`Room ${roomNumber} not found`);
  }
  
  // If changing room number, check for duplicates
  if (updateData.number && updateData.number !== roomNumber) {
    const duplicateRoom = this.rooms.find(room => room.number === updateData.number);
    if (duplicateRoom) {
      throw new Error(`Room number ${updateData.number} already exists`);
    }
  }
  
  this.rooms[roomIndex] = {
    ...this.rooms[roomIndex].toObject(),
    ...updateData
  };
  
  return this.save();
};

// Instance method to remove a room
hotelSchema.methods.removeRoom = function(roomNumber) {
  const roomIndex = this.rooms.findIndex(room => room.number === roomNumber);
  
  if (roomIndex === -1) {
    throw new Error(`Room ${roomNumber} not found`);
  }
  
  this.rooms.splice(roomIndex, 1);
  return this.save();
};

// Instance method to add a review
hotelSchema.methods.addReview = function(userId, rating, comment) {
  const existingReview = this.reviews.find(review => 
    review.user.toString() === userId.toString()
  );
  
  if (existingReview) {
    throw new Error('User has already reviewed this hotel');
  }
  
  this.reviews.push({
    user: userId,
    rating,
    comment,
    createdAt: new Date()
  });
  
  return this.save();
};

// Instance method to update a review
hotelSchema.methods.updateReview = function(userId, rating, comment) {
  const reviewIndex = this.reviews.findIndex(review => 
    review.user.toString() === userId.toString()
  );
  
  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }
  
  this.reviews[reviewIndex].rating = rating;
  this.reviews[reviewIndex].comment = comment;
  this.reviews[reviewIndex].createdAt = new Date();
  
  return this.save();
};

// Instance method to remove a review
hotelSchema.methods.removeReview = function(userId) {
  const reviewIndex = this.reviews.findIndex(review => 
    review.user.toString() === userId.toString()
  );
  
  if (reviewIndex === -1) {
    throw new Error('Review not found');
  }
  
  this.reviews.splice(reviewIndex, 1);
  return this.save();
};

// Instance method to get user's review
hotelSchema.methods.getUserReview = function(userId) {
  return this.reviews.find(review => 
    review.user.toString() === userId.toString()
  );
};

// Instance method to check if user has reviewed
hotelSchema.methods.hasUserReviewed = function(userId) {
  return this.reviews.some(review => 
    review.user.toString() === userId.toString()
  );
};

// Middleware to populate reviews when finding hotels
hotelSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'reviews.user',
    select: 'name profileImage'
  });
  next();
});

module.exports = mongoose.model('Hotel', hotelSchema);