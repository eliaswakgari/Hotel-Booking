import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { useDispatch, useSelector } from "react-redux";
import GuestLayout from "../layouts/GuestLayout";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import Swal from "sweetalert2";
import { io } from "socket.io-client";
import { Star } from "lucide-react";
import { updateRoomStatus } from "../features/hotel/hotelSlice";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);
const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000");

// Review Section Component
const ReviewSection = ({ hotelId, isAuthenticated, user }) => {
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, [hotelId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/reviews/${hotelId}`);
      setReviews(data);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!rating || !comment.trim()) {
      Swal.fire("Error", "Please provide both rating and comment", "error");
      return;
    }

    setSubmitting(true);
    try {
      await axios.post("/api/reviews", {
        hotelId,
        rating,
        comment: comment.trim()
      }, { withCredentials: true });

      Swal.fire("Success", "Review submitted successfully!", "success");
      setRating(0);
      setComment("");
      setShowReviewForm(false);
      fetchReviews();
    } catch (error) {
      console.error("Error submitting review:", error);
      Swal.fire("Error", error.response?.data?.message || "Failed to submit review", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ currentRating, onRatingChange, readonly = false }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={readonly}
            onClick={() => !readonly && onRatingChange(star)}
            onMouseEnter={() => !readonly && setHoverRating(star)}
            onMouseLeave={() => !readonly && setHoverRating(0)}
            className={`${
              readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
            } transition-transform duration-200`}
          >
            <Star
              className={`w-6 h-6 ${
                star <= (hoverRating || currentRating)
                  ? "text-yellow-400 fill-yellow-400"
                  : "text-gray-300"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
          Guest Reviews ({reviews.length})
        </h3>
        {isAuthenticated && user?.role === 'guest' && (
          <button
            onClick={() => setShowReviewForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Write a Review
          </button>
        )}
      </div>

      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4">Write a Review</h3>
            <form onSubmit={handleSubmitReview}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Rating</label>
                <StarRating currentRating={rating} onRatingChange={setRating} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Your Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  rows="4"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="flex-1 bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading reviews...</p>
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-gray-500 dark:text-gray-400">No reviews yet. Be the first to review!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map((review) => (
            <div key={review._id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {review.user?.name || "Anonymous"}
                  </h4>
                  <StarRating currentRating={review.rating} readonly={true} />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Booking Form Component with Auto Room Assignment
const BookingForm = ({ hotel, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomType, setRoomType] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingInfo, setBookingInfo] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [flashPrice, setFlashPrice] = useState(false);
  const [messages, setMessages] = useState([]);
  const [availableRoom, setAvailableRoom] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication
  useEffect(() => {
    setIsAuthenticated(!!user);
  }, [user]);

  // Get unique room types
  const roomTypes = Array.from(new Set(hotel?.rooms?.map(r => r.type) || []));
  
  // Auto-select first room type
  useEffect(() => {
    if (roomTypes.length > 0 && !roomType) {
      setRoomType(roomTypes[0]);
    }
  }, [roomTypes, roomType]);

  // Auto-assign available room when dates or room type changes
  useEffect(() => {
    const autoAssignRoom = async () => {
      if (checkIn && checkOut && roomType) {
        try {
          // Validate dates
          const checkInDate = new Date(checkIn);
          const checkOutDate = new Date(checkOut);
          
          if (checkInDate >= checkOutDate) {
            setAvailableRoom(null);
            return;
          }

          if (checkInDate < new Date().setHours(0, 0, 0, 0)) {
            setAvailableRoom(null);
            return;
          }

          const { data } = await axios.get(`/api/hotels/${hotel._id}/available-rooms`, {
            params: { checkIn, checkOut, roomType }
          });
          
          console.log("✅ Available rooms response:", data);
          
          // Auto-assign first available room
          if (data.availableRooms && data.availableRooms.length > 0) {
            const firstAvailableRoom = data.availableRooms[0];
            const assignedRoom = {
              number: firstAvailableRoom.number,
              type: firstAvailableRoom.type,
              price: firstAvailableRoom.price || hotel.basePrice,
              _id: firstAvailableRoom._id,
              maxGuests: firstAvailableRoom.maxGuests || 2
            };
            
            setAvailableRoom(assignedRoom);
            console.log("✅ Room assigned:", assignedRoom);
          } else {
            setAvailableRoom(null);
          }
        } catch (error) {
          console.error("❌ Error fetching available rooms:", error);
          setAvailableRoom(null);
        }
      } else {
        setAvailableRoom(null);
      }
    };

    autoAssignRoom();
  }, [checkIn, checkOut, roomType, hotel._id, hotel.basePrice]);

  // Calculate total price
  const calculateTotalPrice = () => {
    if (!checkIn || !checkOut || !adults || !availableRoom) return 0;
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const nights = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    if (nights <= 0) return 0;
    
    let price = availableRoom.price || Number(hotel?.basePrice || 0);
    
    // Weekend pricing
    if ([5, 6].includes(start.getDay()) || [5, 6].includes(end.getDay())) price *= 1.2;
    return price * nights * (adults + children * 0.5);
  };

  useEffect(() => {
    const newPrice = calculateTotalPrice();
    if (newPrice !== totalPrice) {
      setTotalPrice(newPrice);
      setFlashPrice(true);
      const timer = setTimeout(() => setFlashPrice(false), 500);
      return () => clearTimeout(timer);
    }
  }, [checkIn, checkOut, adults, children, availableRoom]);

  // Socket listeners
  useEffect(() => {
    socket.on("bookingCreated", (data) => {
      setMessages((prev) => [...prev, `New booking created: ${data.bookingId}`]);
    });
    socket.on("bookingApproved", (data) => {
      setMessages((prev) => [...prev, `Booking approved: ${data.bookingId}`]);
    });
    return () => {
      socket.off("bookingCreated");
      socket.off("bookingApproved");
    };
  }, []);

  const handleGuestBooking = () => {
    Swal.fire({
      title: "Login Required",
      text: "You need to log in to book a room. Would you like to log in now?",
      icon: "info",
      showCancelButton: true,
      confirmButtonText: "Yes, Log In",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        onClose();
        setTimeout(() => {
          navigate("/login", { 
            state: { 
              redirectTo: `/hotels/${hotel._id}`,
              message: "Please log in to complete your booking"
            }
          });
        }, 300);
      }
    });
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      handleGuestBooking();
      return;
    }

    if (!stripe || !elements) return;

    // Enhanced validation
    console.log('🔍 Booking validation:', {
      checkIn,
      checkOut,
      adults,
      children,
      roomType,
      availableRoom,
      totalPrice
    });

    if (!checkIn || !checkOut || !adults || !availableRoom || !roomType || totalPrice <= 0) {
      const missingFields = [];
      if (!checkIn) missingFields.push('checkIn');
      if (!checkOut) missingFields.push('checkOut');
      if (!adults) missingFields.push('adults');
      if (!availableRoom) missingFields.push('room selection');
      if (!roomType) missingFields.push('roomType');
      if (totalPrice <= 0) missingFields.push('valid price');
      
      Swal.fire("Error", `Please provide: ${missingFields.join(', ')}`, "error");
      return;
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date().setHours(0, 0, 0, 0);
    
    if (checkInDate < today) {
      Swal.fire("Error", "Check-in date cannot be in the past", "error");
      return;
    }
    
    if (checkOutDate <= checkInDate) {
      Swal.fire("Error", "Check-out date must be after check-in date", "error");
      return;
    }

    setLoading(true);
    try {
      // Prepare payment intent data
      const paymentIntentData = {
        hotelId: hotel?._id,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: parseInt(adults),
        children: parseInt(children || 0),
        roomType: roomType,
        roomNumber: availableRoom.number,
        totalPrice: totalPrice
      };

      console.log('🚀 Sending payment intent data:', paymentIntentData);

      // Create payment intent
      const { data } = await axios.post("/api/bookings/create-payment-intent", 
        paymentIntentData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log("✅ Payment intent created:", data);

      // Get card element
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error("Card element not found");
      }

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: user?.name || 'Guest',
            email: user?.email || 'guest@example.com'
          },
        },
      });

      if (error) {
        console.error("❌ Stripe payment error:", error);
        throw new Error(error.message);
      }

      console.log("✅ Payment successful:", paymentIntent);

      // Create booking
      const bookingRes = await axios.post("/api/bookings", {
        hotelId: hotel?._id,
        checkIn: checkIn,
        checkOut: checkOut,
        adults: parseInt(adults),
        children: parseInt(children || 0),
        roomType: roomType,
        roomNumber: availableRoom.number,
        totalPrice: data.totalPrice || totalPrice,
        paymentIntentId: paymentIntent.id,
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      console.log("✅ Booking created:", bookingRes.data);
      
      // Update room status in Redux
      dispatch(updateRoomStatus({
        hotelId: hotel._id,
        roomNumber: availableRoom.number,
        status: 'occupied'
      }));
      
      const bookingData = {
        ...bookingRes.data,
        totalPrice: bookingRes.data.totalPrice || totalPrice || 0
      };
      
      setBookingInfo(bookingData);
      Swal.fire("Success", "Booking confirmed!", "success");
      
      // Emit socket event
      socket.emit("bookingCreated", bookingData);
      
      // Auto-close after 3 seconds
      setTimeout(onClose, 3000);

    } catch (err) {
      console.error("❌ Booking Error:", err);
      const errorMessage = err.response?.data?.message || err.message || "Booking failed";
      
      if (err.response?.status === 400) {
        Swal.fire("Validation Error", errorMessage, "error");
      } else if (err.response?.status === 401) {
        handleGuestBooking();
        return;
      } else {
        Swal.fire("Error", errorMessage, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!bookingInfo) return;
    
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Booking Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; }
          p { margin: 8px 0; }
          button { padding: 10px 20px; background: #007bff; color: white; border: none; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>Booking Confirmation</h1>
        <p><strong>Booking ID:</strong> ${bookingInfo.bookingId || 'N/A'}</p>
        <p><strong>Hotel:</strong> ${hotel?.name || 'N/A'}</p>
        <p><strong>Check-In:</strong> ${bookingInfo.checkIn ? new Date(bookingInfo.checkIn).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Check-Out:</strong> ${bookingInfo.checkOut ? new Date(bookingInfo.checkOut).toLocaleDateString() : 'N/A'}</p>
        <p><strong>Guests:</strong> ${(bookingInfo.adults || 0) + (bookingInfo.children || 0)}</p>
        <p><strong>Room Type:</strong> ${bookingInfo.roomType || 'N/A'}</p>
        <p><strong>Room Number:</strong> ${bookingInfo.roomNumber || 'N/A'}</p>
        <p><strong>Total Price:</strong> $${(bookingInfo.totalPrice || 0).toFixed(2)}</p>
        <button onclick="window.print();">Print</button>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-xl font-bold"
      >
        ✕
      </button>

      {messages.length > 0 && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 p-2 mb-2">
          {messages.map((msg, idx) => (
            <p key={idx} className="text-yellow-800 text-sm">{msg}</p>
          ))}
        </div>
      )}

      {!bookingInfo ? (
        <>
          {!isAuthenticated && (
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Login Required</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>You need to log in to book a room. Your selection will be saved.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <label className="block">
            Check-in:
            <input 
              type="date" 
              value={checkIn} 
              onChange={(e) => setCheckIn(e.target.value)} 
              className="w-full p-2 border rounded mt-1" 
              min={new Date().toISOString().split('T')[0]}
            />
          </label>
          <label className="block">
            Check-out:
            <input 
              type="date" 
              value={checkOut} 
              onChange={(e) => setCheckOut(e.target.value)} 
              className="w-full p-2 border rounded mt-1" 
              min={checkIn || new Date().toISOString().split('T')[0]}
            />
          </label>
          <label className="block">
            Room Type:
            <select value={roomType} onChange={(e) => setRoomType(e.target.value)} className="w-full p-2 border rounded mt-1">
              {roomTypes.map((type) => <option key={type}>{type}</option>)}
            </select>
          </label>
          <label className="block">
            Adults:
            <input 
              type="number" 
              min="1" 
              max={hotel?.maxGuests || 5} 
              value={adults} 
              onChange={(e) => setAdults(Number(e.target.value))} 
              className="w-full p-2 border rounded mt-1" 
            />
          </label>
          <label className="block">
            Children:
            <input 
              type="number" 
              min="0" 
              max={hotel?.maxGuests || 5} 
              value={children} 
              onChange={(e) => setChildren(Number(e.target.value))} 
              className="w-full p-2 border rounded mt-1" 
            />
          </label>

          {/* Auto-assigned Room Display */}
          {availableRoom && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-2">
              <h4 className="font-semibold text-green-800 mb-2">Assigned Room</h4>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-green-700 font-bold">Room {availableRoom.number}</p>
                  <p className="text-green-600 text-sm">{availableRoom.type}</p>
                  <p className="text-green-600 text-sm">${availableRoom.price}/night</p>
                </div>
                <div className="bg-green-500 text-white px-3 py-1 rounded-full text-sm">
                  ✓ Auto-assigned
                </div>
              </div>
            </div>
          )}

          <p className={`text-lg font-semibold ${flashPrice ? "text-green-500 animate-pulse" : ""}`}>
            Total: ${(totalPrice || 0).toFixed(2)}
          </p>
          
          {checkIn && checkOut && (
            <div className="text-sm text-gray-600">
              <p>Selected dates: {new Date(checkIn).toLocaleDateString()} to {new Date(checkOut).toLocaleDateString()}</p>
              <p>Room automatically assigned based on availability</p>
            </div>
          )}
          
          <CardElement className="p-2 border rounded" />
          <button 
            disabled={loading || !availableRoom} 
            onClick={isAuthenticated ? handleBooking : handleGuestBooking}
            className={`py-2 rounded-lg mt-2 ${
              loading || !availableRoom
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                : isAuthenticated 
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
            }`}
          >
            {loading ? "Processing..." : isAuthenticated ? "Confirm Booking" : "Login to Book"}
          </button>

          {!isAuthenticated && (
            <div className="text-center text-sm text-gray-500 mt-2">
              <p>Don't have an account?{" "}
                <button 
                  onClick={() => {
                    onClose();
                    setTimeout(() => navigate("/register"), 300);
                  }}
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Sign up here
                </button>
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold">Booking Confirmed!</h2>
          <p><strong>Booking ID:</strong> {bookingInfo.bookingId || 'N/A'}</p>
          <p><strong>Hotel:</strong> {hotel?.name || 'N/A'}</p>
          <p><strong>Check-In:</strong> {bookingInfo.checkIn ? new Date(bookingInfo.checkIn).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Check-Out:</strong> {bookingInfo.checkOut ? new Date(bookingInfo.checkOut).toLocaleDateString() : 'N/A'}</p>
          <p><strong>Adults:</strong> {bookingInfo.adults || 0}</p>
          <p><strong>Children:</strong> {bookingInfo.children || 0}</p>
          <p><strong>Room Type:</strong> {bookingInfo.roomType || 'N/A'}</p>
          <p><strong>Room Number:</strong> {bookingInfo.roomNumber || 'N/A'}</p>
          <p><strong>Total Price:</strong> ${(bookingInfo.totalPrice || totalPrice || 0).toFixed(2)}</p>
          <button onClick={handlePrint} className="bg-green-500 text-white py-2 rounded-lg">Print / Download</button>
        </div>
      )}
    </div>
  );
};

// Main HotelDetail Component
const HotelDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const fetchHotel = async () => {
      try {
        const { data } = await axios.get(`/api/hotels/${id}`);
        setHotel(data || {});
      } catch (err) {
        console.error("Fetch Hotel Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [id]);

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
              redirectTo: `/hotels/${id}`,
              message: "Please log in to book your room"
            }
          });
        }
      });
    } else {
      setShowBookingModal(true);
    }
  };

  // Calculate average rating
  const averageRating = hotel?.reviews?.length 
    ? hotel.reviews.reduce((sum, review) => sum + review.rating, 0) / hotel.reviews.length
    : 0;

  if (loading) return (
    <GuestLayout>
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hotel details...</p>
        </div>
      </div>
    </GuestLayout>
  );

  if (!hotel || Object.keys(hotel).length === 0) return (
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

  return (
    <GuestLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Hotel Header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                {hotel?.name || "Unnamed Hotel"}
              </h2>
              {hotel?.reviews?.length > 0 && (
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
              {(Array.isArray(hotel?.images) ? hotel.images : []).map((img, idx) => (
                <img 
                  key={idx} 
                  src={img} 
                  alt={`${hotel?.name}-${idx}`} 
                  className="w-full h-32 object-cover rounded-lg shadow-md" 
                />
              ))}
            </div>
            
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              {hotel?.description || "No description available."}
            </p>
            
            <div className="mb-4">
              <h3 className="font-semibold text-lg mb-2">Amenities:</h3>
              <div className="flex flex-wrap gap-2">
                {(Array.isArray(hotel?.amenities) ? hotel.amenities : ["Free WiFi", "Parking", "Breakfast"]).map((amenity, i) => (
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
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
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
              src={`https://www.google.com/maps?q=${encodeURIComponent(hotel?.location?.address || "Addis Ababa")}&output=embed`}
              className="w-full h-full"
              allowFullScreen
            ></iframe>
          </div>
        </div>

        {/* Reviews Section */}
        <ReviewSection 
          hotelId={id} 
          isAuthenticated={!!user} 
          user={user} 
        />

        {showBookingModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="relative w-full max-w-md mx-2 transform transition-transform duration-300 animate-slide-up">
              <Elements stripe={stripePromise}>
                <BookingForm hotel={hotel} onClose={() => setShowBookingModal(false)} />
              </Elements>
            </div>
          </div>
        )}
      </div>
    </GuestLayout>
  );
};

export default HotelDetail;