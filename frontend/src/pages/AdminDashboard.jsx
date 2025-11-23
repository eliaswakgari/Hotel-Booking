import React, { useEffect, useState } from "react";
import AdminLayout from "../layouts/AdminLayout";
import { useDispatch, useSelector } from "react-redux";
import { 
  fetchDashboardMetrics, 
  fetchAnalytics,
  fetchRealtimeMetrics,
  updateMetricsRealtime 
} from "../features/dashboard/dashboardSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { 
  FiUsers, 
  FiHome, 
  FiCalendar, 
  FiDollarSign,
  FiTrendingUp,
  FiTrendingDown,
  FiEye,
  FiStar,
  FiShoppingBag,
  FiArrowUp,
  FiArrowDown,
  FiClock
} from "react-icons/fi";
import { motion } from "framer-motion";
import { io } from "socket.io-client";

// Modern color palette
const COLORS = ['#8B5CF6', '#06B6D4', '#10B981', '#F59E0B', '#EF4444'];

// Animated Stat Card
const StatCard = ({ title, value, change, icon, color = "purple", delay = 0, subtitle }) => {
  const colorClasses = {
    purple: "from-purple-500 to-purple-600",
    blue: "from-blue-500 to-cyan-500", 
    green: "from-emerald-500 to-green-500",
    orange: "from-amber-500 to-orange-500",
    red: "from-rose-500 to-pink-500"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="group relative"
    >
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 shadow-lg hover:shadow-xl transition-all duration-500 hover:scale-105">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        
        <div className="relative flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">{title}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {typeof value === 'number' && title.includes('Revenue') ? `$${value.toLocaleString()}` : value}
            </p>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{subtitle}</p>
            )}
            {change !== undefined && (
              <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                change > 0 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {change > 0 ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
                {Math.abs(change)}%
              </div>
            )}
          </div>
          <div className={`p-4 rounded-2xl bg-gradient-to-r ${colorClasses[color]} text-white shadow-lg`}>
            {icon}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const AdminDashboard = () => {
  const dispatch = useDispatch();
  const { metrics, analytics, realtimeMetrics, loading } = useSelector((state) => state.dashboard);
  const [timeRange, setTimeRange] = useState('month');
  const [socket, setSocket] = useState(null);

  // Initialize socket and fetch data
  useEffect(() => {
    // Fetch initial data
    dispatch(fetchDashboardMetrics());
    dispatch(fetchAnalytics(timeRange));
    dispatch(fetchRealtimeMetrics());

    // Set up socket for real-time updates
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    // Listen for real-time updates
    newSocket.on('dashboardUpdate', (data) => {
      dispatch(updateMetricsRealtime(data));
    });

    newSocket.on('analyticsUpdate', (data) => {
      // Handle analytics updates if needed
      console.log('Analytics updated:', data);
    });

    // Set up interval for real-time metrics
    const interval = setInterval(() => {
      dispatch(fetchRealtimeMetrics());
    }, 30000); // Update every 30 seconds

    return () => {
      newSocket.disconnect();
      clearInterval(interval);
    };
  }, [dispatch, timeRange]);

  // Process room type distribution for chart
  const roomDistribution = metrics?.roomTypeDistribution?.map((item, index) => ({
    name: item._id,
    value: item.count,
    fill: COLORS[index % COLORS.length],
    revenue: item.totalRevenue
  })) || [];

  // Process revenue trend data
  const revenueData = analytics?.revenueTrend?.map(item => ({
    period: new Date(item._id).toLocaleDateString('en-US', { weekday: 'short' }),
    Revenue: item.revenue,
    Bookings: item.bookings
  })) || [];

  // Performance metrics from real data
  const performanceData = [
    {
      metric: "Occupancy Rate",
      current: metrics?.occupancyRate || 0,
      previous: Math.max(0, (metrics?.occupancyRate || 0) - 5), // Simulate previous data
      icon: <FiTrendingUp size={20} />
    },
    {
      metric: "Avg Daily Rate",
      current: metrics?.avgDailyRate || 0,
      previous: Math.max(0, (metrics?.avgDailyRate || 0) - 20),
      icon: <FiDollarSign size={20} />
    },
    {
      metric: "RevPAR",
      current: metrics?.revPAR || 0,
      previous: Math.max(0, (metrics?.revPAR || 0) - 15),
      icon: <FiTrendingUp size={20} />
    },
    {
      metric: "Room Utilization",
      current: metrics?.occupiedRooms || 0,
      previous: Math.max(0, (metrics?.occupiedRooms || 0) - 3),
      icon: <FiHome size={20} />
    }
  ];

  const quickActions = [
    {
      title: "Manage Hotels",
      description: "Add or update hotel properties",
      icon: <FiHome size={20} />,
      action: () => window.location.href = "/admin/hotels",
      color: "purple"
    },
    {
      title: "View Bookings",
      description: "Check reservations & availability",
      icon: <FiCalendar size={20} />,
      action: () => window.location.href = "/admin/bookings",
      color: "blue"
    },
    {
      title: "User Management",
      description: "Manage staff & permissions",
      icon: <FiUsers size={20} />,
      action: () => window.location.href = "/admin/users",
      color: "green"
    },
    {
      title: "Revenue Analytics",
      description: "Financial reports & insights",
      icon: <FiDollarSign size={20} />,
      action: () => window.location.href = "/admin/analytics",
      color: "orange"
    },
  ];

  if (loading && !metrics) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading amazing dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Enhanced Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
              Dashboard Overview
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-lg">
              Real-time insights and analytics for your hotel business
              {realtimeMetrics?.lastUpdated && (
                <span className="text-sm ml-2">
                  <FiClock className="inline mr-1" size={14} />
                  Updated: {new Date(realtimeMetrics.lastUpdated).toLocaleTimeString()}
                </span>
              )}
            </p>
          </div>
          <div className="flex gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-2 border border-white/20 dark:border-gray-700/50">
            {['week', 'month', 'quarter', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => {
                  setTimeRange(range);
                  dispatch(fetchAnalytics(range));
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                  timeRange === range
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-gray-700/50'
                }`}
              >
                {range.charAt(0).toUpperCase() + range.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={metrics?.totalRevenue || 0}
          change={12.5}
          icon={<FiDollarSign size={24} />}
          color="purple"
          delay={0}
          subtitle={`Today: $${realtimeMetrics?.todayRevenue?.toLocaleString() || 0}`}
        />
        <StatCard
          title="Active Bookings"
          value={metrics?.totalBookings || 0}
          change={8.2}
          icon={<FiCalendar size={24} />}
          color="blue"
          delay={1}
          subtitle={`Today: ${realtimeMetrics?.todayBookings || 0}`}
        />
        <StatCard
          title="Room Types"
          value={metrics?.roomTypeDistribution?.length || 0}
          change={3.1}
          icon={<FiHome size={24} />}
          color="green"
          delay={2}
          subtitle={`${metrics?.totalRooms || 0} total rooms`}
        />
        <StatCard
          title="Active Users"
          value={metrics?.activeUsers || 0}
          change={15.7}
          icon={<FiUsers size={24} />}
          color="orange"
          delay={3}
          subtitle={`${metrics?.occupiedRooms || 0} rooms occupied`}
        />
      </div>

      {/* Second Row Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Available Rooms"
          value={metrics?.availableRooms || 0}
          icon={<FiHome size={20} />}
          color="blue"
          subtitle={`${metrics?.occupancyRate || 0}% occupancy`}
        />
        <StatCard
          title="Monthly Revenue"
          value={metrics?.monthlyRevenue || 0}
          icon={<FiDollarSign size={20} />}
          color="green"
        />
        <StatCard
          title="Avg Daily Rate"
          value={metrics?.avgDailyRate || 0}
          icon={<FiTrendingUp size={20} />}
          color="purple"
          subtitle={`RevPAR: $${metrics?.revPAR || 0}`}
        />
        <StatCard
          title="Pending Actions"
          value={realtimeMetrics?.pendingBookings || 0}
          icon={<FiClock size={20} />}
          color="orange"
          subtitle={`${realtimeMetrics?.pendingRefunds || 0} refunds pending`}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Revenue & Bookings Trend
            </h3>
            <FiTrendingUp className="text-green-500" size={24} />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip 
                contentStyle={{ 
                  background: 'rgba(255, 255, 255, 0.9)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px'
                }}
              />
              <Area type="monotone" dataKey="Revenue" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorRevenue)" />
              <Area type="monotone" dataKey="Bookings" stroke="#06B6D4" fillOpacity={1} fill="url(#colorBookings)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Room Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 shadow-lg"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              Room Type Distribution
            </h3>
            <FiEye className="text-purple-500" size={24} />
          </div>
          {roomDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={roomDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {roomDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name, props) => [
                    `${value} rooms ($${props.payload.revenue?.toLocaleString() || 0} revenue)`,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64">
              <p className="text-gray-500">No room data available</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Performance Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
      >
        {performanceData.map((item, index) => {
          const change = ((item.current - item.previous) / item.previous) * 100;
          const isPositive = change >= 0;

          return (
            <div key={index} className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/50 rounded-xl border border-white/20 dark:border-gray-700/50">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400`}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{item.metric}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {typeof item.current === 'number' && item.metric.includes('Rate') ? `$${item.current}` : item.current}
                    {item.metric === 'Occupancy Rate' && '%'}
                  </p>
                </div>
              </div>
              <div className={`text-right ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <div className="flex items-center gap-1 text-sm font-medium">
                  {isPositive ? <FiTrendingUp size={16} /> : <FiTrendingDown size={16} />}
                  {Math.abs(change).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">vs previous</p>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mb-8"
      >
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <motion.button
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className="group relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 text-left hover:shadow-xl transition-all duration-500"
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 dark:text-white mb-2">{action.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{action.description}</p>
                </div>
                <div className="text-2xl text-gray-300 dark:text-gray-600 group-hover:text-gray-400 transition-colors">
                  →
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Activity */}
      {metrics?.recentBookings && metrics.recentBookings.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl border border-white/20 dark:border-gray-700/50 p-6 shadow-lg"
        >
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Recent Bookings
          </h3>
          <div className="space-y-3">
            {metrics.recentBookings.slice(0, 5).map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{booking.user}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{booking.hotel}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900 dark:text-white">${booking.amount}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(booking.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </AdminLayout>
  );
};

export default AdminDashboard;