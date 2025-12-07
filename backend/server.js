const dotenv = require('dotenv');
dotenv.config();
const express = require('express');
const http = require('http');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorMiddleware');
const passport = require('passport');
require('./config/passport'); // Passport config

// Routes
const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const auditRoutes = require("./routes/auditRoutes");
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
// Stripe webhook must come before express.json()
app.use('/api/webhooks', webhookRoutes);
// ===== Middleware =====
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cors({
origin: [
  process.env.CLIENT_URL,
  "http://localhost:5173",
  "https://hotel-booking-blue.vercel.app"
],
credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}));

app.use(passport.initialize());
// ===== Routes =====
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use("/api/chat", chatRoutes);
// Existing code...
app.use("/api/audit", auditRoutes);
// Add this line with your other app.use routes
app.use('/api/notifications', notificationRoutes);
app.get("/", (req, res) => {
  res.send("Hotel Booking API is running!");
});

// Error handler
app.use(errorHandler);

// ===== Socket.IO =====
const { initSocket } = require('./socket');
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST','PUT', 'DELETE', 'OPTIONS'],
  },
});

// Socket.IO broadcast on booking created
io.on("connection", (socket) => {
  console.log("Admin connected for audit updates");
});

// When booking is created (in your booking controller)
io.emit("auditUpdate"); // Add this line right after successful booking creation
// Initialize global Socket.IO
initSocket(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Global error logging for unexpected errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = { app, io };
