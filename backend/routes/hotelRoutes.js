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
  getRoomById,
} = require('../controllers/hotelController');

const handleUpload = upload.fields([
  { name: 'images', maxCount: 5 },
  { name: 'roomTypeImages', maxCount: 5 }
]);

const roomUpload = upload.fields([
  { name: 'images', maxCount: 5 }
]);

// ✅ MUST COME FIRST
// MUST COME FIRST — PUBLIC
router.get('/rooms/available', getAvailableRooms);
router.get('/rooms/:roomId', getRoomById);
router.get('/:id/available-rooms', getAvailableRooms);

// THEN HOTEL ROUTES
router.route('/')
  .post(protect, admin, handleUpload, createHotel)
  .get(getHotels);

// ALWAYS PUT LAST — catches only valid IDs
router.route('/:id')
  .get(getHotelById)
  .put(protect, admin, handleUpload, updateHotel)
  .delete(protect, admin, deleteHotel);

// ROOMS
router.post('/:hotelId/rooms', protect, admin, roomUpload, addRoom);
router.put('/:hotelId/rooms/:roomId', protect, admin, roomUpload, updateRoom);
module.exports = router;
