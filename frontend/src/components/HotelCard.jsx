// components/HotelCard.jsx
import React from "react";
import { FaStar, FaMapMarkerAlt, FaUser, FaHeart, FaBed } from "react-icons/fa";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HotelCard = ({ roomData, hotel: hotelProp }) => {
  const navigate = useNavigate();

  // Support both shapes:
  // 1) roomData: { hotel, room }
  // 2) hotel prop only (e.g. from GuestDashboard)
  const hotel = hotelProp || roomData?.hotel;
  const room = roomData?.room || {
    price: hotelProp?.basePrice,
    type: hotelProp?.name,
    maxGuests: 2,
    roomImages: hotelProp?.images || [],
    _id: undefined,
  };

  if (!hotel) {
    // If we still don't have hotel data, render nothing to avoid crashes
    return null;
  }

  // In HotelCard.jsx - alternative approach
  const handleBookNow = (e) => {
    e.stopPropagation();
    // Navigate with room ID in URL when available, otherwise just hotel
    if (room?._id) {
      navigate(`/hotel/${hotel._id}?room=${room._id}`);
    } else {
      navigate(`/hotel/${hotel._id}`);
    }
  };

  const handleCardClick = () => {
    // Navigate to hotel details when clicking anywhere on the card
    navigate(`/hotel/${hotel._id}`, {
      state: room?._id
        ? {
          roomId: room._id,
          roomData: roomData,
        }
        : undefined,
    });
  };

  const toggleFavorite = (e) => {
    e.stopPropagation();
    // Add to favorites logic
    console.log('Toggle favorite:', room?._id || hotel._id);
  };

  const roomAverageRating = room?.averageRating || 0;
  const roomTotalReviews = room?.totalReviews || 0;

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 cursor-pointer group"
      whileHover={{ y: -4 }}
      onClick={handleCardClick} // Make entire card clickable
    >
      {/* Image Section */}
      <div className="relative h-48 bg-gray-200 overflow-hidden">
        {room.roomImages?.[0] ? (
          <img
            src={room.roomImages[0]}
            alt={room.type}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
            <FaBed className="text-4xl text-gray-400" />
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={toggleFavorite}
          className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-md hover:shadow-lg transition"
        >
          <FaHeart className="text-gray-400 hover:text-red-500 transition" />
        </button>

        {/* Guest Favorite Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-white px-2 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-sm">
            Guest favorite
          </span>
        </div>
      </div>

      {/* Content Section */}
      <div className="p-4">
        {/* Title and Rating */}
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-gray-800 text-lg leading-tight">
            {room.type} in {hotel.location?.city || 'City'}
          </h3>
          <div className="flex items-center gap-1 flex-shrink-0">
            <FaStar className="text-yellow-400 text-sm" />
            {roomTotalReviews > 0 ? (
              <span className="text-sm font-semibold">
                {roomAverageRating.toFixed(1)}
                <span className="text-xs text-gray-500"> ({roomTotalReviews})</span>
              </span>
            ) : (
              <span className="text-xs font-semibold text-gray-500">New</span>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-gray-600 text-sm mb-2">
          <FaMapMarkerAlt className="text-gray-400 text-xs" />
          <span className="truncate">{hotel.location?.address || 'Premium location'}</span>
        </div>

        {/* Price */}
        <div className="mb-3">
          <span className="text-lg font-bold text-gray-900">${room.price}</span>
          <span className="text-gray-600 text-sm"> night</span>
        </div>

        {/* Additional Info */}
        <div className="flex justify-between items-center text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <FaUser className="text-xs" />
            <span>{room.maxGuests || 2} guests</span>
          </div>
          <button
            onClick={handleBookNow}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition font-semibold text-sm"
          >
            Book now
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default HotelCard;