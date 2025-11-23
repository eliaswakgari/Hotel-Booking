import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchHotels,
  addHotel,
  updateHotel,
  deleteHotel,
  updateRoom,
} from "../../features/hotel/hotelSlice";
import AdminLayout from "../../layouts/AdminLayout";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion";
import { io } from "socket.io-client";

const roomTypes = ['Standard', 'Deluxe', 'Suite', 'Premium', 'Executive', 'Accessible', 'Presidential', 'Honeymoon', 'Family'];

const defaultAmenities = [
  'WiFi', 'Air Conditioning', 'TV', 'Mini Bar', 'Room Service',
  'Swimming Pool', 'Gym', 'Spa', 'Restaurant', 'Parking'
];

const HotelsManagement = () => {
  const dispatch = useDispatch();
  const { hotels, loading } = useSelector((state) => state.hotel);

  const [socket, setSocket] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    type: "Standard",
    status: "available",
    price: "",
    roomNumber: "",
    maxGuests: "2",
    description: "",
    amenities: [],
  });
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const modalRef = useRef(null);

  // Initialize Socket.IO
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
    setSocket(newSocket);

    newSocket.on("hotelCreated", () => dispatch(fetchHotels()));
    newSocket.on("hotelUpdated", () => dispatch(fetchHotels()));
    newSocket.on("hotelDeleted", () => dispatch(fetchHotels()));

    return () => newSocket.disconnect();
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  useEffect(() => {
    if (!showModal) {
      setEditingRoom(null);
      resetForm();
    }
  }, [showModal]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews(previews);
  };

  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [imagePreviews]);

  const handleAmenityChange = (amenity) => {
    setForm((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  };

  const resetForm = () => {
    setForm({
      type: "Standard",
      status: "available",
      price: "",
      roomNumber: "",
      maxGuests: "2",
      description: "",
      amenities: [],
    });
    setImages([]);
    setImagePreviews([]);
    setEditingRoom(null);
  };

  const scrollToFirstInvalid = () => {
    if (!modalRef.current) return;
    const invalid = modalRef.current.querySelector(":invalid");
    if (invalid) invalid.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  // Enhanced duplicate room number check
  const checkDuplicateRoomNumber = (roomNumber) => {
    if (hotels.length === 0) return false;
    const hotel = hotels[0];
    return hotel.rooms.some(room => 
      room.number === roomNumber && 
      (!editingRoom || room._id !== editingRoom._id)
    );
  };

  // Generate unique key for rooms
  const generateRoomKey = (room) => {
    return room._id || `room-${room.number}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!form.roomNumber || !form.price || !form.description || !form.maxGuests) {
      scrollToFirstInvalid();
      Swal.fire("Error", "Please fill all required fields.", "error");
      setIsSubmitting(false);
      return;
    }

    // Check for duplicate room number
    if (checkDuplicateRoomNumber(form.roomNumber)) {
      Swal.fire("Error", `Room number ${form.roomNumber} already exists. Please use a different number.`, "error");
      setIsSubmitting(false);
      return;
    }

    try {
      if (hotels.length === 0) {
        // Create hotel first if it doesn't exist
        const hotelFormData = new FormData();
        hotelFormData.append("name", "My Hotel");
        hotelFormData.append("description", form.description);
        hotelFormData.append("basePrice", form.price);
        hotelFormData.append("maxGuests", form.maxGuests);
        hotelFormData.append("amenities", form.amenities.join(","));
        hotelFormData.append("location", JSON.stringify({
          address: "",
          city: "",
          country: "",
          coordinates: { lat: null, lng: null }
        }));
        
        // Create single room with proper structure
        const newRoom = {
          number: form.roomNumber,
          type: form.type,
          status: form.status,
          price: parseFloat(form.price) || 0,
          maxGuests: parseInt(form.maxGuests) || 2,
        };
        
        hotelFormData.append("rooms", JSON.stringify([newRoom]));
        hotelFormData.append("pricingRules", JSON.stringify([]));
        hotelFormData.append("roomType", form.type);

        // Append room images if any - Use the correct field name
        if (images && images.length > 0) {
          images.forEach((file) => {
            hotelFormData.append("images", file); // Use "images" instead of "roomImages"
          });
        }

        await dispatch(addHotel(hotelFormData)).unwrap();
        Swal.fire("Created!", "Hotel and room added successfully.", "success");
        socket?.emit("hotelCreated");
      } else {
        const hotel = hotels[0];
        
        if (editingRoom) {
          // Use the Redux action for individual room update
          const roomFormData = new FormData();
          roomFormData.append("number", form.roomNumber);
          roomFormData.append("type", form.type);
          roomFormData.append("status", form.status);
          roomFormData.append("price", form.price);
          roomFormData.append("maxGuests", form.maxGuests);
          roomFormData.append("description", form.description);
          
          // Append images if any - use correct field name
          if (images && images.length > 0) {
            images.forEach((file) => {
              roomFormData.append("images", file); // Use "images" for room updates
            });
          }

          await dispatch(updateRoom({
            hotelId: hotel._id,
            roomId: editingRoom._id,
            formData: roomFormData
          })).unwrap();
          
          Swal.fire("Success!", "Room updated successfully.", "success");
          socket?.emit("hotelUpdated", hotel._id);
        } else {
          // For new rooms, try individual room creation first
          try {
            const roomFormData = new FormData();
            roomFormData.append("number", form.roomNumber);
            roomFormData.append("type", form.type);
            roomFormData.append("status", form.status);
            roomFormData.append("price", form.price);
            roomFormData.append("maxGuests", form.maxGuests);
            roomFormData.append("description", form.description);
            
            // Append images for the new room
            if (images && images.length > 0) {
              images.forEach((file) => {
                roomFormData.append("images", file);
              });
            }

            // Try to use individual room creation
            await dispatch(updateRoom({
              hotelId: hotel._id,
              roomId: "new", // Indicates new room
              formData: roomFormData
            })).unwrap();
            
            Swal.fire("Success!", "Room added successfully.", "success");
            socket?.emit("hotelUpdated", hotel._id);
          } catch (error) {
            // Fallback: update the entire hotel with new room
            console.log("Individual room creation failed, falling back to hotel update");
            
            const newRoom = {
              number: form.roomNumber,
              type: form.type,
              status: form.status,
              price: parseFloat(form.price) || 0,
              maxGuests: parseInt(form.maxGuests) || 2,
              roomImages: [] // Will be populated by backend
            };

            const updatedRooms = [...hotel.rooms, newRoom];

            const hotelFormData = new FormData();
            hotelFormData.append("name", hotel.name);
            hotelFormData.append("description", hotel.description || form.description);
            hotelFormData.append("basePrice", hotel.basePrice?.toString() || form.price);
            hotelFormData.append("maxGuests", hotel.maxGuests?.toString() || form.maxGuests);
            hotelFormData.append("amenities", Array.isArray(hotel.amenities) ? hotel.amenities.join(",") : form.amenities.join(","));
            hotelFormData.append("location", JSON.stringify(hotel.location || {}));
            hotelFormData.append("rooms", JSON.stringify(updatedRooms));
            hotelFormData.append("pricingRules", JSON.stringify(hotel.pricingRules || []));

            // Only append images if they exist and use the correct field name
            if (images && images.length > 0) {
              images.forEach((file) => {
                hotelFormData.append("images", file); // Use "images" for hotel updates
              });
            }

            await dispatch(updateHotel({ id: hotel._id, formData: hotelFormData })).unwrap();
            Swal.fire("Success!", "Room added successfully.", "success");
            socket?.emit("hotelUpdated", hotel._id);
          }
        }
      }
      
      // Refresh data
      await dispatch(fetchHotels());
      resetForm();
      setShowModal(false);
    } catch (err) {
      console.error("Submit error:", err);
      Swal.fire("Error", err.message || "An error occurred while saving the room.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditRoom = (room) => {
    const hotel = hotels[0];
    if (!hotel) return;

    setEditingRoom({
      _id: room._id,
      number: room.number,
      type: room.type,
      price: room.price,
      status: room.status,
      maxGuests: room.maxGuests || 2,
      roomImages: room.roomImages || []
    });

    setForm({
      type: room.type,
      status: room.status,
      price: room.price,
      roomNumber: room.number,
      maxGuests: room.maxGuests?.toString() || "2",
      description: hotel.description || "",
      amenities: Array.isArray(hotel.amenities) ? hotel.amenities : [],
    });

    setImagePreviews([]);
    setImages([]);
    setShowModal(true);
  };

  const handleDeleteRoom = async (room) => {
    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: `This will delete room ${room.number}.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e74c3c",
    });

    if (confirm.isConfirmed && hotels.length > 0) {
      try {
        const hotel = hotels[0];
        
        const updatedRooms = hotel.rooms.filter(r => r._id !== room._id);

        const formData = new FormData();
        formData.append("name", hotel.name || "");
        formData.append("description", hotel.description || "");
        formData.append("basePrice", hotel.basePrice?.toString() || "0");
        formData.append("maxGuests", hotel.maxGuests?.toString() || "2");
        formData.append("amenities", Array.isArray(hotel.amenities) ? hotel.amenities.join(",") : "");
        formData.append("location", JSON.stringify(hotel.location || {}));
        formData.append("rooms", JSON.stringify(updatedRooms));
        formData.append("pricingRules", JSON.stringify(hotel.pricingRules || []));

        await dispatch(updateHotel({ 
          id: hotel._id, 
          formData 
        })).unwrap();
        
        // Refresh the hotels data
        await dispatch(fetchHotels());
        
        Swal.fire("Deleted!", `Room ${room.number} deleted successfully.`, "success");
        socket?.emit("hotelUpdated", hotel._id);
        
      } catch (err) {
        console.error("Delete error:", err);
        Swal.fire("Error", err.message || "Failed to delete room", "error");
      }
    }
  };

  const handleEditLocation = () => {
    if (hotels.length === 0) {
      Swal.fire("Info", "Please add rooms first to create the hotel.", "info");
      return;
    }
    setShowLocationModal(true);
  };

  const handleUpdateLocation = async (locationData) => {
    if (hotels.length === 0) return;

    try {
      const hotel = hotels[0];
      const formData = new FormData();
      formData.append("name", locationData.name || hotel.name);
      formData.append("description", hotel.description);
      formData.append("basePrice", hotel.basePrice);
      formData.append("maxGuests", hotel.maxGuests);
      formData.append("amenities", Array.isArray(hotel.amenities) ? hotel.amenities.join(",") : "");
      formData.append("location", JSON.stringify(locationData));
      formData.append("rooms", JSON.stringify(hotel.rooms));
      formData.append("pricingRules", JSON.stringify([]));

      await dispatch(updateHotel({ id: hotel._id, formData })).unwrap();
      
      // Refresh the hotels data
      await dispatch(fetchHotels());
      
      Swal.fire("Updated!", "Hotel information updated successfully.", "success");
      socket?.emit("hotelUpdated", hotel._id);
      setShowLocationModal(false);
    } catch (err) {
      Swal.fire("Error", err.message || JSON.stringify(err), "error");
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'available':
        return { color: 'green', text: 'Available', bg: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' };
      case 'occupied':
        return { color: 'red', text: 'Occupied', bg: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' };
      case 'maintenance':
        return { color: 'yellow', text: 'Maintenance', bg: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' };
      default:
        return { color: 'gray', text: 'Unknown', bg: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' };
    }
  };

  return (
    <AdminLayout>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Hotel Management</h2>
        <div className="flex gap-3">
          <button
            onClick={handleEditLocation}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            📍 Manage Hotel Information
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "+ Add Room"}
          </button>
        </div>
      </div>

      {hotels.length > 0 && hotels[0].location && (
        <motion.div 
          className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg mb-6 border-l-4 border-green-500"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            🏨 Hotel Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Hotel Name</label>
                <p className="text-lg font-semibold text-gray-800 dark:text-white">{hotels[0].name || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Address</label>
                <p className="text-gray-800 dark:text-white">{hotels[0].location.address || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">City</label>
                <p className="text-gray-800 dark:text-white">{hotels[0].location.city || "Not set"}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Country</label>
                <p className="text-gray-800 dark:text-white">{hotels[0].location.country || "Not set"}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Latitude</label>
                <p className="text-gray-800 dark:text-white">
                  {hotels[0].location.coordinates?.lat || hotels[0].location.coordinates?.coordinates?.[1] || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">Longitude</label>
                <p className="text-gray-800 dark:text-white">
                  {hotels[0].location.coordinates?.lng || hotels[0].location.coordinates?.coordinates?.[0] || "Not set"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      <motion.div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-lg" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : hotels.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 text-lg mb-4">No rooms added yet</p>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg shadow hover:bg-blue-700 transition"
            >
              Add Your First Room
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border rounded-lg">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <tr>
                  <th className="p-3 text-left">Image</th>
                  <th className="p-3 text-left">Room Type</th>
                  <th className="p-3 text-left">Room Number</th>
                  <th className="p-3 text-left">Price</th>
                  <th className="p-3 text-left">Max Guests</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {hotels[0].rooms.map((room, index) => {
                  const statusInfo = getStatusInfo(room.status);
                  return (
                    <motion.tr 
                      key={generateRoomKey(room)}
                      className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition" 
                      initial={{ opacity: 0, y: 5 }} 
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <td className="p-3">
                        {room.roomImages && room.roomImages.length > 0 ? (
                          <img 
                            src={room.roomImages[0]} 
                            alt={`${room.type} ${room.number}`} 
                            className="w-16 h-16 object-cover rounded-lg shadow"
                            onError={(e) => {
                              console.log('Image failed to load:', room.roomImages[0]);
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No Image</span>
                          </div>
                        )}
                        <div className="hidden w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500 text-xs">No Image</span>
                        </div>
                      </td>
                      <td className="p-3 font-semibold text-gray-800 dark:text-white">
                        {room.type}
                      </td>
                      <td className="p-3 text-gray-600 dark:text-gray-400">
                        {room.number}
                      </td>
                      <td className="p-3">
                        <span className="font-semibold text-green-600 dark:text-green-400">
                          ${room.price}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-1 rounded text-sm">
                          {room.maxGuests || 2} {room.maxGuests === 1 ? 'Guest' : 'Guests'}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg}`}>
                          {statusInfo.text}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2 flex-wrap">
                          {/* Edit Button */}
                          <button 
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 transition-colors"
                            title="Edit Room"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          
                          {/* Delete Button */}
                          <button 
                            onClick={() => handleDeleteRoom(room)}
                            className="text-red-600 hover:text-red-800 dark:hover:text-red-400 transition-colors"
                            title="Delete Room"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>  
            </table>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start z-50 overflow-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !isSubmitting && setShowModal(false)}
          >
            <motion.div
              ref={modalRef}
              className="bg-white dark:bg-gray-900 w-full max-w-4xl mt-10 p-6 rounded-2xl shadow-lg relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: -50 }}
            >
              <h3 className="text-xl font-semibold mb-4">
                {editingRoom ? `Edit Room ${editingRoom.number}` : "Add New Room"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Room Type *</label>
                    <select 
                      name="type"
                      value={form.type} 
                      onChange={handleInputChange} 
                      className="p-2 border rounded w-full"
                      required
                      disabled={isSubmitting}
                    >
                      {roomTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Room Number *</label>
                    <input 
                      type="text" 
                      placeholder="Enter room number (e.g., 101)"
                      name="roomNumber"
                      value={form.roomNumber} 
                      onChange={handleInputChange} 
                      className="p-2 border rounded w-full" 
                      required 
                      disabled={isSubmitting && editingRoom}
                    />
                    {checkDuplicateRoomNumber(form.roomNumber) && (
                      <p className="text-red-500 text-xs mt-1">Room number already exists</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Price per Night ($) *</label>
                    <input 
                      type="number" 
                      placeholder="Enter price" 
                      name="price"
                      value={form.price} 
                      onChange={handleInputChange} 
                      className="p-2 border rounded w-full" 
                      required 
                      min="0"
                      step="0.01"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Max Guests *</label>
                    <select 
                      name="maxGuests"
                      value={form.maxGuests} 
                      onChange={handleInputChange} 
                      className="p-2 border rounded w-full"
                      required
                      disabled={isSubmitting}
                    >
                      {[1, 2, 3, 4, 5, 6].map(num => (
                        <option key={num} value={num}>{num} {num === 1 ? 'Guest' : 'Guests'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status *</label>
                    <select 
                      name="status"
                      value={form.status} 
                      onChange={handleInputChange} 
                      className="p-2 border rounded w-full"
                      required
                      disabled={isSubmitting}
                    >
                      <option value="available">Available</option>
                      <option value="occupied">Occupied</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description *</label>
                  <textarea 
                    placeholder="Describe the room features and amenities..."
                    name="description"
                    value={form.description} 
                    onChange={handleInputChange} 
                    className="p-2 border rounded w-full h-24" 
                    required 
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Amenities</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                    {defaultAmenities.map(amenity => (
                      <label key={amenity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={form.amenities.includes(amenity)}
                          onChange={() => !isSubmitting && handleAmenityChange(amenity)}
                          className="rounded"
                          disabled={isSubmitting}
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    {editingRoom ? `Update Room Images` : "Room Images"}
                    <span className="text-gray-500 text-xs ml-1">(Each room will have its own unique images)</span>
                  </label>
                  <input 
                    type="file" 
                    multiple 
                    onChange={handleImageChange} 
                    className="p-2 border rounded w-full" 
                    accept="image/*"
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editingRoom 
                      ? "Upload new images to replace existing ones for this specific room." 
                      : "Upload unique images for this specific room."}
                  </p>
                  <div className="flex gap-2 mt-2 flex-wrap">
                    {imagePreviews.map((src, idx) => (
                      <img key={idx} src={src} alt={`Preview ${idx}`} className="w-20 h-20 object-cover rounded" />
                    ))}
                  </div>
                  {editingRoom && editingRoom.roomImages && editingRoom.roomImages.length > 0 && (
                    <div className="mt-2">
                      <p className="text-sm text-gray-600 mb-1">Current Room Images:</p>
                      <div className="flex gap-2 flex-wrap">
                        {editingRoom.roomImages.map((src, idx) => (
                          <img key={idx} src={src} alt={`Current ${idx}`} className="w-16 h-16 object-cover rounded" />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <button 
                    type="submit" 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isSubmitting || checkDuplicateRoomNumber(form.roomNumber)}
                  >
                    {isSubmitting ? "Processing..." : (editingRoom ? "Update Room" : "Add Room")}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowModal(false)} 
                    className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg disabled:opacity-50"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLocationModal && hotels.length > 0 && (
          <LocationManagementModal
            hotel={hotels[0]}
            onClose={() => setShowLocationModal(false)}
            onSave={handleUpdateLocation}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

// LocationManagementModal component (same as before)
const LocationManagementModal = ({ hotel, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: hotel?.name || "My Hotel",
    address: hotel?.location?.address || "",
    city: hotel?.location?.city || "",
    country: hotel?.location?.country || "",
    lat: hotel?.location?.coordinates?.lat || hotel?.location?.coordinates?.coordinates?.[1] || "",
    lng: hotel?.location?.coordinates?.lng || hotel?.location?.coordinates?.coordinates?.[0] || ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const locationData = {
      address: form.address,
      city: form.city,
      country: form.country,
      coordinates: {
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null
      }
    };

    onSave({
      ...locationData,
      name: form.name
    });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start z-50 overflow-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white dark:bg-gray-900 w-full max-w-2xl mt-10 p-6 rounded-2xl shadow-lg relative"
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.9, y: -50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: -50 }}
      >
        <h3 className="text-xl font-semibold mb-4">📍 Manage Hotel Information</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Hotel Name *</label>
            <input 
              type="text" 
              placeholder="Enter hotel name" 
              name="name"
              value={form.name} 
              onChange={handleInputChange} 
              className="p-2 border rounded w-full" 
              required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Address</label>
            <input 
              type="text" 
              placeholder="Enter hotel address" 
              name="address"
              value={form.address} 
              onChange={handleInputChange} 
              className="p-2 border rounded w-full" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input 
                type="text" 
                placeholder="City" 
                name="city"
                value={form.city} 
                onChange={handleInputChange} 
                className="p-2 border rounded w-full" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input 
                type="text" 
                placeholder="Country" 
                name="country"
                value={form.country} 
                onChange={handleInputChange} 
                className="p-2 border rounded w-full" 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Latitude</label>
              <input 
                type="text" 
                placeholder="Latitude (optional)" 
                name="lat"
                value={form.lat} 
                onChange={handleInputChange} 
                className="p-2 border rounded w-full" 
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Longitude</label>
              <input 
                type="text" 
                placeholder="Longitude (optional)" 
                name="lng"
                value={form.lng} 
                onChange={handleInputChange} 
                className="p-2 border rounded w-full" 
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button 
              type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700 transition"
            >
              Update Hotel Information
            </button>
            <button 
              type="button" 
              onClick={onClose}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg"
            >
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default HotelsManagement;