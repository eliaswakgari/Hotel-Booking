import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { createBooking } from "../features/booking/bookingThunks";
import Swal from "sweetalert2";

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_KEY);

const BookingFormInner = ({ hotelId, price }) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const stripe = useStripe();
  const elements = useElements();
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    // Mock payment
    Swal.fire('Payment', `Pay $${price} for booking (mock)`, 'info');

    try {
      await dispatch(createBooking({ hotelId, checkIn, checkOut, guests, price })).unwrap();
      Swal.fire('Success', 'Booking confirmed!', 'success');
    } catch (error) {
      Swal.fire('Error', error, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 mt-2">
      <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
      <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
      <input type="number" value={guests} onChange={e => setGuests(e.target.value)} min={1} required />
      <CardElement className="p-2 border rounded"/>
      <button type="submit" className="bg-blue-600 text-white p-2 rounded mt-2">Pay & Book</button>
    </form>
  );
};

const BookingForm = ({ hotelId, price }) => (
  <Elements stripe={stripePromise}>
    <BookingFormInner hotelId={hotelId} price={price} />
  </Elements>
);

export default BookingForm;
