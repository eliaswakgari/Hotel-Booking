const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
  bookingId: {
    type: String,
    required: true,
    unique: true
  },
  checkIn: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Check-in date must be today or in the future'
    }
  },
  checkOut: {
    type: Date,
    required: true,
    validate: {
      validator: function(date) {
        return date > this.checkIn;
      },
      message: 'Check-out date must be after check-in date'
    }
  },
  adults: {
    type: Number,
    required: true,
    min: 1
  },
  children: {
    type: Number,
    default: 0,
    min: 0
  },
  roomType: {
    type: String,
    required: true,
    enum: ['Standard', 'Deluxe', 'Suite', 'Premium','Executive','Accessible','Presidential','Honeymoon']
  },
  roomNumber: {
    type: String,
    required: true
  },
  totalPrice: {
    type: Number,
    required: true
  },
  paymentIntentId: {
    type: String,
    required: true
  },
  refundedAmount: {
    type: Number,
    default: 0
  },
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'partial', 'completed', 'requested'], // Added 'requested'
    default: 'none'
  },
  refundRequest: {
    requestedAt: {
      type: Date
    },
    reason: {
      type: String
    },
    requestedAmount: {
      type: Number
    },
    adminNotes: {
      type: String
    }
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed', 'refunded'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'succeeded', 'failed', 'refunded'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Compound index to prevent double booking
bookingSchema.index({ 
  hotel: 1, 
  roomNumber: 1, 
  checkIn: 1, 
  checkOut: 1,
  status: 1 
});

// Pre-save middleware to validate no overlapping bookings
bookingSchema.pre('save', async function(next) {
  // Skip validation for cancelled bookings
  if (this.isModified('status') && this.status === 'cancelled') {
    return next();
  }

  // Only validate for pending and confirmed status
  if (this.status === 'pending' || this.status === 'confirmed') {
    const overlappingBooking = await mongoose.model('Booking').findOne({
      hotel: this.hotel,
      roomNumber: this.roomNumber,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { $lt: this.checkOut },
          checkOut: { $gt: this.checkIn }
        }
      ],
      _id: { $ne: this._id }
    });

    if (overlappingBooking) {
      return next(new Error('This room is already booked for the selected dates'));
    }
  }

  next();
});

module.exports = mongoose.model('Booking', bookingSchema);