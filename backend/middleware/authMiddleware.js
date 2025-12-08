const jwt = require('jsonwebtoken');
const User = require('../models/User');
const asyncHandler = require('express-async-handler');

exports.protect = asyncHandler(async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    // Fallback: allow Bearer token from Authorization header if cookie is missing
    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.banned) return res.status(403).json({ message: 'Your account is banned' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Not authorized or session expired' });
  }
});



exports.admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') next();
  else {
    res.status(403);
    throw new Error('Admin access only');
  }
};
