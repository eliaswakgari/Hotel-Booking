const mongoose = require('mongoose');
const Hotel = require('./models/Hotel');
require('dotenv').config(); // Load environment variables

const fixRoomData = async () => {
  try {
    // Check if MONGODB_URI is defined
    if (!process.env.MONGO_URI) {
      console.error('MONGODB_URI is not defined in environment variables');
      console.log('Available environment variables:', Object.keys(process.env).filter(key => key.includes('MONGO')));
      process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');

    const hotels = await Hotel.find({});
    console.log(`Found ${hotels.length} hotels to check`);
    
    let fixedCount = 0;
    
    for (const hotel of hotels) {
      let needsUpdate = false;
      
      // Fix hotel name if missing
      if (!hotel.name || hotel.name === 'Unnamed Hotel') {
        hotel.name = `Hotel ${hotel._id.toString().slice(-6)}`;
        needsUpdate = true;
        console.log(`Fixed name for hotel: ${hotel.name}`);
      }
      
      // Fix basePrice if missing
      if (!hotel.basePrice) {
        hotel.basePrice = 100;
        needsUpdate = true;
      }
      
      // Fix maxGuests if missing
      if (!hotel.maxGuests) {
        hotel.maxGuests = 5;
        needsUpdate = true;
      }
      
      // Fix amenities if missing
      if (!hotel.amenities || !Array.isArray(hotel.amenities)) {
        hotel.amenities = ['Free WiFi', 'Parking', 'Breakfast'];
        needsUpdate = true;
      }
      
      if (!hotel.rooms || !Array.isArray(hotel.rooms)) {
        hotel.rooms = [];
        needsUpdate = true;
      }
      
      // Fix room types to match the enum in the schema
      const validRoomTypes = ['Standard', 'Deluxe', 'Suite', 'Premium'];
      
      // Ensure each room has required fields and valid types
      hotel.rooms = hotel.rooms.map((room, index) => {
        let updatedRoom = { ...room._doc || room };
        
        // Fix room number
        if (!updatedRoom.number) {
          updatedRoom.number = `Room-${index + 1}`;
          needsUpdate = true;
        }
        
        // Fix room type - map to valid types
        if (!updatedRoom.type || !validRoomTypes.includes(updatedRoom.type)) {
          // Map common invalid types to valid ones
          const typeMapping = {
            'family room': 'Standard',
            'family': 'Standard',
            'double': 'Standard',
            'single': 'Standard',
            'king': 'Deluxe',
            'queen': 'Deluxe',
            'executive': 'Premium',
            'presidential': 'Suite'
          };
          
          const lowerType = updatedRoom.type ? updatedRoom.type.toLowerCase() : 'standard';
          updatedRoom.type = typeMapping[lowerType] || 'Standard';
          needsUpdate = true;
        }
        
        // Fix room status
        if (!updatedRoom.status) {
          updatedRoom.status = 'available';
          needsUpdate = true;
        }
        
        // Fix room price
        if (!updatedRoom.price) {
          // Set price based on room type
          const priceMultipliers = {
            'Standard': 1,
            'Deluxe': 1.5,
            'Suite': 2,
            'Premium': 2.5
          };
          updatedRoom.price = hotel.basePrice * (priceMultipliers[updatedRoom.type] || 1);
          needsUpdate = true;
        }
        
        return updatedRoom;
      });
      
      // Add sample rooms if none exist
      if (hotel.rooms.length === 0) {
        needsUpdate = true;
        const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Premium'];
        
        for (let i = 1; i <= 12; i++) {
          const roomType = roomTypes[Math.floor(Math.random() * roomTypes.length)];
          const priceMultipliers = {
            'Standard': 1,
            'Deluxe': 1.5,
            'Suite': 2,
            'Premium': 2.5
          };
          
          hotel.rooms.push({
            number: `Room-${i}`,
            type: roomType,
            status: Math.random() > 0.3 ? 'available' : 'occupied',
            price: hotel.basePrice * priceMultipliers[roomType]
          });
        }
        console.log(`Added sample rooms to hotel: ${hotel.name}`);
      }
      
      if (needsUpdate) {
        try {
          await hotel.save();
          fixedCount++;
          console.log(`✅ Fixed room data for hotel: ${hotel.name}`);
        } catch (saveError) {
          console.error(`❌ Failed to save hotel ${hotel.name}:`, saveError.message);
        }
      }
    }
    
    console.log(`\nRoom data fix completed! Fixed ${fixedCount} out of ${hotels.length} hotels.`);
    process.exit(0);
  } catch (error) {
    console.error('Error fixing room data:', error);
    process.exit(1);
  }
};

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\nScript interrupted by user');
  await mongoose.connection.close();
  process.exit(0);
});

fixRoomData();