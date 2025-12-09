const asyncHandler = require('express-async-handler');
const Hotel = require('../models/Hotel');
const mongoose = require('mongoose');
const Booking = require('../models/Booking');
const Review = require('../models/Review');
const cloudinary = require('../config/cloudinary');
const { getIO } = require('../socket');
const redisClient = require('../config/redisClient');

// Helper to clear cached hotel base data
const clearHotelCache = async (hotelId) => {
  if (!hotelId || !redisClient || !redisClient.isOpen) return;
  const cacheKey = `hotel:${hotelId}:base`;
  try {
    await redisClient.del(cacheKey);
  } catch (err) {
    console.error('Error clearing hotel cache:', err.message);
  }
};

// GET available rooms for specific dates
exports.getAvailableRooms = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { checkIn, checkOut } = req.query;

  if (!checkIn || !checkOut) {
    return res.status(400).json({ message: "Check-in and check-out dates are required" });
  }

  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  const checkInDate = new Date(checkIn);
  const checkOutDate = new Date(checkOut);
  
  if (checkInDate >= checkOutDate) {
    return res.status(400).json({ message: "Check-out date must be after check-in date" });
  }

  if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
    return res.status(400).json({ message: "Check-in date cannot be in the past" });
  }

  const availableRooms = [];
  
  for (const room of hotel.rooms) {
    try {
      const isAvailable = await checkRoomAvailability(id, room.number, checkIn, checkOut);
      
      if (isAvailable && room.status === 'available') {
        availableRooms.push({
          _id: room._id,
          number: room.number,
          type: room.type,
          status: room.status,
          price: room.price || hotel.basePrice,
          hotelBasePrice: hotel.basePrice,
          maxGuests: room.maxGuests || 2,
          roomImages: room.roomImages || [],
          amenities: room.amenities || []
        });
      }
    } catch (error) {
      console.error(`Error checking availability for room ${room.number}:`, error);
    }
  }

  res.json({
    availableRooms,
    totalRooms: hotel.rooms.length,
    availableCount: availableRooms.length,
    checkIn,
    checkOut
  });
});

// Room availability checker
const checkRoomAvailability = async (hotelId, roomNumber, checkIn, checkOut) => {
  try {
    const existingBookings = await Booking.find({
      hotel: hotelId,
      roomNumber: roomNumber,
      status: { $in: ['confirmed', 'pending'] },
      $or: [
        {
          checkIn: { 
            $gte: new Date(checkIn),
            $lt: new Date(checkOut)
          }
        },
        {
          checkOut: { 
            $gt: new Date(checkIn),
            $lte: new Date(checkOut)
          }
        },
        {
          checkIn: { $lte: new Date(checkIn) },
          checkOut: { $gte: new Date(checkOut) }
        }
      ]
    });

    return existingBookings.length === 0;
  } catch (error) {
    console.error('Error in checkRoomAvailability:', error);
    return false;
  }
};

// GET hotels with filters
exports.getHotels = asyncHandler(async (req, res) => {
  const { 
    search, 
    location, 
    minPrice, 
    maxPrice, 
    amenities,
    checkIn,
    checkOut,
    guests,
    minRating,
    page = 1, 
    limit = 100
  } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  if (location) {
    query['location.address'] = { $regex: location, $options: 'i' };
  }

  if (minPrice || maxPrice) {
    query.basePrice = {};
    if (minPrice) query.basePrice.$gte = parseInt(minPrice);
    if (maxPrice) query.basePrice.$lte = parseInt(maxPrice);
  }

  if (amenities) {
    const amenitiesArray = Array.isArray(amenities) ? amenities : amenities.split(',');
    query.amenities = { $in: amenitiesArray };
  }

  if (minRating) {
    query.averageRating = { $gte: parseFloat(minRating) };
  }

  try {
    const hotels = await Hotel.find(query)
      .populate({
        path: 'reviews.user',
        select: 'name profileImage'
      })
      .sort({ 
        popularity: -1, 
        averageRating: -1, 
        createdAt: -1 
      })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    if (checkIn && checkOut) {
      const hotelsWithAvailability = await Promise.all(
        hotels.map(async (hotel) => {
          const availableRoomsCount = await getAvailableRoomsCount(
            hotel._id, 
            checkIn, 
            checkOut, 
            parseInt(guests) || 1
          );
          
          return {
            ...hotel.toObject(),
            hasAvailableRooms: availableRoomsCount > 0,
            availableRoomsCount
          };
        })
      );

      return res.json(hotelsWithAvailability);
    }

    res.json(hotels);
  } catch (error) {
    console.error('Error fetching hotels:', error);
    res.status(500).json({ message: 'Error fetching hotels', error: error.message });
  }
});

