const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const Booking = require("../models/Booking");
const { getIO } = require("../socket");

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Stripe requires raw body
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("❌ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const io = getIO(); // get the Socket.IO instance

    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        console.log("✅ Payment succeeded:", paymentIntent.id);

        const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
        if (booking) {
          booking.paymentStatus = "succeeded";
          booking.status = "confirmed";
          await booking.save();
          console.log("🎉 Booking confirmed:", booking._id);

          io.emit("bookingUpdate", {
            type: "payment_succeeded",
            bookingId: booking._id,
            message: `Payment succeeded for booking ${booking.bookingId}`,
          });
        }
        break;
      }

      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object;
        console.log("❌ Payment failed:", paymentIntent.id);

        const booking = await Booking.findOne({ paymentIntentId: paymentIntent.id });
        if (booking) {
          booking.paymentStatus = "failed";
          booking.status = "pending";
          await booking.save();

          io.emit("bookingUpdate", {
            type: "payment_failed",
            bookingId: booking._id,
            message: `Payment failed for booking ${booking.bookingId}`,
          });
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object;
        const booking = await Booking.findOne({ paymentIntentId: charge.payment_intent });
        if (booking) {
          booking.status = "refunded";
          await booking.save();

          io.emit("bookingUpdate", {
            type: "refund",
            bookingId: booking._id,
            message: `Booking ${booking.bookingId} has been refunded`,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

module.exports = router;
