import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createBooking } from '../features/booking/bookingThunks';
import Swal from 'sweetalert2';

const BookingForm = ({ hotelId }) => {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);
  const dispatch = useDispatch();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await dispatch(createBooking({ hotelId, checkIn, checkOut, guests })).unwrap();
      Swal.fire('Success', 'Booking created successfully', 'success');
    } catch (error) {
      Swal.fire('Error', error, 'error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <input type="date" value={checkIn} onChange={e => setCheckIn(e.target.value)} required />
      <input type="date" value={checkOut} onChange={e => setCheckOut(e.target.value)} required />
      <input type="number" value={guests} onChange={e => setGuests(e.target.value)} min={1} required />
      <button type="submit" className="bg-blue-600 text-white p-2 rounded">Book Now</button>
    </form>
  );
};

export default BookingForm;
