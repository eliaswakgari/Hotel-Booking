const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, enum: ["guest", "admin"], default: "guest" },
  banned: { type: Boolean, default: false },
  bookings: { type: Number, default: 0 },
  paymentVerified: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("Userr", userSchema);
