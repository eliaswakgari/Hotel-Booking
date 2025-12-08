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
    const rawSocketBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
    let socketBase = rawSocketBase.replace(/\/+$/, "");
    if (socketBase.endsWith("/api")) {
      socketBase = socketBase.slice(0, -4);
    }

    const newSocket = io(socketBase, {
      withCredentials: true,
    });

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
          description: form.description,
          amenities: form.amenities,
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
          roomFormData.append("amenities", form.amenities.join(","));

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
          // For new rooms, use individual room creation only
          const roomFormData = new FormData();
          roomFormData.append("number", form.roomNumber);
          roomFormData.append("type", form.type);
          roomFormData.append("status", form.status);
          roomFormData.append("price", form.price);
          roomFormData.append("maxGuests", form.maxGuests);
          roomFormData.append("description", form.description);
          roomFormData.append("amenities", form.amenities.join(","));

          // Append images for the new room
          if (images && images.length > 0) {
            images.forEach((file) => {
              roomFormData.append("images", file);
            });
          }

          await dispatch(updateRoom({
            hotelId: hotel._id,
            roomId: "new", // Indicates new room
            formData: roomFormData
          })).unwrap();

          Swal.fire("Success!", "Room added successfully.", "success");
          socket?.emit("hotelUpdated", hotel._id);
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

    // Populate the form with this room's own data (not hotel-level)
    setForm({
      type: room.type,
      status: room.status,
      price: room.price,
      roomNumber: room.number,
      maxGuests: room.maxGuests?.toString() || "2",
      description: room.description || hotel.description || "",
      amenities: Array.isArray(room.amenities)
        ? room.amenities
        : (Array.isArray(hotel.amenities) ? hotel.amenities : []),
    });

    // Clear previous images and previews when editing an existing room
    setImages([]);
    setImagePreviews([]);

    // Open the modal in edit mode
    setShowModal(true);
  };

  const handleEditLocation = () => {
    if (hotels.length === 0) {
      Swal.fire("Info", "Please add rooms first to create the hotel.", "info");
      return;
    }
    setShowLocationModal(true);
  };

  const handleUpdateLocation = async (data) => {
    const hotel = hotels[0];
    if (!hotel) return;

    try {
      const payload = {
        name: data.name || hotel.name,
        description: hotel.description,
        basePrice: hotel.basePrice,
        maxGuests: hotel.maxGuests,
        amenities: Array.isArray(hotel.amenities)
          ? hotel.amenities.join(",")
          : "",
        location: {
          address: data.address || hotel.location?.address || "",
          city: data.city || hotel.location?.city || "",
          country: data.country || hotel.location?.country || "",
          coordinates: {
            lat: data.coordinates?.lat ?? hotel.location?.coordinates?.lat ?? null,
            lng: data.coordinates?.lng ?? hotel.location?.coordinates?.lng ?? null,
          },
        },
        contact: {
          phone: data.phone || hotel.contact?.phone || "",
          email: data.email || hotel.contact?.email || "",
        },
      };

      const formData = new FormData();
      formData.append("name", payload.name);
      formData.append("description", payload.description || "");
      if (payload.basePrice != null) formData.append("basePrice", String(payload.basePrice));
      if (payload.maxGuests != null) formData.append("maxGuests", String(payload.maxGuests));
      formData.append("amenities", payload.amenities || "");
      formData.append("location", JSON.stringify(payload.location));
      formData.append("contact", JSON.stringify(payload.contact));

      await dispatch(updateHotel({ id: hotel._id, formData })).unwrap();
      Swal.fire("Updated", "Hotel information updated successfully.", "success");
      setShowLocationModal(false);
      await dispatch(fetchHotels());
    } catch (err) {
      console.error("Update location error:", err);
      Swal.fire("Error", err.message || "Failed to update hotel information.", "error");
    }
  };

  const hotel = hotels[0] || null;
  const rooms = hotel?.rooms || [];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Hotel Management</h1>
          <div className="flex gap-3">
            {hotels.length > 0 && (
              <button
                type="button"
                onClick={handleEditLocation}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Manage Hotel Information
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowModal(true)}
              className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
            >
              Add Room
            </button>
          </div>
        </div>

        {loading && (
          <p className="text-gray-500">Loading hotel data...</p>
        )}

        {!loading && hotels.length === 0 && (
          <p className="text-gray-600">
            No hotel found yet. Add a room to create your hotel, then you can manage its contact information and map location.
          </p>
        )}

        {!loading && hotel && rooms.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl shadow border border-gray-200 dark:border-gray-800 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-lg font-medium">Rooms</h2>
              <span className="text-sm text-gray-500">{rooms.length} room(s)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">Image</th>
                    <th className="px-4 py-2 text-left font-semibold">Number</th>
                    <th className="px-4 py-2 text-left font-semibold">Type</th>
                    <th className="px-4 py-2 text-left font-semibold">Status</th>
                    <th className="px-4 py-2 text-left font-semibold">Price</th>
                    <th className="px-4 py-2 text-left font-semibold">Max Guests</th>
                    <th className="px-4 py-2 text-right font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => {
                    const firstImage = Array.isArray(room.roomImages) && room.roomImages.length > 0
                      ? room.roomImages[0]
                      : null;

                    const imageSrc = firstImage ||
                      "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=200&q=80";

                    return (
                      <tr key={generateRoomKey(room)} className="border-t border-gray-100 dark:border-gray-800">
                        <td className="px-4 py-2">
                          <img
                            src={imageSrc}
                            alt={`Room ${room.number}`}
                            className="w-12 h-12 object-cover rounded-md border border-gray-200 dark:border-gray-700"
                          />
                        </td>
                        <td className="px-4 py-2">{room.number}</td>
                        <td className="px-4 py-2">{room.type}</td>
                        <td className="px-4 py-2 capitalize">{room.status}</td>
                        <td className="px-4 py-2">
                          {typeof room.price === "number" ? room.price.toFixed(2) : room.price}
                        </td>
                        <td className="px-4 py-2">{room.maxGuests}</td>
                        <td className="px-4 py-2 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => handleEditRoom(room)}
                            className="px-3 py-1 rounded bg-blue-500 text-white text-xs hover:bg-blue-600"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-start z-50 overflow-auto"
          onClick={() => setShowModal(false)}
        >
          <div
            ref={modalRef}
            className="bg-white dark:bg-gray-900 w-full max-w-2xl mt-10 p-6 rounded-2xl shadow-lg relative"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-semibold mb-4">
              {editingRoom ? "Edit Room" : "Add Room"}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Room Number *</label>
                  <input
                    type="number"
                    name="roomNumber"
                    value={form.roomNumber}
                    onChange={handleInputChange}
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleInputChange}
                    className="p-2 border rounded w-full"
                  >
                    {roomTypes.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleInputChange}
                    className="p-2 border rounded w-full"
                  >
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Max Guests *</label>
                  <input
                    type="number"
                    name="maxGuests"
                    value={form.maxGuests}
                    onChange={handleInputChange}
                    className="p-2 border rounded w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Room Images</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="block w-full text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description *</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  className="p-2 border rounded w-full"
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amenities</label>
                <div className="flex flex-wrap gap-2">
                  {defaultAmenities.map((amenity) => (
                    <button
                      type="button"
                      key={amenity}
                      onClick={() => handleAmenityChange(amenity)}
                      className={`px-3 py-1 rounded-full text-xs border ${form.amenities.includes(amenity)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                        }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition"
                >
                  {isSubmitting ? "Saving..." : editingRoom ? "Update Room" : "Add Room"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showLocationModal && hotel && (
          <LocationManagementModal
            hotel={hotel}
            onClose={() => setShowLocationModal(false)}
            onSave={handleUpdateLocation}
          />
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

const LocationManagementModal = ({ hotel, onClose, onSave }) => {
  const [form, setForm] = useState({
    name: hotel?.name || "My Hotel",
    address: hotel?.location?.address || "",
    city: hotel?.location?.city || "",
    country: hotel?.location?.country || "",
    lat:
      hotel?.location?.coordinates?.lat ||
      hotel?.location?.coordinates?.coordinates?.[1] ||
      "",
    lng:
      hotel?.location?.coordinates?.lng ||
      hotel?.location?.coordinates?.coordinates?.[0] ||
      "",
    phone: hotel?.contact?.phone || "",
    email: hotel?.contact?.email || "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const locationData = {
      address: form.address,
      city: form.city,
      country: form.country,
      coordinates: {
        lat: form.lat ? parseFloat(form.lat) : null,
        lng: form.lng ? parseFloat(form.lng) : null,
      },
      phone: form.phone,
      email: form.email,
    };

    onSave({
      ...locationData,
      name: form.name,
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
        <h3 className="text-xl font-semibold mb-4">
          📍 Manage Hotel Information
        </h3>

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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                placeholder="Hotel phone number"
                name="phone"
                value={form.phone}
                onChange={handleInputChange}
                className="p-2 border rounded w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                placeholder="Hotel contact email"
                name="email"
                value={form.email}
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