// Helper function to count available rooms
const getAvailableRoomsCount = async (hotelId, checkIn, checkOut, guests) => {
  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return 0;

    let availableCount = 0;
    for (const room of hotel.rooms) {
      const isAvailable = await checkRoomAvailability(hotelId, room.number, checkIn, checkOut);
      if (isAvailable && room.status === 'available') {
        availableCount++;
      }
    }
    return availableCount;
  } catch (error) {
    console.error('Error counting available rooms:', error);
    return 0;
  }
};

// CREATE Hotel (Admin) - FIXED to properly handle room images
exports.createHotel = asyncHandler(async (req, res) => {
  const { description, amenities, location, rooms, pricingRules, name, basePrice, maxGuests, roomType } = req.body;

  let parsedLocation = {};
  try {
    if (location) {
      parsedLocation = JSON.parse(location);
      
      if (parsedLocation.coordinates) {
        if (parsedLocation.coordinates.lat) {
          parsedLocation.coordinates.lat = parseFloat(parsedLocation.coordinates.lat);
        }
        if (parsedLocation.coordinates.lng) {
          parsedLocation.coordinates.lng = parseFloat(parsedLocation.coordinates.lng);
        }
        
        if (parsedLocation.coordinates.lat === '' || parsedLocation.coordinates.lat === null) {
          parsedLocation.coordinates.lat = undefined;
        }
        if (parsedLocation.coordinates.lng === '' || parsedLocation.coordinates.lng === null) {
          parsedLocation.coordinates.lng = undefined;
        }
        
        if (parsedLocation.coordinates.lat === undefined && parsedLocation.coordinates.lng === undefined) {
          parsedLocation.coordinates = undefined;
        }
      }
    }
  } catch (err) {
    console.error('Error parsing location:', err);
    parsedLocation = {};
  }

  let parsedRooms = [];
  
  try {
    if (rooms) {
      parsedRooms = JSON.parse(rooms);
      
      parsedRooms = parsedRooms.map((room) => {
        const roomId = new mongoose.Types.ObjectId();
        
        return {
          _id: roomId,
          number: room.number || `Room-${Math.random().toString(36).substr(2, 9)}`,
          type: room.type || "Standard",
          status: room.status || "available",
          price: room.price || basePrice,
          maxGuests: room.maxGuests || 2,
          roomImages: room.roomImages || [], // Use room.roomImages if provided
          amenities: Array.isArray(room.amenities)
            ? room.amenities
            : (typeof room.amenities === 'string' && room.amenities.trim()
              ? room.amenities.split(',').map(a => a.trim()).filter(Boolean)
              : [])
        };
      });
    }
  } catch (err) {
    console.error('Error parsing rooms:', err);
    parsedRooms = [];
  }

  const parsedPricing = pricingRules ? JSON.parse(pricingRules || "[]") : [];

  // Handle hotel images - using 'images' field from multer
  const hotelImages = [];
  if (req.files && req.files.images) {
    for (const file of req.files.images.slice(0, 5)) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'hotels'
        });
        hotelImages.push(result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading hotel image to Cloudinary:', uploadError);
      }
    }
  }

  // Handle room images - using 'roomTypeImages' field from multer
  const roomImages = [];
  if (req.files && req.files.roomTypeImages) {
    for (const file of req.files.roomTypeImages.slice(0, 5)) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'hotel-rooms'
        });
        roomImages.push(result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading room image to Cloudinary:', uploadError);
      }
    }
  }

  // Assign uploaded room images to rooms
  if (roomImages.length > 0 && parsedRooms.length > 0) {
    parsedRooms = parsedRooms.map((room, index) => ({
      ...room,
      roomImages: [roomImages[index % roomImages.length]] // Assign one image per room
    }));
  }

  const hotel = await Hotel.create({
    name: name || "My Hotel",
    description,
    basePrice: basePrice || 100,
    maxGuests: maxGuests || 5,
    amenities: amenities ? amenities.split(",") : [],
    location: parsedLocation,
    rooms: parsedRooms,
    pricingRules: parsedPricing,
    images: hotelImages,
  });

  getIO().emit("hotelCreated", hotel);
  await clearHotelCache(hotel._id);
});

