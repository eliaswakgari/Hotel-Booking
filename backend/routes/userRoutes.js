const express = require("express");
const router = express.Router();
const {
  getAllUsers,
  updateUserRole,
  toggleUserBan,
  verifyPayment,
} = require("../controllers/userController");
const { protect, admin } = require("../middleware/authMiddleware");
// Example: protect with middleware if you want admin-only access
// const { protect, isAdmin } = require("../middleware/authMiddleware");

router.get("/",protect,admin,getAllUsers);
router.put("/:id/role",protect,admin, updateUserRole);
router.put("/:id/ban",protect,admin, toggleUserBan);
router.put("/:id/verify-payment",protect,admin, verifyPayment);

module.exports = router;
