// pages/Home.jsx
import React, { useState, useEffect, useRef } from "react";
import GuestLayout from "../layouts/GuestLayout";
import HotelCard from "../components/HotelCard";
import { fetchAvailableRooms } from "../features/hotel/hotelThunks";
import { useDispatch, useSelector } from "react-redux";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import Chatbot from "../components/Chatbot";
import {
  FaMapMarkerAlt,
  FaExternalLinkAlt,
  FaDirections,
  FaSync,
  FaBed,
  FaUser,
  FaChevronLeft,
  FaChevronRight,
  FaStar,
  FaHeart,
  FaCalendarAlt,
  FaPhone,
  FaEnvelope
} from "react-icons/fa";

const Home = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { availableRooms, availableRoomsData, loading, error } = useSelector((state) => state.hotel);
  const { user } = useSelector((state) => state.auth);

  const [search, setSearch] = useState("");
  const [selectedRoomType, setSelectedRoomType] = useState("All");
  const [retryCount, setRetryCount] = useState(0);
  const [imageErrors, setImageErrors] = useState({});

  // Refs for horizontal scrolling
  const scrollRefs = useRef({});

  // Fetch available rooms
  useEffect(() => {
    console.log('Dispatching fetchAvailableRooms...');
    dispatch(fetchAvailableRooms())
      .unwrap()
      .then((data) => {
        console.log('Available rooms fetched successfully:', data);
      })
      .catch((error) => {
        console.error('Failed to fetch available rooms:', error);
      });
  }, [dispatch, retryCount]);

  // Debug the availableRooms data
  useEffect(() => {
    console.log('Available rooms data:', availableRooms);
    console.log('Available rooms count:', availableRooms?.length);

    if (availableRooms && availableRooms.length > 0) {
      console.log('First available room sample:', availableRooms[0]);
      console.log('Room images sample:', availableRooms[0]?.room?.roomImages);
      console.log('Hotel images sample:', availableRooms[0]?.hotel?.images);
    }
  }, [availableRooms]);

  // Improved error handling
  const getErrorMessage = () => {
    if (!error) return null;

    if (error.includes('Network Error') || error.includes('Failed to fetch')) {
      return 'Network connection error. Please check your internet connection.';
    }

    return typeof error === 'string' ? error : 'An unexpected error occurred';
  };

  const errorMessage = getErrorMessage();

  // Handle retry with count
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Handle image errors
  const handleImageError = (roomId, imageUrl) => {
    console.log(`Image failed to load for room ${roomId}:`, imageUrl);
    setImageErrors(prev => ({
      ...prev,
      [roomId]: true
    }));
  };

  // Get unique room types for filtering
  const roomTypes = ["All", ...new Set(availableRooms.map(roomData => roomData.room.type))];

  // Filter rooms based on search and selected room type
  const filteredRooms = availableRooms.filter(roomData => {
    const hotel = roomData.hotel;
    const room = roomData.room;

    const hotelName = hotel.name?.toLowerCase() || "";
    const hotelLocation = hotel.location?.address?.toLowerCase() || "";
    const roomType = room.type?.toLowerCase() || "";
    const query = search.toLowerCase();

    const matchesSearch = hotelName.includes(query) ||
      hotelLocation.includes(query) ||
      roomType.includes(query);

    const matchesRoomType = selectedRoomType === "All" || room.type === selectedRoomType;

    return matchesSearch && matchesRoomType;
  });

  // Group rooms by type for horizontal scrolling sections
  const roomsByType = {};
  filteredRooms.forEach(roomData => {
    const type = roomData.room.type || "Other";
    if (!roomsByType[type]) roomsByType[type] = [];
    roomsByType[type].push(roomData);
  });

  // Get image URL for room - improved with multiple fallbacks
  const getRoomImage = (roomData) => {
    const room = roomData.room;
    const hotel = roomData.hotel;

    // Try room images first
    if (room.roomImages && room.roomImages.length > 0) {
      const roomImage = room.roomImages[0];
      // Ensure proper URL format
      if (typeof roomImage === 'string') {
        if (roomImage.startsWith('http') || roomImage.startsWith('/')) {
          return roomImage;
        }
        return `/${roomImage.replace(/^\/+/, '')}`;
      }
    }

    // Try hotel images as fallback
    if (hotel.images && hotel.images.length > 0) {
      const hotelImage = hotel.images[0];
      if (typeof hotelImage === 'string') {
        if (hotelImage.startsWith('http') || hotelImage.startsWith('/')) {
          return hotelImage;
        }
        return `/${hotelImage.replace(/^\/+/, '')}`;
      }
    }

    // Fallback to room type based placeholder images
    const roomType = room.type?.toLowerCase() || 'standard';
    const placeholderImages = {
      'standard': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=500&q=80',
      'deluxe': 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=500&q=80',
      'suite': 'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=500&q=80',
      'premium': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=80',
      'executive': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80',
      'accessible': 'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=500&q=80',
      'presidential': 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=500&q=80',
      'honeymoon': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=500&q=80',
      'family': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=500&q=80'
    };

    return placeholderImages[roomType] || placeholderImages.standard;
  };

  // Scroll functions for horizontal navigation
  const scrollLeft = (roomType) => {
    const container = scrollRefs.current[roomType];
    if (container) {
      container.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = (roomType) => {
    const container = scrollRefs.current[roomType];
    if (container) {
      container.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  // Set ref for each room type container
  const setScrollRef = (roomType, el) => {
    scrollRefs.current[roomType] = el;
  };

  // Get main hotel for contact & location section
  const mainHotel = availableRooms.length > 0 ? availableRooms[0].hotel : null;
  const hasLocationData = mainHotel?.location &&
    (mainHotel.location.address || mainHotel.location.city || mainHotel.location.country);
  const lat = mainHotel?.location?.coordinates?.lat;
  const lng = mainHotel?.location?.coordinates?.lng;
  const dynamicMapSrc = lat && lng
    ? `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`
    : null;

  // Show loading state
  if (loading && availableRooms.length === 0) {
    return (
      <GuestLayout>
        <div className="flex justify-center items-center min-h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading available rooms...</p>
          </div>
        </div>
      </GuestLayout>
    );
  }

  // Show error state
  if (errorMessage && availableRooms.length === 0) {
    return (
      <GuestLayout>
        <div className="flex justify-center items-center min-h-64 px-4">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4">😔</div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Unable to Load Rooms</h3>
            <p className="text-gray-600 mb-6">{errorMessage}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                <FaSync />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
      {/* Hero Section */}
      <section
        className="relative flex flex-col justify-center items-center text-center px-4"
        style={{
          minHeight: "87vh",
          backgroundImage:
            "url('https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1650&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        <div className="absolute inset-0 bg-black/40"></div>

        <motion.div className="relative z-10 flex flex-col items-center w-full max-w-6xl">
          <motion.h1
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="text-4xl md:text-5xl font-bold mb-4 text-white drop-shadow-lg"
          >
            Book Your Dream Stay
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-lg md:text-xl mb-8 text-white drop-shadow-md max-w-xl"
          >
            Find the perfect room at the best price, anytime, anywhere.
          </motion.p>

          {/* Available Rooms Count */}
          {availableRooms.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6"
            >
              <div className="flex items-center gap-2 text-green-800">
                <FaBed />
                <p className="text-sm font-semibold">
                  {availableRoomsData.totalRooms || availableRooms.length} rooms available across {Object.keys(roomsByType).length} room types
                </p>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-full max-w-3xl"
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl md:rounded-full shadow-xl border border-white/60 px-3 py-3 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-0">
              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50 transition">
                <FaMapMarkerAlt className="text-gray-500" />
                <div className="flex flex-col items-start w-full">
                  <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Where</span>
                  <input
                    type="text"
                    placeholder="Search destinations, hotels, or rooms"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200 mx-1" />

              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50/80 transition">
                <FaCalendarAlt className="text-gray-500" />
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Check-in / Check-out</span>
                  <span className="text-sm text-gray-700">Add dates</span>
                </div>
              </div>

              <div className="hidden md:block w-px h-8 bg-gray-200 mx-1" />

              <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-full hover:bg-gray-50/80 transition">
                <FaUser className="text-gray-500" />
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide font-semibold text-gray-400">Guests</span>
                  <span className="text-sm text-gray-700">Add guests</span>
                </div>
              </div>

              <div className="mt-2 md:mt-0 flex justify-end">
                <button
                  className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white rounded-full px-5 py-2.5 text-sm font-semibold shadow-md transition"
                >
                  Explore stays
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </section>

      {/* Room Type Filter Buttons */}
      {availableRooms.length > 0 && (
        <div className="flex justify-center gap-4 flex-wrap mt-12 px-4">
          {roomTypes.map((type) => (
            <button
              key={type}
              className={`px-6 py-2 rounded-full font-semibold transition ${selectedRoomType === type
                ? "bg-blue-600 text-white shadow-lg"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              onClick={() => setSelectedRoomType(type)}
            >
              {type} {type !== "All" && `(${roomsByType[type]?.length || 0})`}
            </button>
          ))}
        </div>
      )}

      {/* Horizontal Scrolling Rooms Display */}
      <section className="max-w-7xl mx-auto px-4 mt-12">
        {loading && availableRooms.length > 0 ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-500">Updating rooms...</p>
          </div>
        ) : availableRooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🏨</div>
            <p className="text-gray-500 text-lg mb-2">No available rooms at the moment.</p>
            <p className="text-gray-400 text-sm">
              All rooms are currently booked. Please check back later or try different dates.
            </p>
            <div className="mt-4">
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mx-auto"
              >
                <FaSync />
                Refresh Availability
              </button>
            </div>
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-gray-500 text-lg mb-2">No rooms match your search.</p>
            <p className="text-gray-400 text-sm">
              Try adjusting your search terms or filters.
            </p>
            <button
              onClick={() => setSearch('')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Clear Search
            </button>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.keys(roomsByType).map((roomType) => {
              if (selectedRoomType !== "All" && selectedRoomType !== roomType) return null;

              const typeRooms = roomsByType[roomType] || [];

              return (
                <div key={roomType} className="relative group">
                  {/* Section Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
                        <FaBed className="text-blue-600" />
                        {roomType} Rooms
                      </h2>
                      <p className="text-gray-600 mt-1">
                        {typeRooms.length} {typeRooms.length === 1 ? 'room' : 'rooms'} available
                      </p>
                    </div>

                    {/* Navigation Arrows */}
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => scrollLeft(roomType)}
                        className="p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <FaChevronLeft className="text-gray-600" />
                      </button>
                      <button
                        onClick={() => scrollRight(roomType)}
                        className="p-2 rounded-full bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition"
                      >
                        <FaChevronRight className="text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scrolling Container */}
                  <div className="relative">
                    <div
                      ref={(el) => setScrollRef(roomType, el)}
                      className="flex gap-6 overflow-x-auto scrollbar-hide pb-6 scroll-smooth"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      {typeRooms.map((roomData, idx) => {
                        const hotel = roomData.hotel;
                        const room = roomData.room;
                        const roomAverageRating = typeof room.averageRating === 'number' ? room.averageRating : 0;
                        const roomTotalReviews = typeof room.totalReviews === 'number' ? room.totalReviews : 0;

                        const roomId = `${hotel._id}-${room._id}`;
                        const imageUrl = getRoomImage(roomData);
                        const hasImageError = imageErrors[roomId];

                        const handleCardClick = () => {
                          navigate(`/hotel/${hotel._id}`, {
                            state: room?._id
                              ? {
                                roomId: room._id,
                                roomData,
                              }
                              : undefined,
                          });
                        };

                        const handleBookNow = (e) => {
                          e.stopPropagation();

                          if (!user) {
                            navigate("/login", {
                              state: {
                                redirectTo: `/hotel/${hotel._id}`,
                                message: "Please log in to book a room",
                              },
                            });
                            return;
                          }

                          navigate(`/hotel/${hotel._id}`, {
                            state: room?._id
                              ? {
                                roomId: room._id,
                                roomData,
                                openBooking: true,
                              }
                              : {
                                openBooking: true,
                              },
                          });
                        };

                        return (
                          <motion.div
                            key={roomId}
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: idx * 0.1 }}
                            className="flex-none w-80" // Fixed width for consistent cards
                            onClick={handleCardClick}
                          >
                            <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-gray-200 cursor-pointer">
                              {/* Image Section */}
                              <div className="relative h-48 overflow-hidden">
                                {!hasImageError ? (
                                  <img
                                    src={imageUrl}
                                    alt={`${roomData.room.type} Room ${roomData.room.number}`}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                    onError={() => handleImageError(roomId, imageUrl)}
                                    loading="lazy"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-blue-50 to-gray-100 flex flex-col items-center justify-center">
                                    <FaBed className="text-gray-400 text-3xl mb-2" />
                                    <span className="text-gray-500 text-sm text-center px-4">
                                      {roomData.room.type} Room
                                    </span>
                                  </div>
                                )}

                                {/* Favorite Badge */}
                                <button className="absolute top-3 right-3 p-2 rounded-full bg-white/90 backdrop-blur-sm hover:bg-white transition-all hover:scale-110">
                                  <FaHeart className="text-gray-600 hover:text-red-500 transition" />
                                </button>
                              </div>

                              {/* Content Section */}
                              <div className="p-4">
                                {/* Room Type and Rating */}
                                <div className="flex justify-between items-start mb-2">
                                  <h3 className="font-semibold text-gray-800 text-lg">
                                    {roomData.room.type} Room {roomData.room.number}
                                  </h3>
                                  <div className="flex items-center gap-1">
                                    <FaStar className="text-yellow-400 text-sm" />
                                    {roomTotalReviews > 0 ? (
                                      <span className="text-sm font-medium text-gray-700">
                                        {roomAverageRating.toFixed(1)}
                                        <span className="text-xs text-gray-500"> ({roomTotalReviews})</span>
                                      </span>
                                    ) : (
                                      <span className="text-xs font-medium text-gray-500">New</span>
                                    )}
                                  </div>
                                </div>

                                {/* Location */}
                                <p className="text-gray-600 text-sm mb-3 flex items-center gap-1">
                                  <FaMapMarkerAlt className="text-red-500 text-xs" />
                                  {roomData.hotel.location?.city || roomData.hotel.location?.address || roomData.hotel.name || 'Hotel'}
                                </p>

                                {/* Price and Details */}
                                <div className="flex justify-between items-center">
                                  <div>
                                    <p className="text-2xl font-bold text-gray-900">
                                      ${roomData.room.price || 'N/A'}
                                      <span className="text-sm font-normal text-gray-600"> / night</span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                      {roomData.room.maxGuests || 2} {roomData.room.maxGuests === 1 ? 'guest' : 'guests'}
                                    </p>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={handleBookNow}
                                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                                  >
                                    Book Now
                                  </button>
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>

                    {/* Gradient Overlays for Scroll Indication */}
                    <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white to-transparent pointer-events-none"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-white to-transparent pointer-events-none"></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="max-w-7xl mx-auto px-4 mt-16">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col md:flex-row items-stretch">
          <div className="md:w-2/3 w-full h-56 md:h-80 bg-black">
            <div className="w-full h-full">
              <iframe
                className="w-full h-full"
                src="https://www.youtube.com/embed/qemqQHaeCYo?autoplay=1&mute=1&loop=1&playlist=qemqQHaeCYo"
                title="Room preview video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
          <div className="md:w-1/3 w-full p-6 md:p-8 flex flex-col justify-center bg-gradient-to-br from-blue-50 to-white">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Experience the Room in 4K</h3>
            <p className="text-gray-600 text-sm mb-4">
              Take a closer look at our premium rooms before you book. Crystal-clear visuals, modern interiors,
              and a relaxing atmosphere designed for your comfort.
            </p>
            <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
              <li>High-quality bedding and furnishings</li>
              <li>Spacious layouts with natural light</li>
              <li>Work-friendly desk and fast Wi‑Fi</li>
            </ul>
            <span className="text-xs text-gray-400">(Preview video only – actual room may vary slightly.)</span>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="bg-gray-50 py-16 mt-16">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">Why Choose Us</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBed className="text-blue-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Best Rooms</h3>
              <p className="text-gray-600">Comfortable and well-equipped rooms for your perfect stay</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaMapMarkerAlt className="text-green-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Prime Locations</h3>
              <p className="text-gray-600">Strategic locations with easy access to attractions</p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUser className="text-purple-600 text-2xl" />
              </div>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">Round-the-clock customer service for your convenience</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">How to Book Your Stay</h2>
        <p className="text-center text-gray-600 mb-10 max-w-2xl mx-auto">
          Reserve your perfect room in just a few simple steps. No confusion, no hassle.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4 font-semibold">
              1
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Browse Available Rooms</h3>
            <p className="text-gray-600 text-sm">
              Use the search and filters to explore room types, pricing, and amenities that fit your stay.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4 font-semibold">
              2
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Confirm Details</h3>
            <p className="text-gray-600 text-sm">
              Select your dates, number of guests, and review room details before proceeding to secure payment.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
          >
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center mb-4 font-semibold">
              3
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-800">Get Instant Confirmation</h3>
            <p className="text-gray-600 text-sm">
              Receive your booking confirmation instantly and access all details from your guest dashboard.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="bg-white py-16 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-3xl font-bold mb-4 text-gray-800">Contact & Location</h2>
            <p className="text-gray-600 mb-6">
              Have a question about your stay, a group booking, or a special request? Reach out to us anytime.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FaMapMarkerAlt />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Our Address</p>
                  <p className="text-sm text-gray-600">
                    {mainHotel?.location?.address || mainHotel?.location?.city || "Addis Ababa, Ethiopia"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FaPhone />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Phone</p>
                  <p className="text-sm text-gray-600">
                    {mainHotel?.contact?.phone || "+251 000 000 000"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                  <FaEnvelope />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Email</p>
                  <p className="text-sm text-gray-600">
                    {mainHotel?.contact?.email || "info@hotelbooking.com"}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              (In a next step, admin can manage these contact details from the dashboard and store them in the database.)
            </p>
          </div>

          <div className="w-full h-72 rounded-2xl overflow-hidden shadow-lg border border-gray-200">
            <iframe
              title="Hotel Location"
              src={dynamicMapSrc || "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3952.001774125939!2d38.7577606!3d9.0107939!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zOcKwMDAnMzkuMCJOIDM4wrA0NScyOC4wIkU!5e0!3m2!1sen!2s!4v1700000000000!5m2!1sen!2s"}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>

      <Chatbot />
    </GuestLayout>
  );
};

export default Home;