// UPDATE hotel
exports.updateHotel = asyncHandler(async (req, res) => {
  const { id } = req.params;

  let {
    description,
    amenities,
    location,
    rooms,
    pricingRules,
    name,
    basePrice,
    maxGuests,
    roomType,
    contact,
  } = req.body;

  try {
    if (typeof location === "string") location = JSON.parse(location);
    if (typeof rooms === "string") rooms = JSON.parse(rooms);
    if (typeof pricingRules === "string") pricingRules = JSON.parse(pricingRules);
    if (typeof contact === "string") contact = JSON.parse(contact);
  } catch (err) {
    return res.status(400).json({ message: "Invalid JSON format in request body" });
  }

  const hotel = await Hotel.findById(id);
  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  // Handle coordinates
  if (location && location.coordinates) {
    if (location.coordinates.lat && typeof location.coordinates.lat === 'string') {
      location.coordinates.lat = parseFloat(location.coordinates.lat);
    }
    if (location.coordinates.lng && typeof location.coordinates.lng === 'string') {
      location.coordinates.lng = parseFloat(location.coordinates.lng);
    }
    
    if (location.coordinates.lat === '' || location.coordinates.lat === null) {
      location.coordinates.lat = undefined;
    }
    if (location.coordinates.lng === '' || location.coordinates.lng === null) {
      location.coordinates.lng = undefined;
    }
    
    if (location.coordinates.lat === undefined && location.coordinates.lng === undefined) {
      location.coordinates = undefined;
    }
  }

  // Handle room updates with individual image management
  if (rooms && Array.isArray(rooms)) {
    const updatedRooms = [];
    const usedRoomNumbers = new Set();
    
    for (const room of rooms) {
      // Check for duplicate room numbers
      if (usedRoomNumbers.has(room.number)) {
        return res.status(400).json({ 
          message: `Duplicate room number found: ${room.number}. Room numbers must be unique.` 
        });
      }
      usedRoomNumbers.add(room.number);

      // Find existing room by number to preserve data
      const existingRoom = hotel.rooms.find(r => r.number === room.number);
      
      let roomId;
      let roomImages = [];

      if (existingRoom) {
        roomId = existingRoom._id;
        // Preserve existing images
        roomImages = existingRoom.roomImages || [];
      } else if (room._id && mongoose.Types.ObjectId.isValid(room._id)) {
        roomId = room._id;
      } else {
        roomId = new mongoose.Types.ObjectId();
      }

      updatedRooms.push({
        _id: roomId,
        number: room.number,
        type: room.type,
        status: room.status || "available",
        price: room.price || hotel.basePrice,
        maxGuests: room.maxGuests || 2,
        roomImages: roomImages, // Keep existing images
        amenities: Array.isArray(room.amenities)
          ? room.amenities
          : (typeof room.amenities === 'string' && room.amenities.trim()
            ? room.amenities.split(',').map(a => a.trim()).filter(Boolean)
            : [])
      });
    }

    hotel.rooms = updatedRooms;
  }

  // Handle hotel images - using 'images' field from multer
  let newHotelImages = [];
  if (req.files && req.files.images) {
    for (const file of req.files.images.slice(0, 5)) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'hotels'
        });
        newHotelImages.push(result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading hotel image to Cloudinary:', uploadError);
      }
    }
  }

  const mergedHotelImages = newHotelImages.length > 0 ? newHotelImages : hotel.images;

  // Handle room type images - using 'roomTypeImages' field from multer
  let newRoomTypeImages = [];
  if (req.files && req.files.roomTypeImages) {
    for (const file of req.files.roomTypeImages.slice(0, 5)) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'hotel-rooms'
        });
        newRoomTypeImages.push(result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading room type image to Cloudinary:', uploadError);
      }
    }
  }

  // If new room type images are uploaded, assign them to rooms
  if (newRoomTypeImages.length > 0 && hotel.rooms.length > 0) {
    hotel.rooms = hotel.rooms.map((room, index) => ({
      ...room.toObject(),
      roomImages: [newRoomTypeImages[index % newRoomTypeImages.length]] // Assign one image per room
    }));
  }

  // Update hotel fields
  hotel.name = name || hotel.name;
  hotel.description = description || hotel.description;
  hotel.basePrice = basePrice || hotel.basePrice;
  hotel.maxGuests = maxGuests || hotel.maxGuests;
  hotel.amenities = amenities
    ? amenities.split(",").map((a) => a.trim())
    : hotel.amenities;
  hotel.location = location || hotel.location;
  hotel.pricingRules = pricingRules && pricingRules.length > 0 ? pricingRules : hotel.pricingRules;
  hotel.images = mergedHotelImages;

  // Apply contact updates (phone, email) if provided
  if (contact && typeof contact === 'object') {
    hotel.contact = {
      ...(hotel.contact || {}),
      ...(contact.phone !== undefined ? { phone: contact.phone } : {}),
      ...(contact.email !== undefined ? { email: contact.email } : {}),
    };
  }

  const updatedHotel = await hotel.save();

  const io = getIO();
  io.emit("hotelUpdated", updatedHotel);
  await clearHotelCache(updatedHotel._id);

  res.status(200).json(updatedHotel);
});

