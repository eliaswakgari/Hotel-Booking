// controllers/adminController.js
const Hotel = require("../models/Hotel");
const Booking = require("../models/Booking");
const User = require("../models/User");
const { getIO } = require('../socket');
// Enhanced dashboard metrics - FIXED for partial refunds
exports.getDashboardMetrics = async (req, res) => {
  try {
    // Basic counts
    const totalHotels = await Hotel.countDocuments();
    const totalBookings = await Booking.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });

    // ✅ FIXED: Revenue calculations that account for refunds
    const revenueAgg = await Booking.aggregate([
      { 
        $match: { 
          status: { $in: ['confirmed', 'pending'] },
          paymentStatus: { $in: ['succeeded', 'pending'] }
        } 
      },
      {
        $project: {
          totalPrice: 1,
          refundedAmount: { $ifNull: ["$refundedAmount", 0] },
          createdAt: 1,
          netRevenue: { $subtract: ["$totalPrice", { $ifNull: ["$refundedAmount", 0] }] }
        }
      },
      { 
        $group: { 
          _id: null, 
          totalRevenue: { $sum: "$netRevenue" }, // ✅ Use netRevenue instead of totalPrice
          todayRevenue: {
            $sum: {
              $cond: [
                { $eq: [{ $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, new Date().toISOString().split('T')[0]] },
                "$netRevenue", // ✅ Use netRevenue
                0
              ]
            }
          },
          monthlyRevenue: {
            $sum: {
              $cond: [
                { 
                  $and: [
                    { $gte: ["$createdAt", new Date(new Date().getFullYear(), new Date().getMonth(), 1)] },
                    { $lt: ["$createdAt", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)] }
                  ]
                },
                "$netRevenue", // ✅ Use netRevenue
                0
              ]
            }
          }
        } 
      },
    ]);

    const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
    const revenueToday = revenueAgg[0]?.todayRevenue || 0;
    const monthlyRevenue = revenueAgg[0]?.monthlyRevenue || 0;

    // Room statistics (unchanged)
    const roomStats = await Hotel.aggregate([
      { $unwind: "$rooms" },
      {
        $group: {
          _id: null,
          totalRooms: { $sum: 1 },
          availableRooms: {
            $sum: { $cond: [{ $eq: ["$rooms.status", "available"] }, 1, 0] }
          },
          occupiedRooms: {
            $sum: { $cond: [{ $eq: ["$rooms.status", "occupied"] }, 1, 0] }
          }
        }
      }
    ]);

    const totalRooms = roomStats[0]?.totalRooms || 0;
    const availableRooms = roomStats[0]?.availableRooms || 0;
    const occupiedRooms = roomStats[0]?.occupiedRooms || 0;

    // Room type distribution - FIXED to account for refunds
    const roomTypeDistribution = await Hotel.aggregate([
      { $unwind: "$rooms" },
      {
        $lookup: {
          from: "bookings",
          localField: "rooms.number",
          foreignField: "roomNumber",
          as: "roomBookings"
        }
      },
      { $unwind: { path: "$roomBookings", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "roomBookings.status": { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $group: {
          _id: "$rooms.type",
          count: { $sum: 1 },
          totalRevenue: {
            $sum: {
              $subtract: [
                "$roomBookings.totalPrice", 
                { $ifNull: ["$roomBookings.refundedAmount", 0] }
              ]
            }
          }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Booking status distribution - FIXED to account for refunds
    const bookingStats = await Booking.aggregate([
      {
        $project: {
          status: 1,
          netAmount: { $subtract: ["$totalPrice", { $ifNull: ["$refundedAmount", 0] }] }
        }
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$netAmount" } // ✅ Use netAmount
        }
      }
    ]);

    // Recent bookings (last 7 days) - FIXED to show net amount
    const recentBookings = await Booking.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .populate('user', 'name email')
    .populate('hotel', 'name')
    .sort({ createdAt: -1 })
    .limit(10);

    // Performance metrics - FIXED to use net revenue
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
    
    const avgDailyRate = totalBookings > 0 ? totalRevenue / totalBookings : 0;
    const revPAR = totalRooms > 0 ? totalRevenue / totalRooms : 0;

    const metrics = {
      // Basic metrics - NOW USING NET REVENUE
      totalHotels,
      totalBookings,
      activeUsers,
      totalRevenue, // ✅ This now includes refund deductions
      revenueToday, // ✅ This now includes refund deductions
      monthlyRevenue, // ✅ This now includes refund deductions
      
      // Room metrics
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate: Math.round(occupancyRate),
      
      // Performance metrics - NOW USING NET REVENUE
      avgDailyRate: Math.round(avgDailyRate),
      revPAR: Math.round(revPAR),
      
      // Distributions
      roomTypeDistribution,
      bookingStats,
      
      // Recent activity - FIXED to show net amount
      recentBookings: recentBookings.map(booking => ({
        id: booking._id,
        bookingId: booking.bookingId,
        user: booking.user?.name || 'N/A',
        hotel: booking.hotel?.name || 'N/A',
        amount: booking.totalPrice - (booking.refundedAmount || 0), // ✅ Show net amount
        grossAmount: booking.totalPrice,
        refundedAmount: booking.refundedAmount || 0,
        status: booking.status,
        refundStatus: booking.refundStatus,
        date: booking.createdAt
      }))
    };

    // Emit real-time dashboard update
    getIO().emit('dashboardUpdate', metrics);

    res.json(metrics);
  } catch (error) {
    console.error("Error fetching dashboard metrics:", error);
    res.status(500).json({ message: "Failed to fetch dashboard metrics", error: error.message });
  }
};
// Enhanced analytics - FIXED for partial refunds
exports.getAnalytics = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateRange = {};
    const now = new Date();
    
    switch (period) {
      case 'week':
        dateRange = {
          $gte: new Date(now.setDate(now.getDate() - 7)),
          $lte: new Date()
        };
        break;
      case 'quarter':
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth() - 3, 1),
          $lte: new Date()
        };
        break;
      case 'year':
        dateRange = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date()
        };
        break;
      default: // month
        dateRange = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date()
        };
    }

    // ✅ FIXED: Revenue trend data that accounts for refunds
    const revenueTrend = await Booking.aggregate([
      {
        $match: {
          createdAt: dateRange,
          status: { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $project: {
          createdAt: 1,
          netRevenue: { $subtract: ["$totalPrice", { $ifNull: ["$refundedAmount", 0] }] },
          bookings: { $literal: 1 }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          revenue: { $sum: "$netRevenue" }, // ✅ Use netRevenue
          bookings: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // ✅ FIXED: Hotel performance with net revenue
    const hotelPerformance = await Booking.aggregate([
      {
        $match: {
          createdAt: dateRange,
          status: { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $project: {
          hotel: 1,
          netRevenue: { $subtract: ["$totalPrice", { $ifNull: ["$refundedAmount", 0] }] },
          bookings: { $literal: 1 }
        }
      },
      {
        $group: {
          _id: "$hotel",
          revenue: { $sum: "$netRevenue" }, // ✅ Use netRevenue
          bookings: { $sum: 1 },
          avgBookingValue: { $avg: "$netRevenue" } // ✅ Use netRevenue
        }
      },
      {
        $lookup: {
          from: "hotels",
          localField: "_id",
          foreignField: "_id",
          as: "hotelInfo"
        }
      },
      { $unwind: "$hotelInfo" },
      {
        $project: {
          hotel: "$hotelInfo.name",
          revenue: 1,
          bookings: 1,
          avgBookingValue: 1
        }
      },
      { $sort: { revenue: -1 } }
    ]);

    // Room type performance (similar fixes would be needed here)
    const roomTypePerformance = await Hotel.aggregate([
      { $unwind: "$rooms" },
      {
        $lookup: {
          from: "bookings",
          localField: "rooms.number",
          foreignField: "roomNumber",
          as: "roomBookings"
        }
      },
      { $unwind: { path: "$roomBookings", preserveNullAndEmptyArrays: true } },
      {
        $match: {
          "roomBookings.createdAt": dateRange,
          "roomBookings.status": { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $project: {
          type: "$rooms.type",
          roomNumber: "$rooms.number",
          netRevenue: { 
            $subtract: [
              "$roomBookings.totalPrice", 
              { $ifNull: ["$roomBookings.refundedAmount", 0] }
            ] 
          }
        }
      },
      {
        $group: {
          _id: "$type",
          totalRevenue: { $sum: "$netRevenue" }, // ✅ Use netRevenue
          totalBookings: { $sum: 1 },
          roomCount: { $addToSet: "$roomNumber" }
        }
      },
      {
        $project: {
          roomType: "$_id",
          totalRevenue: 1,
          totalBookings: 1,
          roomCount: { $size: "$roomCount" },
          revenuePerRoom: {
            $divide: ["$totalRevenue", { $size: "$roomCount" }]
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);

    const analyticsData = {
      period,
      revenueTrend,
      hotelPerformance,
      roomTypePerformance,
      generatedAt: new Date()
    };

    // Emit analytics real-time
    getIO().emit('analyticsUpdate', analyticsData);

    res.json(analyticsData);
  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Failed to fetch analytics", error: error.message });
  }
};
// Real-time metrics for dashboard - FIXED for partial refunds
exports.getRealtimeMetrics = async (req, res) => {
  try {
    // Current day bookings and revenue
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayMetrics = await Booking.aggregate([
      {
        $match: {
          createdAt: { $gte: todayStart, $lte: todayEnd },
          status: { $in: ['confirmed', 'pending'] }
        }
      },
      {
        $project: {
          netRevenue: { $subtract: ["$totalPrice", { $ifNull: ["$refundedAmount", 0] }] },
          bookings: { $literal: 1 }
        }
      },
      {
        $group: {
          _id: null,
          todayBookings: { $sum: 1 },
          todayRevenue: { $sum: "$netRevenue" } // ✅ Use netRevenue
        }
      }
    ]);

    // Pending actions
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const pendingRefunds = await Booking.countDocuments({ refundStatus: 'pending' });

    const realtimeMetrics = {
      todayBookings: todayMetrics[0]?.todayBookings || 0,
      todayRevenue: todayMetrics[0]?.todayRevenue || 0, // ✅ Now includes refund deductions
      pendingBookings,
      pendingRefunds,
      lastUpdated: new Date()
    };

    res.json(realtimeMetrics);
  } catch (error) {
    console.error("Error fetching realtime metrics:", error);
    res.status(500).json({ message: "Failed to fetch realtime metrics", error: error.message });
  }
};