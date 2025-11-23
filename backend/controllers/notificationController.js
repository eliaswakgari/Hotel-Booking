// controllers/notificationController.js
const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const { getIO } = require('../socket');

// Get all notifications for user (both guest and admin)
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { page = 1, limit = 20 } = req.query;

  const notifications = await Notification.find({ recipient: userId })
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('sender', 'name profileImage')
    .populate('booking', 'bookingId checkIn checkOut totalPrice');

  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    read: false
  });

  res.json({
    notifications,
    unreadCount,
    totalPages: Math.ceil(notifications.length / limit),
    currentPage: page
  });
});

// Get single notification (both guest and admin)
exports.getNotification = asyncHandler(async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('sender', 'name email phone')
      .populate('recipient', 'name email')
      .populate('booking');

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    // Check if user has permission to view this notification
    // Now allows both the recipient user and admin users
    const isRecipient = notification.recipient._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    
    if (!isRecipient && !isAdmin) {
      return res.status(403).json({ message: "Access denied" });
    }

    res.json(notification);
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ message: "Server error" });
  }
});

// Mark notification as read (both guest and admin)
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndUpdate(
    { 
      _id: req.params.id, 
      $or: [
        { recipient: req.user._id }, // User is recipient
        { recipient: 'admin', $exists: true } // Or user is admin accessing admin notifications
      ]
    },
    { read: true },
    { new: true }
  ).populate('sender', 'name profileImage')
   .populate('booking', 'bookingId checkIn checkOut totalPrice');

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  // Emit real-time update
  const io = getIO();
  io.to(req.user._id.toString()).emit('notificationUpdated', notification);

  res.json(notification);
});

// Mark all notifications as read (both guest and admin)
exports.markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { 
      recipient: req.user._id,
      read: false 
    },
    { read: true }
  );

  const io = getIO();
  io.to(req.user._id.toString()).emit('allNotificationsRead');

  res.json({ message: 'All notifications marked as read' });
});

// Delete notification (both guest and admin)
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findOneAndDelete({
    _id: req.params.id,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({ message: 'Notification not found' });
  }

  const io = getIO();
  io.to(req.user._id.toString()).emit('notificationDeleted', notification._id);

  res.json({ message: 'Notification deleted successfully' });
});

// Create notification function
exports.createNotification = async (data) => {
  try {
    // If recipient is 'admin', find all admin users
    if (data.recipient === 'admin') {
      const User = require('../models/User');
      const adminUsers = await User.find({ role: 'admin' });
      
      // Create notifications for all admin users
      const notificationPromises = adminUsers.map(admin => 
        Notification.create({
          ...data,
          recipient: admin._id
        })
      );
      
      const notifications = await Promise.all(notificationPromises);
      
      // Populate and emit for each notification
      const populatedNotifications = await Promise.all(
        notifications.map(notification => 
          Notification.findById(notification._id)
            .populate('sender', 'name profileImage')
            .populate('booking', 'bookingId checkIn checkOut totalPrice')
        )
      );

      // Emit real-time notifications to all admin users
      const io = getIO();
      populatedNotifications.forEach(notification => {
        io.to(notification.recipient.toString()).emit('newNotification', notification);
      });

      return populatedNotifications;
    } else {
      // Single recipient notification (for guest users)
      const notification = await Notification.create(data);
      
      const populatedNotification = await Notification.findById(notification._id)
        .populate('sender', 'name profileImage')
        .populate('booking', 'bookingId checkIn checkOut totalPrice');

      // Emit real-time notification
      const io = getIO();
      io.to(data.recipient.toString()).emit('newNotification', populatedNotification);

      return populatedNotification;
    }
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};