// CREATE individual room with images
exports.addRoom = asyncHandler(async (req, res) => {
  const { hotelId } = req.params;
  const { number, type, status, price, maxGuests, description, amenities } = req.body;

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  // Validate room number
  if (!number) {
    return res.status(400).json({ message: "Room number is required" });
  }

  // Check for duplicate room number
  const existingRoom = hotel.rooms.find(r => r.number === number);
  if (existingRoom) {
    return res.status(400).json({ message: `Room number ${number} already exists` });
  }

  // Handle room image uploads - using 'images' field from multer
  let uploadedImages = [];
  if (req.files && req.files.images) {
    for (const file of req.files.images) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `hotel-rooms/${hotelId}`
        });
        uploadedImages.push(result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading room image to Cloudinary:', uploadError);
      }
    }
  }

  const newRoom = {
    _id: new mongoose.Types.ObjectId(),
    number,
    type: type || 'Standard',
    status: status || 'available',
    price: price ? parseFloat(price) : hotel.basePrice,
    maxGuests: maxGuests ? parseInt(maxGuests) : 2,
    roomImages: uploadedImages,
    amenities: amenities ? amenities.split(',').map(a => a.trim()).filter(Boolean) : []
  };

  hotel.rooms.push(newRoom);

  if (description) {
    hotel.description = description;
  }

  const updatedHotelWithRoom = await hotel.save();

  const io2 = getIO();
  io2.emit("hotelUpdated", updatedHotelWithRoom);
  await clearHotelCache(updatedHotelWithRoom._id);

  res.status(201).json({
    message: "Room added successfully",
    room: newRoom,
    hotel: updatedHotelWithRoom
  });
});

