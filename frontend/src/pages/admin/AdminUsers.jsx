// src/pages/admin/AdminUsers.jsx
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, updateUserRole, toggleUserBan, verifyPayment, clearError } from "../../features/users/usersSlice";
import AdminLayout from "../../layouts/AdminLayout";
import { FaSync, FaExclamationTriangle, FaUser, FaBan, FaCheckCircle } from "react-icons/fa";
import Swal from "sweetalert2";

const AdminUsers = () => {
  const dispatch = useDispatch();
  const { users, loading, error } = useSelector((state) => state.users);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    console.log("🔄 AdminUsers component mounted, fetching users...");
    dispatch(fetchUsers());
  }, [dispatch]);

  useEffect(() => {
    if (error) {
      console.error("❌ Error in AdminUsers:", error);
      Swal.fire({
        title: "Error",
        text: error,
        icon: "error",
        confirmButtonText: "OK"
      }).then(() => {
        dispatch(clearError());
      });
    }
  }, [error, dispatch]);

  const handleRoleChange = async (user, newRole) => {
    try {
      await dispatch(updateUserRole({ id: user._id, role: newRole })).unwrap();
      Swal.fire("Success", `${user.name} is now a ${newRole}`, "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to update user role", "error");
    }
  };

  const handleToggleBan = async (user) => {
    try {
      await dispatch(toggleUserBan({ id: user._id })).unwrap();
      Swal.fire("Success", `${user.name} has been ${user.banned ? "unbanned" : "banned"}`, "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to update user status", "error");
    }
  };

  const handleVerifyPayment = async (user) => {
    try {
      await dispatch(verifyPayment({ id: user._id })).unwrap();
      Swal.fire("Success", `Payment for ${user.name} verified`, "success");
    } catch (error) {
      Swal.fire("Error", error.message || "Failed to verify payment", "error");
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    dispatch(fetchUsers());
  };

  if (loading && users.length === 0) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center min-h-96">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading users...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we fetch user data</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto">
        {/* Header - Removed Add User button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
            <p className="text-gray-600">Manage user roles, permissions, and status</p>
          </div>
          <button
            onClick={handleRetry}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:bg-gray-400 transition"
          >
            <FaSync className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3">
              <FaExclamationTriangle className="text-red-500 text-xl" />
              <div>
                <h3 className="text-red-800 font-semibold">Failed to load users</h3>
                <p className="text-red-700">{error}</p>
                <button
                  onClick={handleRetry}
                  className="mt-2 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          {users.length === 0 && !loading ? (
            <div className="text-center py-12">
              <FaUser className="text-gray-400 text-4xl mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Users Found</h3>
              <p className="text-gray-600 mb-4">There are no users to display at the moment.</p>
              <button
                onClick={handleRetry}
                className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Refresh Users
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bookings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                            {user.name?.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              Joined {new Date(user.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.email}</div>
                        <div className="text-sm text-gray-500">{user.phone || 'No phone'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className="text-sm border border-gray-300 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.bookingsCount || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.paymentVerified ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <FaCheckCircle />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          user.banned 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {user.banned ? <FaBan /> : <FaUser />}
                          {user.banned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {!user.paymentVerified && (
                          <button
                            onClick={() => handleVerifyPayment(user)}
                            className="bg-green-500 text-white px-3 py-1 rounded text-sm hover:bg-green-600 transition"
                          >
                            Verify Payment
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleBan(user)}
                          className={`px-3 py-1 rounded text-sm text-white transition ${
                            user.banned 
                              ? "bg-blue-500 hover:bg-blue-600" 
                              : "bg-red-500 hover:bg-red-600"
                          }`}
                        >
                          {user.banned ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Debug Info */}
        <div className="mt-4 text-xs text-gray-500 bg-gray-100 p-3 rounded-lg">
          <p><strong>Debug Info:</strong> Loaded {users.length} users | Retry count: {retryCount}</p>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;