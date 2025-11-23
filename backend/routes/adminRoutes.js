// routes/admin.js
const express = require("express");
const router = express.Router();
const { 
  getAnalytics, 
  getDashboardMetrics, 
  getRealtimeMetrics 
} = require("../controllers/adminController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/dashboard-metrics", protect, admin, getDashboardMetrics);
router.get("/analytics", protect, admin, getAnalytics);
router.get("/realtime-metrics", protect, admin, getRealtimeMetrics);

module.exports = router;