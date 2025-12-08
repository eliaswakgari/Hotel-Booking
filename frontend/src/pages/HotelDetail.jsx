import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";

import GuestLayout from "../layouts/GuestLayout";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import { Star } from "lucide-react";
import BookingForm from "../components/BookingForm";
import { fetchRoomById } from "../api/hotelApi";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Main HotelDetail Component
const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);

  const {
    data: hotelData,
    isLoading,
  } = useQuery({
    queryKey: ["room", id],
    queryFn: async () => {
      const { data } = await fetchRoomById(id);
      return { hotel: data.hotel || {}, room: data.room || null };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
  });

  const hotel = hotelData?.hotel || {};
  const selectedRoom = hotelData?.room || null;

  const [showBookingModal, setShowBookingModal] = useState(false);

  // Choose images:
  // - If a room is selected, show only that room's own images (or a simple
  //   placeholder image if it has none).
  // - If no room is selected, show the hotel's images as before.
  const selectedRoomImages = Array.isArray(selectedRoom?.roomImages)
    ? selectedRoom.roomImages
    : [];
  const hotelImages = Array.isArray(hotel?.images) ? hotel.images : [];
  const placeholderRoomImages = [
    "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  ];

  const displayImages = selectedRoom
    ? selectedRoomImages.length > 0
      ? selectedRoomImages
      : placeholderRoomImages
    : hotelImages;

  // Choose amenities:
  // - If a room is selected and has its own amenities, show those.
  // - If the selected room has no amenities, fall back to hotel amenities.
  // - If there is no room selected, show the hotel's amenities.
  // - If neither has amenities, fall back to a small default list.

  const selectedRoomAmenities = Array.isArray(selectedRoom?.amenities)
    ? selectedRoom.amenities
    : [];
  const hotelAmenities = Array.isArray(hotel?.amenities) ? hotel.amenities : [];
  const defaultAmenities = ["Free WiFi", "Parking", "Breakfast"];

  const displayAmenities = selectedRoom
    ? selectedRoomAmenities.length > 0
      ? selectedRoomAmenities
      : hotelAmenities.length > 0
        ? hotelAmenities
        : defaultAmenities
    : hotelAmenities.length > 0
      ? hotelAmenities
      : defaultAmenities;

  const handleBookNow = () => {
    if (!user) {
      Swal.fire({
        title: "Login Required",
        text: "You need to log in to book a room. Would you like to log in now?",
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Yes, Log In",
        cancelButtonText: "Continue Browsing",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/login", {
            state: {
              redirectTo: `/room/${id}`,
              message: "Please log in to book your room",
            },
          });
        }
      });
    } else {
      setShowBookingModal(true);
    }
  };

  // If navigated from Home with openBooking flag, respect it
  useEffect(() => {
    if (!hotel) return;

    const openBooking = location.state && location.state.openBooking;
    if (openBooking) {
      if (!user) {
        handleBookNow();
      } else {
        setShowBookingModal(true);
      }
    }
  }, [hotel, location.state, user]);

  if (isLoading) {
    return (
      <GuestLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading hotel details...</p>
          </div>
        </div>
      </GuestLayout>
    );
  }

  if (!hotel || Object.keys(hotel).length === 0) {
    return (
      <GuestLayout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Hotel Not Found</h2>
          <p className="text-gray-600 mb-4">The hotel you're looking for doesn't exist.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </GuestLayout>
    );
  }

  // Calculate average rating (hotel-level)
  const averageRating = hotel.reviews?.length
    ? hotel.reviews.reduce((sum, review) => sum + review.rating, 0) /
    hotel.reviews.length
    : 0;

  return (
    <GuestLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hotel Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {selectedRoom
                  ? `${selectedRoom.type || "Room"} ${selectedRoom.number || ""} - ${hotel?.name || "Hotel"
                  }`
                  : hotel?.name || "Unnamed Hotel"}
              </h2>
              {hotel.reviews?.length > 0 && (
                <div className="flex items-center gap-2 bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
                  <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold text-blue-800 dark:text-blue-200">
                    {averageRating.toFixed(1)} ({hotel.reviews.length} reviews)
                  </span>
                </div>
              )}
            </div>

            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {hotel?.location?.address || "No address available"}
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              {displayImages.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={
                    selectedRoom
                      ? `${selectedRoom.type || "Room"}-${selectedRoom.number || ""}-${idx}`
                      : `${hotel?.name || "hotel"}-${idx}`
                  }
                  className="w-full h-32 object-cover rounded-lg shadow-md"
                />
              ))}
            </div>

            <p className="text-gray-700 dark:text-gray-300 mb-1">
              {hotel?.description || "No description available."}
            </p>
            {selectedRoom?.description && (
              <p className="text-gray-700 dark:text-gray-300 mb-4 text-sm">
                <span className="font-semibold">Room description:</span> {selectedRoom.description}
              </p>
            )}

            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">Amenities:</h3>
              <div className="flex flex-wrap gap-2">
                {displayAmenities.map((amenity, i) => (
                  <span
                    key={i}
                    className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {amenity}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={handleBookNow}
              className="bg-indigo-600 hover:bg-indigo-700 text-white py-3 px-6 rounded-lg font-semibold transition"
            >
              Book Now
            </button>

            {!user && (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mt-4 rounded">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      You need to <button onClick={() => navigate("/login")} className="underline font-medium">log in</button> to book a room.{" "}
                      <button onClick={() => navigate("/register")} className="underline font-medium">Create an account</button> if you don't have one.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 h-96 w-full rounded-lg overflow-hidden shadow-lg">
            <iframe
              title="hotel-location"
              src={`https://www.google.com/maps?q=${encodeURIComponent(
                hotel?.location?.address || "Addis Ababa"
              )}&output=embed`}
              className="w-full h-full"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-2 transform transition-transform duration-300 animate-slide-up">
              <Elements stripe={stripePromise}>
                <BookingForm
                  hotel={hotel}
                  selectedRoom={selectedRoom}
                  onClose={() => setShowBookingModal(false)}
                />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </GuestLayout>
  );
};

export default HotelDetail;