const User = require("../models/User");

// ✅ Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate("bookings"); // optional populate for booking count
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching users" });
  }
};

// ✅ Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(id, { role }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error updating role" });
  }
};

// ✅ Toggle ban / unban
exports.toggleUserBan = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.banned = !user.banned;
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error toggling ban" });
  }
};

// ✅ Verify payment
exports.verifyPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { paymentVerified: true }, { new: true });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error verifying payment" });
  }
};
