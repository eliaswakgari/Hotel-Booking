// routes/notificationRoutes.js
const express = require('express');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotification
} = require('../controllers/notificationController');
const { protect } = require('../middleware/authMiddleware'); // Remove admin

const router = express.Router();

// All routes now use only protect (not admin) so both guests and admins can access
router.route('/')
  .get(protect, getNotifications); // ✅ Removed admin middleware

router.route('/read-all')
  .put(protect, markAllAsRead); // ✅ Removed admin middleware

router.route('/:id/read')
  .put(protect, markAsRead); // ✅ Removed admin middleware

router.route('/:id')
  .get(protect, getNotification) // ✅ Removed admin middleware
  .delete(protect, deleteNotification); // ✅ Removed admin middleware

module.exports = router;