// UPDATE individual room with images
exports.updateRoom = asyncHandler(async (req, res) => {
  const { hotelId, roomId } = req.params;
  const { number, type, status, price, maxGuests, description, amenities } = req.body;

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  const room = hotel.rooms.id(roomId);
  if (!room) {
    return res.status(404).json({ message: "Room not found" });
  }

  // Check for duplicate room number (excluding current room)
  if (number && number !== room.number) {
    const duplicateRoom = hotel.rooms.find(r => r.number === number && r._id.toString() !== roomId);
    if (duplicateRoom) {
      return res.status(400).json({ message: "Room number already exists" });
    }
  }

  // Handle room image uploads - using 'images' field from multer
  let uploadedImages = [];
  if (req.files && req.files.images) {
    for (const file of req.files.images) {
      try {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: `hotel-rooms/${hotelId}`
        });
        uploadedImages.push(result.secure_url);
      } catch (uploadError) {
        console.error('Error uploading room image to Cloudinary:', uploadError);
      }
    }
  }

  // Update room fields
  if (number) room.number = number;
  if (type) room.type = type;
  if (status) room.status = status;
  if (price) room.price = parseFloat(price);
  if (maxGuests) room.maxGuests = parseInt(maxGuests);
  if (amenities) room.amenities = amenities ? amenities.split(',').map(a => a.trim()).filter(Boolean) : [];
  
  // Update images if new ones were uploaded
  if (uploadedImages.length > 0) {
    room.roomImages = uploadedImages;
  }

  // Update hotel description if provided
  if (description) {
    hotel.description = description;
  }

  const updatedHotel = await hotel.save();

  const io = getIO();
  io.emit("hotelUpdated", updatedHotel);
  await clearHotelCache(updatedHotel._id);

  res.status(200).json({
    message: "Room updated successfully",
    room: room,
    hotel: updatedHotel
  });
});

// DELETE hotel
exports.deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);
  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  await hotel.deleteOne();

  getIO().emit('hotelDeleted', { id: req.params.id });
  await clearHotelCache(req.params.id);

  res.json({ message: 'Hotel deleted successfully' });
});

// GET hotel by ID
exports.getHotelById = asyncHandler(async (req, res) => {
  const { checkIn, checkOut } = req.query;

  const useCache = !checkIn && !checkOut;
  const cacheKey = `hotel:${req.params.id}:base`;

  // Try Redis cache first for base requests (no date filters)
  if (useCache && redisClient && redisClient.isOpen) {
    try {
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        return res.json(parsed);
      }
    } catch (err) {
      console.error('Error reading hotel from cache:', err.message);
    }
  }

  const hotel = await Hotel.findById(req.params.id);
  
  if (!hotel) {
    return res.status(404).json({ message: "Hotel not found" });
  }

  const isAdmin = req.user && req.user.role === 'admin';

  if (checkIn && checkOut) {
    const roomsWithAvailability = [];
    
    for (const room of hotel.rooms) {
      const isAvailable = await checkRoomAvailability(hotel._id, room.number, checkIn, checkOut);
      
      if (isAdmin || (isAvailable && room.status === 'available')) {
        roomsWithAvailability.push({
          ...room.toObject(),
          isAvailable: isAvailable && room.status === 'available'
        });
      }
    }
    
    hotel.rooms = roomsWithAvailability;
  } else if (!isAdmin) {
    hotel.rooms = hotel.rooms.filter(room => room.status === 'available');
  }

  // Store base response in Redis cache
  if (useCache && redisClient && redisClient.isOpen) {
    try {
      await redisClient.set(cacheKey, JSON.stringify(hotel), { EX: 300 });
    } catch (err) {
      console.error('Error writing hotel to cache:', err.message);
    }
  }

  res.json(hotel);
});

