// backend/routes/auditRoutes.js
const express = require("express");
const router = express.Router();
const Booking = require("../models/Booking");
const asyncHandler = require("express-async-handler");

// Utility to get start of periods
const getStartOfPeriod = (unit) => {
  const now = new Date();
  switch (unit) {
    case "day": return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(now.getFullYear(), now.getMonth(), diff);
    }
    case "month": return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year": return new Date(now.getFullYear(), 0, 1);
    default: return now;
  }
};

// @route   GET /api/audit
// @desc    Get booking audit metrics
router.get("/", asyncHandler(async (req, res) => {
  const periods = ["day", "week", "month", "year"];
  const data = {};

  for (const period of periods) {
    const start = getStartOfPeriod(period);
    const bookings = await Booking.find({ createdAt: { $gte: start } });
    const revenue = bookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
    data[period] = {
      totalBookings: bookings.length,
      totalRevenue: revenue,
    };
  }

  res.json(data);
}));

module.exports = router;
