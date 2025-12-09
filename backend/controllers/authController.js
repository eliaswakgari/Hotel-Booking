const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

const hasHostedClient = !!(process.env.CLIENT_URL && process.env.CLIENT_URL.startsWith('https://'));

const authCookieOptions = {
  httpOnly: true,
  secure: hasHostedClient,
  sameSite: hasHostedClient ? 'none' : 'lax',
};

// ---------------- REGISTER ----------------
exports.registerUser = asyncHandler(async (req, res) => {
  // ✅ Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please check your input',
      errors: errors.array()
    });
  }

  const { name, email, password } = req.body;

  const userExists = await User.findOne({ email });
  if (userExists) {
    return res.status(400).json({
      success: false,
      message: "User already exists"
    });
  }

  // ✅ Generate initials from full name
  const nameParts = name.trim().split(' ');
  const initials = nameParts.length >= 2 
    ? `${nameParts[0][0]}${nameParts[nameParts.length-1][0]}`.toUpperCase()
    : nameParts[0].substring(0, 2).toUpperCase();
  
  const avatarUrl = `https://ui-avatars.com/api/?name=${initials}&background=random&size=128`;

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
    profileImage: avatarUrl,
  });

  const token = generateToken(user);
  res.cookie("token", token, authCookieOptions);

  res.status(201).json({
    success: true,
    message: 'Registration successful!',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      token,
    }
  });
});

// ---------------- LOGIN ----------------
exports.loginUser = asyncHandler(async (req, res) => {
  // ✅ Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please check your input',
      errors: errors.array()
    });
  }

  const { email, password } = req.body;
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  
  // 🚫 Check if user exists and is banned
  if (!user) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }
  
  if (user.banned) {
    return res.status(403).json({
      success: false,
      message: "Your account has been banned. Please contact support."
    });
  }
  
  if (!(await user.matchPassword(password))) {
    return res.status(401).json({
      success: false,
      message: 'Invalid credentials'
    });
  }

  const token = generateToken(user);
  res.cookie("token", token, authCookieOptions);

  res.json({
    success: true,
    message: 'Login successful!',
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
      token,
    }
  });
});

// ---------------- UPDATE PROFILE ----------------
exports.updateProfile = asyncHandler(async (req, res) => {
  // ✅ Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please check your input',
      errors: errors.array()
    });
  }

  console.log("Updating profile for user:", req.user?._id);
  console.log("Request body:", req.body);

  const user = await User.findById(req.user._id);
  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found"
    });
  }

  // ✅ Check if email is already taken by another user
  if (req.body.email && req.body.email !== user.email) {
    const emailExists = await User.findOne({ 
      email: req.body.email.toLowerCase().trim(), 
      _id: { $ne: user._id } 
    });
    if (emailExists) {
      return res.status(400).json({
        success: false,
        message: 'Email already taken. Please use a different email.'
      });
    }
  }

  user.name = req.body.name ? req.body.name.trim() : user.name;
  user.email = req.body.email ? req.body.email.toLowerCase().trim() : user.email;
  
  if (req.body.profileImage) {
    user.profileImage = req.body.profileImage;
  }

  const updatedUser = await user.save();

  res.json({
    success: true,
    message: 'Profile updated successfully!',
    data: {
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
    }
  });
});

// ---------------- LOGOUT ----------------
exports.logoutUser = asyncHandler(async (req, res) => {
  res.cookie('token', '', {
    ...authCookieOptions,
    expires: new Date(0),
  });
  res.json({ 
    success: true,
    message: 'Logged out successfully' 
  });
});

// ---------------- PROFILE ----------------
exports.getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }
  res.json({
    success: true,
    data: user
  });
});

// ---------------- CHANGE PASSWORD ----------------
exports.changePassword = asyncHandler(async (req, res) => {
  // ✅ Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please check your input',
      errors: errors.array()
    });
  }

  const user = await User.findById(req.user._id);
  const { oldPassword, newPassword } = req.body;

  if (!user) {
    return res.status(404).json({
      success: false,
      message: 'User not found'
    });
  }

  // ✅ Use the model's matchPassword method
  const isMatch = await user.matchPassword(oldPassword);
  if (!isMatch) {
    return res.status(400).json({
      success: false,
      message: 'Current password is incorrect'
    });
  }

  // ✅ Check if new password is same as old password
  if (await user.matchPassword(newPassword)) {
    return res.status(400).json({
      success: false,
      message: 'New password cannot be the same as current password'
    });
  }

  // ✅ Simply set the new password - the pre-save hook will hash it
  user.password = newPassword;
  await user.save();

  res.json({ 
    success: true,
    message: 'Password updated successfully' 
  });
});

// ---------------- FORGOT PASSWORD ----------------
// ---------------- FORGOT PASSWORD ----------------
// ---------------- FORGOT PASSWORD ----------------
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  console.log("Forgot password request for:", email);
  
  // ✅ Basic email validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({
      success: false,
      message: 'Please enter a valid email address',
      errors: [{ path: 'email', msg: 'Please enter a valid email address' }]
    });
  }

  let user;

  try {
    user = await User.findOne({ email: email.toLowerCase().trim() });
    
    console.log("User found:", user ? "Yes" : "No");
    
    // ✅ Don't reveal that email doesn't exist for security
    if (!user) {
      return res.json({
        success: true,
        message: 'If an account with that email exists, a reset link has been sent.'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 mins
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
    console.log("Reset URL:", resetUrl);

    const message = `
      You requested a password reset for your account.
      
      Reset your password using this link: 
      ${resetUrl}
      
      This link will expire in 10 minutes.
      
      If you didn't request this, please ignore this email.
      
      Best regards,
      HotelBooking Team
    `;

    const htmlMessage = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #3B82F6;">Password Reset Request</h2>
        <p>You requested a password reset for your HotelBooking account.</p>
        <p>Click the button below to reset your password:</p>
        <a href="${resetUrl}" 
           style="display: inline-block; background: #3B82F6; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p><small>This link will expire in 10 minutes.</small></p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280;">Best regards,<br>HotelBooking Team</p>
      </div>
    `;

    console.log("Attempting to send email...");
    await sendEmail({
      to: user.email,
      subject: "Password Reset Request - HotelBooking",
      text: message,
      html: htmlMessage,
    });

    console.log("✅ Email sent successfully");
    res.json({ 
      success: true,
      message: "Password reset link sent to your email" 
    });

  } catch (err) {
    console.error('❌ Forgot password error:', err.message);
    
    // ✅ Reset token if email failed and user exists
    if (user) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
    }

    res.status(500).json({ 
      success: false,
      message: "Unable to send email. Please try again later."
    });
  }
});

// ---------------- RESET PASSWORD ----------------
exports.resetPassword = asyncHandler(async (req, res) => {
  // ✅ Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Please check your input',
      errors: errors.array()
    });
  }

  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: "Invalid or expired token"
    });
  }

  // ✅ Simply set the new password - the pre-save hook will hash it
  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  const token = generateToken(user);
  res.cookie('token', token, authCookieOptions);
  
  res.json({ 
    success: true,
    message: "Password reset successful! You can now login with your new password.", 
    data: { user } 
  });
});