// Fix duplicate room IDs
exports.fixDuplicateRoomIds = asyncHandler(async (req, res) => {
  try {
    const hotels = await Hotel.find({});
    let fixedCount = 0;
    let totalDuplicates = 0;

    for (const hotel of hotels) {
      const roomMap = new Map();
      let hasDuplicates = false;
      const updatedRooms = [];

      for (const room of hotel.rooms) {
        const roomKey = room.number;
        
        if (roomMap.has(roomKey)) {
          hasDuplicates = true;
          totalDuplicates++;
          updatedRooms.push({
            ...room.toObject(),
            _id: new mongoose.Types.ObjectId()
          });
        } else {
          roomMap.set(roomKey, true);
          updatedRooms.push(room);
        }
      }

      if (hasDuplicates) {
        hotel.rooms = updatedRooms;
        await hotel.save();
        fixedCount++;
      }
    }

    res.json({ 
      message: `Fixed ${totalDuplicates} duplicate room entries in ${fixedCount} hotels`,
      fixedCount,
      totalDuplicates
    });
  } catch (error) {
    console.error('Error fixing duplicate room IDs:', error);
    res.status(500).json({ message: 'Error fixing duplicate room IDs', error: error.message });
  }
});

// GET single room by room ID (with its hotel)
exports.getRoomById = asyncHandler(async (req, res) => {
  const { roomId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(roomId)) {
    return res.status(400).json({ message: 'Invalid room ID' });
  }

  const hotel = await Hotel.findOne({ 'rooms._id': roomId });

  if (!hotel) {
    return res.status(404).json({ message: 'Room not found' });
  }

  const room = hotel.rooms.id(roomId);

  if (!room) {
    return res.status(404).json({ message: 'Room not found' });
  }

  return res.json({ hotel, room });
});

