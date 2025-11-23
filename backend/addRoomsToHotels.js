// scripts/addRoomsToHotels.js
const mongoose = require('mongoose');
const Hotel = require("./models/Hotel.js");
const dotenv = require('dotenv');
dotenv.config();
const addSampleRooms = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connecting to:', process.env.MONGO_URI);
    const hotels = await Hotel.find({});
    
    for (const hotel of hotels) {
      if (!hotel.rooms || hotel.rooms.length === 0) {
        const roomTypes = ['Standard', 'Deluxe', 'Suite'];
        const rooms = [];
        
        // Create 10 rooms for each hotel
        for (let i = 1; i <= 10; i++) {
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          rooms.push({
            number: `Room-${i}`,
            type: roomType,
            status: Math.random() > 0.3 ? 'available' : 'occupied', // 70% available
            price: hotel.basePrice * (roomType === 'Deluxe' ? 1.5 : roomType === 'Suite' ? 2 : 1)
          });
        }
        
        hotel.rooms = rooms;
        await hotel.save();
        console.log(`Added ${rooms.length} rooms to hotel: ${hotel.name}`);
      }
    }
    
    console.log('Room addition completed!');
    process.exit(0);
  } catch (error) {
    console.error('Error adding rooms:', error);
    process.exit(1);
  }
};

addSampleRooms();