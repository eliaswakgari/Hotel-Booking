import React, { useState, useMemo } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";

const API_BASE = isLocalhost
  ? "http://localhost:5000/api"
  : import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api`
    : "http://localhost:5000/api";

// Helper to read cookies in browser
const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

const BookingForm = ({ hotel, selectedRoom, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [roomType, setRoomType] = useState(selectedRoom?.type || "Standard");
  const [loading, setLoading] = useState(false);

  // Estimated total price (mirrors backend calculateTotalPrice logic)
  const estimatedPrice = useMemo(() => {
    if (!checkIn || !checkOut || !adults || !hotel) return null;

    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const msPerNight = 1000 * 60 * 60 * 24;
    const nights = Math.ceil((end - start) / msPerNight);
    if (!Number.isFinite(nights) || nights <= 0) return null;

    let basePrice = hotel.basePrice || 0;

    // Use room price if we find a matching room type
    const room = Array.isArray(hotel.rooms)
      ? hotel.rooms.find((r) => r.type === roomType)
      : null;
    if (room && room.price) {
      basePrice = room.price;
    }

    // Weekend pricing: if start or end day is Fri (5) or Sat (6)
    const isWeekend = [5, 6].includes(start.getDay()) || [5, 6].includes(end.getDay());
    if (isWeekend) {
      basePrice *= 1.2;
    }

    const total = basePrice * nights * (Number(adults) + Number(children || 0) * 0.5);
    if (!Number.isFinite(total) || total <= 0) return null;
    return total;
  }, [checkIn, checkOut, adults, children, roomType, hotel]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      Swal.fire("Payment Error", "Stripe is not initialized.", "error");
      return;
    }

    if (!hotel?._id) {
      Swal.fire("Error", "Hotel information is missing.", "error");
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      Swal.fire("Payment Error", "Card element is not available.", "error");
      return;
    }

    try {
      setLoading(true);

      // 1) Ask backend to create a payment intent and auto-assign an available room
      const storedToken = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const cookieToken = getCookie("token");
      const authToken = cookieToken || storedToken;

      const intentRes = await axios.post(
        `${API_BASE}/bookings/create-payment-intent`,
        {
          hotelId: hotel._id,
          checkIn,
          checkOut,
          adults,
          children,
          roomType,
        },
        {
          withCredentials: true,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        }
      );

      const {
        clientSecret,
        paymentIntentId,
        totalPrice,
        roomNumber,
      } = intentRes.data;

      // 2) Confirm card payment on client using Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: cardElement,
          },
        }
      );

      if (confirmError || paymentIntent?.status !== "succeeded") {
        throw new Error(
          confirmError?.message || "Payment was not successful. Please try again."
        );
      }

      // 3) Create booking record in backend using the confirmed payment
      await axios.post(
        `${API_BASE}/bookings`,
        {
          hotelId: hotel._id,
          checkIn,
          checkOut,
          adults,
          children,
          roomType,
          roomNumber,
          totalPrice,
          paymentIntentId,
        },
        {
          withCredentials: true,
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
        }
      );

      Swal.fire("Success", "Booking created successfully.", "success");
      if (onClose) onClose();
    } catch (error) {
      const message =
        error?.response?.data?.message || error.message || "Booking failed";
      Swal.fire("Error", message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 space-y-4"
    >
      <h3 className="text-xl font-semibold mb-2">
        Book {selectedRoom?.type || "Room"} at {hotel?.name}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Check-in</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Check-out</label>
          <input
            type="date"
            className="w-full border rounded px-3 py-2"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Adults</label>
          <input
            type="number"
            min={1}
            className="w-full border rounded px-3 py-2"
            value={adults}
            onChange={(e) => setAdults(Number(e.target.value) || 1)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Children</label>
          <input
            type="number"
            min={0}
            className="w-full border rounded px-3 py-2"
            value={children}
            onChange={(e) => setChildren(Number(e.target.value) || 0)}
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium mb-1">Room Type</label>
          <input
            type="text"
            className="w-full border rounded px-3 py-2"
            value={roomType}
            onChange={(e) => setRoomType(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Card Details</label>
        <div className="border rounded px-3 py-2 bg-white">
          <CardElement options={{ hidePostalCode: true }} />
        </div>
      </div>

      {estimatedPrice !== null && (
        <div className="flex justify-end">
          <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
            Estimated total: ${estimatedPrice.toFixed(2)}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {loading ? "Processing..." : "Confirm Booking"}
        </button>
      </div>
    </form>
  );
};

export default BookingForm;