// GET available rooms
exports.getAvailableRooms = asyncHandler(async (req, res) => {
  const { checkIn, checkOut, roomType, guests } = req.query;

  // Optional hotel restriction (for /:id/available-rooms)
  const hotelIdParam = req.params.id || null;

  try {
    // If no dates are provided, show all rooms that are marked as available
    // and have no overlapping bookings in a default window: today -> 1 year.
    if (!checkIn || !checkOut) {
      const hotelQuery = hotelIdParam ? { _id: hotelIdParam } : {};

      const hotels = await Hotel.find(hotelQuery).populate({
        path: 'reviews.user',
        select: 'name profileImage',
      });

      const availableRooms = [];

      const hotelIds = hotels.map((h) => h._id);
      const roomRatingsAgg = await Review.aggregate([
        { $match: { hotel: { $in: hotelIds } } },
        {
          $group: {
            _id: { hotel: '$hotel', roomNumber: '$roomNumber' },
            averageRating: { $avg: '$rating' },
            totalReviews: { $sum: 1 },
          },
        },
      ]);

      const roomRatingMap = new Map();
      roomRatingsAgg.forEach((entry) => {
        const hotelIdStr = entry._id.hotel.toString();
        const roomNumber = entry._id.roomNumber || '';
        const key = `${hotelIdStr}-${roomNumber}`;
        roomRatingMap.set(key, {
          averageRating: entry.averageRating,
          totalReviews: entry.totalReviews,
        });
      });

      const today = new Date();
      const oneYearLater = new Date(today);
      oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);

      const todayISO = today.toISOString().split('T')[0];
      const oneYearLaterISO = oneYearLater.toISOString().split('T')[0];

      for (const hotel of hotels) {
        for (const room of hotel.rooms) {
          if (room.status !== 'available') continue;

          const isAvailable = await checkRoomAvailability(
            hotel._id,
            room.number,
            todayISO,
            oneYearLaterISO,
          );

          if (!isAvailable) continue;

          const ratingKey = `${hotel._id.toString()}-${room.number}`;
          const ratingInfo = roomRatingMap.get(ratingKey) || null;

          availableRooms.push({
            hotel: {
              _id: hotel._id,
              name: hotel.name,
              description: hotel.description,
              basePrice: hotel.basePrice,
              location: hotel.location,
              amenities: hotel.amenities,
              images: hotel.images,
              reviews: hotel.reviews,
              averageRating: hotel.averageRating,
              contact: hotel.contact,
            },
            room: {
              _id: room._id,
              number: room.number,
              type: room.type,
              status: room.status,
              price: room.price || hotel.basePrice,
              maxGuests: room.maxGuests || 2,
              roomImages: room.roomImages || [],
              averageRating: ratingInfo ? ratingInfo.averageRating : 0,
              totalReviews: ratingInfo ? ratingInfo.totalReviews : 0,
            },
          });
        }
      }

      return res.json({
        availableRooms,
        totalRooms: availableRooms.length,
        message: 'All available rooms',
        filters: {
          roomType: roomType || 'All',
          guests: guests || 'Any',
        },
      });
    }

    // If dates are provided, check availability within that specific range.
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkInDate >= checkOutDate) {
      return res
        .status(400)
        .json({ message: 'Check-out date must be after check-in date' });
    }

    if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
      return res
        .status(400)
        .json({ message: 'Check-in date cannot be in the past' });
    }

    const hotelQuery = hotelIdParam ? { _id: hotelIdParam } : {};

    const hotels = await Hotel.find(hotelQuery).populate({
      path: 'reviews.user',
      select: 'name profileImage',
    });

    const availableRooms = [];

    const hotelIds = hotels.map((h) => h._id);
    const roomRatingsAgg = await Review.aggregate([
      { $match: { hotel: { $in: hotelIds } } },
      {
        $group: {
          _id: { hotel: '$hotel', roomNumber: '$roomNumber' },
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);

    const roomRatingMap = new Map();
    roomRatingsAgg.forEach((entry) => {
      const hotelIdStr = entry._id.hotel.toString();
      const roomNumber = entry._id.roomNumber || '';
      const key = `${hotelIdStr}-${roomNumber}`;
      roomRatingMap.set(key, {
        averageRating: entry.averageRating,
        totalReviews: entry.totalReviews,
      });
    });

    for (const hotel of hotels) {
      for (const room of hotel.rooms) {
        if (room.status !== 'available') continue;

        if (roomType && roomType !== 'All' && room.type !== roomType) continue;

        if (guests && room.maxGuests < parseInt(guests, 10)) continue;

        const isAvailable = await checkRoomAvailability(
          hotel._id,
          room.number,
          checkIn,
          checkOut,
        );

        if (!isAvailable) continue;

        const ratingKey = `${hotel._id.toString()}-${room.number}`;
        const ratingInfo = roomRatingMap.get(ratingKey) || null;

        availableRooms.push({
          hotel: {
            _id: hotel._id,
            name: hotel.name,
            description: hotel.description,
            basePrice: hotel.basePrice,
            location: hotel.location,
            amenities: hotel.amenities,
            images: hotel.images,
            reviews: hotel.reviews,
            averageRating: hotel.averageRating,
            contact: hotel.contact,
          },
          room: {
            _id: room._id,
            number: room.number,
            type: room.type,
            status: room.status,
            price: room.price || hotel.basePrice,
            maxGuests: room.maxGuests || 2,
            roomImages: room.roomImages || [],
            averageRating: ratingInfo ? ratingInfo.averageRating : 0,
            totalReviews: ratingInfo ? ratingInfo.totalReviews : 0,
          },
        });
      }
    }

    return res.json({
      availableRooms,
      totalRooms: availableRooms.length,
      checkIn,
      checkOut,
      filters: {
        roomType: roomType || 'All',
        guests: guests || 'Any',
      },
    });
  } catch (error) {
    console.error('Error fetching available rooms:', error);
    return res.status(500).json({
      message: 'Error fetching available rooms',
      error: error.message,
    });
  }
});