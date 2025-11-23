// jobs/autoCompleteBookings.js
const cron = require('node-cron');
const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');

// Run every day at midnight
cron.schedule('0 0 * * *', async () => {
  try {
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

    console.log(`✅ Auto-completed ${completedBookings.length} bookings`);
  } catch (error) {
    console.error('❌ Error auto-completing bookings:', error);
  }
});