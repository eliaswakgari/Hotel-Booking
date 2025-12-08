import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchUsers,
  updateUserRole,
  toggleUserBan,
  verifyPayment,
} from "../../features/users/usersSlice";
import AdminLayout from "../../layouts/AdminLayout";
import Swal from "sweetalert2";
import { motion } from "framer-motion";

const UsersManagement = () => {
  const dispatch = useDispatch();
  const { users, loading } = useSelector((state) => state.users);
  const [editingUser, setEditingUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const openEditModal = (user) => {
    setEditingUser(user);
    setRole(user.role);
  };

  const closeModal = () => setEditingUser(null);

  const handleSaveRole = async () => {
    await dispatch(updateUserRole({ id: editingUser._id, role })).unwrap();
    Swal.fire("Success", `${editingUser.name}'s role updated to ${role}`, "success");
    closeModal();
  };

  const handleToggleBan = async (user) => {
    await dispatch(toggleUserBan({ id: user._id })).unwrap();
    Swal.fire(
      "Success",
      `${user.name} has been ${user.banned ? "unbanned" : "banned"}`,
      "success"
    );
  };

  const handleVerifyPayment = async (user) => {
    await dispatch(verifyPayment({ id: user._id })).unwrap();
    Swal.fire("Success", `Payment for ${user.name} verified`, "success");
  };

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-6xl mx-auto bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">User Management</h2>
          <button
            onClick={() => Swal.fire("Info", "Feature coming soon!", "info")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
          >
            + Add User
          </button>
        </div>

        {loading ? (
          <p className="text-gray-500">Loading users...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-[900px] w-full border rounded-lg text-sm">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Bookings</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <motion.tr
                    key={user._id}
                    className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <td className="p-3">{user.name}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>

                    {/* ✅ FIX: safely display bookings */}
                    <td>
                      {Array.isArray(user.bookings)
                        ? user.bookings.length
                        : typeof user.bookings === "object"
                          ? JSON.stringify(user.bookings)
                          : user.bookings || "N/A"}
                    </td>

                    <td>{user.paymentVerified ? "✅" : "❌"}</td>
                    <td>{user.banned ? "Banned" : "Active"}</td>

                    <td className="flex justify-center gap-2">
                      {!user.paymentVerified && (
                        <button
                          onClick={() => handleVerifyPayment(user)}
                          className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                        >
                          Verify
                        </button>
                      )}
                      <button
                        onClick={() => openEditModal(user)}
                        className="bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleBan(user)}
                        className={`px-2 py-1 rounded text-white ${user.banned
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-red-500 hover:bg-red-600"
                          }`}
                      >
                        {user.banned ? "Unban" : "Ban"}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Role Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg w-80"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
            >
              <h3 className="text-xl font-semibold mb-4">
                Edit Role: {editingUser.name}
              </h3>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full p-2 border rounded mb-4 dark:bg-gray-700 dark:border-gray-600"
              >
                <option value="guest">Guest</option>
                <option value="admin">Admin</option>
              </select>
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveRole}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition"
                >
                  Save
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AdminLayout>
  );
};

export default UsersManagement;
