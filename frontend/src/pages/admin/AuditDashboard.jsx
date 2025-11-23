import React, { useEffect } from "react";
import AdminLayout from "../../layouts/AdminLayout.jsx";
import { useDispatch, useSelector } from "react-redux";
import { fetchAuditMetrics } from "../../features/audit/auditSlice.js";
import { io } from "socket.io-client";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const AuditDashboard = () => {
  const dispatch = useDispatch();
  const { metrics, loading } = useSelector((state) => state.audit);

  useEffect(() => {
    dispatch(fetchAuditMetrics());

    const socket = io(import.meta.env.VITE_BACKEND_URL || "http://localhost:5000");
    socket.on("auditUpdate", () => {
      dispatch(fetchAuditMetrics());
    });
    return () => socket.disconnect();
  }, [dispatch]);

  if (loading)
    return (
      <AdminLayout>
        <p className="text-center text-gray-500 mt-10">Loading audit data...</p>
      </AdminLayout>
    );

  const chartData = [
    {
      name: "Today",
      Revenue: metrics.day?.totalRevenue || 0,
      Bookings: metrics.day?.totalBookings || 0,
    },
    {
      name: "This Week",
      Revenue: metrics.week?.totalRevenue || 0,
      Bookings: metrics.week?.totalBookings || 0,
    },
    {
      name: "This Month",
      Revenue: metrics.month?.totalRevenue || 0,
      Bookings: metrics.month?.totalBookings || 0,
    },
    {
      name: "This Year",
      Revenue: metrics.year?.totalRevenue || 0,
      Bookings: metrics.year?.totalBookings || 0,
    },
  ];

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold mb-6">Booking Audit & Revenue Analysis</h1>

      <div className="bg-white p-6 rounded-xl shadow-md">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Revenue" fill="#8884d8" />
            <Bar dataKey="Bookings" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </AdminLayout>
  );
};

export default AuditDashboard;
