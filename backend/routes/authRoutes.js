const express = require('express');
const router = express.Router();
const passport = require('../config/passport');
const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword
} = require('../controllers/authController');
const { 
  registerValidator, 
  loginValidator, 
  changePasswordValidator,
  resetPasswordValidator,
  updateProfileValidator  // Import the new validator
} = require('../utils/validators');
const { protect } = require('../middleware/authMiddleware');
const { upload } = require('../middleware/uploadMiddleware');
const generateToken = require('../utils/generateToken');

const CLIENT_URL = process.env.CLIENT_URL || 'https://hotel-booking-blue.vercel.app';

// Auth routes
router.post('/register', registerValidator, registerUser);
router.post('/login', loginValidator, loginUser);
router.post('/logout', logoutUser);

// Profile routes
router.get('/profile', protect, getProfile);
router.put("/profile", protect, updateProfileValidator, updateProfile); // Add validation
router.put('/change-password', protect, changePasswordValidator, changePassword);

// Forgot / Reset password
router.post("/forgot-password", forgotPassword);
router.put("/reset-password/:token", resetPasswordValidator, resetPassword);

// Upload route
router.post('/upload', protect, upload.single('image'), (req, res) => {
  if (!req.file || !req.file.path) return res.status(400).json({ 
    success: false,
    message: "No image uploaded" 
  });
  res.json({ 
    success: true,
    imageUrl: req.file.path 
  });
});

// Google OAuth routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = generateToken(req.user);
    res.cookie('token', token, {
  httpOnly: true,
  secure: true,          // REQUIRED for Render + Vercel
  sameSite: 'none'       // REQUIRED for cross-domain cookies
});

    res.send(`
      <script>
        const user = ${JSON.stringify(req.user.toObject ? req.user.toObject() : req.user)};
        window.opener.postMessage({ user, token: "${token}" }, "${CLIENT_URL}");
        window.close();
      </script>
    `);
  }
);

module.exports = router;