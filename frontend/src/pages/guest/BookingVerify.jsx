// pages/guest/BookingVerify.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import GuestLayout from "../../layouts/GuestLayout";
import Swal from "sweetalert2";

const BookingVerify = () => {
  const { id } = useParams();
  const [booking, setBooking] = useState(null);

  useEffect(() => {
    const fetchBooking = async () => {
      try {
        const { data } = await axios.get(`/api/bookings/verify/${id}`);
        setBooking(data);
      } catch (err) {
        Swal.fire("Error", "Booking not found or invalid", "error");
      }
    };
    fetchBooking();
  }, [id]);

  if (!booking) return <p className="text-center mt-10">Loading...</p>;

  return (
    <GuestLayout>
      <div className="p-6 max-w-lg mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-xl">
        <h2 className="text-2xl font-bold mb-4 text-center">Booking Verification</h2>
        <p><strong>Hotel:</strong> {booking.hotelName}</p>
        <p><strong>Check-in:</strong> {new Date(booking.checkIn).toLocaleDateString()}</p>
        <p><strong>Check-out:</strong> {new Date(booking.checkOut).toLocaleDateString()}</p>
        <p><strong>Total:</strong> ${booking.totalPrice}</p>
        <p><strong>Payment Status:</strong> {booking.paymentStatus}</p>
        <p><strong>Refund Status:</strong> {booking.refundStatus}</p>
      </div>
    </GuestLayout>
  );
};

export default BookingVerify;
