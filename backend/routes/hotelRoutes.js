const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createHotel,
  getHotels,
  getHotelById,
  updateHotel,
  deleteHotel,
  getAvailableRooms,
  updateRoom,
  addRoom,
} = require('../controllers/hotelController');

const handleUpload = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'roomTypeImages', maxCount: 5 }
]);

// Individual room update
const roomUpload = upload.fields([
  { name: 'images', maxCount: 5 }
]);

// Public routes
router.route('/')
  .post(protect, admin, handleUpload, createHotel)
  .get(getHotels);

router.route('/:id')
  .get(getHotelById)
  .put(protect, admin, handleUpload, updateHotel)
  .delete(protect, admin, deleteHotel);

// Available rooms routes - public access
router.get('/rooms/available', getAvailableRooms); // NEW - All available rooms
router.get('/:id/available-rooms', getAvailableRooms); // Existing - Available rooms for specific hotel

// Individual room routes
router.post('/:hotelId/rooms', protect, admin, roomUpload, addRoom);
router.put('/:hotelId/rooms/:roomId', protect, admin, roomUpload, updateRoom);

module.exports = router;