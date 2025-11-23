const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },

    role: { type: String, enum: ["guest", "admin"], default: "guest" },
    googleId: { type: String },

    phone: { type: String },
    profileImage: {
      type: String,
      default: "",
    },

    // ✅ Add these fields for password reset
    resetPasswordToken: String,
    resetPasswordExpire: Date,

    banned: { type: Boolean, default: false },
    paymentVerified: { type: Boolean, default: false },

    bookings: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],

    // ✅ Used for active user analytics
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);