import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import AdminLayout from "../../../layouts/AdminLayout";
import { fetchAnalytics } from "./analyticsSlice";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";
import { AiOutlineArrowUp, AiOutlineArrowDown } from "react-icons/ai";

const AdminAnalytics = () => {
  const dispatch = useDispatch();
  const { data: analyticsData = [], loading, error } = useSelector(
    (state) => state.analytics
  );

  useEffect(() => {
    dispatch(fetchAnalytics());
  }, [dispatch]);

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff6b6b"];

  // ✅ SAFE: Validate analyticsData is an array before using reduce
  const safeAnalyticsData = useMemo(() => {
    if (!analyticsData || !Array.isArray(analyticsData)) {
      console.warn('analyticsData is not an array:', analyticsData);
      return [];
    }
    return analyticsData;
  }, [analyticsData]);

  // ✅ SAFE: Compute metrics with validation
  const totalRevenue = useMemo(
    () => safeAnalyticsData.reduce((acc, hotel) => acc + (hotel?.revenue || 0), 0),
    [safeAnalyticsData]
  );

  const totalBookings = useMemo(
    () => safeAnalyticsData.reduce((acc, hotel) => acc + (hotel?.bookings || 0), 0),
    [safeAnalyticsData]
  );

  const topHotel = useMemo(() => {
    if (safeAnalyticsData.length === 0) return "N/A";
    const top = [...safeAnalyticsData].reduce((prev, current) =>
      (prev?.revenue || 0) > (current?.revenue || 0) ? prev : current
    );
    return top?.hotel || "N/A";
  }, [safeAnalyticsData]);

  const sortedHotels = useMemo(
    () => [...safeAnalyticsData].sort((a, b) => (b?.revenue || 0) - (a?.revenue || 0)),
    [safeAnalyticsData]
  );

  // ✅ Function to format pie slice labels as percentages
  const renderCustomizedLabel = ({ percent }) =>
    `${(percent * 100).toFixed(1)}%`;

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-red-500 text-4xl mb-4">❌</div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Analytics</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => dispatch(fetchAnalytics())}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            Retry
          </button>
        </div>
      </AdminLayout>
    );
  }

  // Check if we have data to display
  const hasData = safeAnalyticsData.length > 0;

  return (
    <AdminLayout>
      <h2 className="text-2xl font-bold mb-6">Analytics & Dashboard</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <KpiCard
          title="Total Revenue"
          value={`$${totalRevenue.toLocaleString()}`}
          color="text-blue-600"
        />
        <KpiCard
          title="Total Bookings"
          value={totalBookings.toLocaleString()}
          color="text-green-600"
        />
        <KpiCard
          title="Top Hotel"
          value={topHotel}
          color="text-purple-600"
        />
      </div>

      {!hasData ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-md">
          <div className="text-gray-400 text-4xl mb-4">📊</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No Analytics Data Available
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            There is no analytics data to display at the moment.
          </p>
        </div>
      ) : (
        <>
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Bar Chart */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5">
              <h3 className="font-semibold mb-3">Revenue & Bookings per Hotel</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={safeAnalyticsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hotel" />
                  <YAxis />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`$${value.toLocaleString()}`, 'Revenue'];
                      if (name === 'bookings') return [value.toLocaleString(), 'Bookings'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#8884d8" name="Revenue" />
                  <Bar dataKey="bookings" fill="#82ca9d" name="Bookings" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pie Chart with Percentages */}
            <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 flex flex-col items-center">
              <h3 className="font-semibold mb-3">Revenue Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={safeAnalyticsData}
                    dataKey="revenue"
                    nameKey="hotel"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={renderCustomizedLabel}
                  >
                    {safeAnalyticsData.map((entry, index) => (
                      <Cell
                        key={`cell-${entry?.hotel || index}-${index}`}
                        fill={COLORS[index % COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value, name) => {
                      const total = safeAnalyticsData.reduce((acc, h) => acc + (h?.revenue || 0), 0);
                      const percent = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                      return [`$${value.toLocaleString()} (${percent}%)`, name];
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Performing Hotels Table */}
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 overflow-x-auto">
            <h3 className="font-semibold mb-4">Top Performing Hotels</h3>
            <table className="min-w-[700px] w-full table-auto border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                  <th className="px-4 py-2 border-b">Hotel</th>
                  <th className="px-4 py-2 border-b">Revenue</th>
                  <th className="px-4 py-2 border-b">Bookings</th>
                  <th className="px-4 py-2 border-b">Growth</th>
                </tr>
              </thead>
              <tbody>
                {sortedHotels.map((hotel, index) => (
                  <tr
                    key={`${hotel?.hotel || index}-${index}`}
                    className="bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <td className="px-4 py-2">{hotel?.hotel || "Unknown Hotel"}</td>
                    <td className="px-4 py-2">${(hotel?.revenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-2">{(hotel?.bookings || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 flex items-center gap-1">
                      {(hotel?.growth || 0) >= 0 ? (
                        <AiOutlineArrowUp className="text-green-500" />
                      ) : (
                        <AiOutlineArrowDown className="text-red-500" />
                      )}
                      <span className={`font-semibold ${(hotel?.growth || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {hotel?.growth || 0}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </AdminLayout>
  );
};

// ✅ Small reusable KPI card component
const KpiCard = ({ title, value, color }) => (
  <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl p-5 flex flex-col items-start">
    <h3 className="text-gray-600 dark:text-gray-300 text-sm font-medium">{title}</h3>
    <p className={`text-2xl font-bold ${color} mt-2`}>{value}</p>
  </div>
);

export default AdminAnalytics;