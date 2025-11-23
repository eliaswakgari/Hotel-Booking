import React, { useEffect, useState } from "react";
import GuestLayout from "../../layouts/GuestLayout";
import HotelCard from "../../components/HotelCard";
import SkeletonCard from "../../components/SkeletonCard";
import { motion } from "framer-motion";
import axios from "axios";

/*
  GuestDashboard now attempts to fetch real hotels from /api/hotels.
  If the call fails (e.g. backend not available), it falls back to your mockHotels.
*/

const GuestDashboard = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [skeletonCount, setSkeletonCount] = useState(3);

  // ✅ Mock hotel data (kept as fallback)
  const mockHotels = [
    /* keep the same mock items you had... shortened here for brevity */
    {
      _id: "1",
      name: "Luxury Grand Hotel",
      location: "Addis Ababa, Ethiopia",
      basePrice: 250,
      images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=800&q=80"],
      rating: 4.8,
    },
    {
      _id: "2",
      name: "Blue Nile Resort",
      location: "Bahir Dar, Ethiopia",
      basePrice: 180,
      images: ["https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80"],
      rating: 4.5,
    },
    {
      _id: "3",
      name: "Lalibela Sky View Hotel",
      location: "Lalibela, Ethiopia",
      basePrice: 200,
      images: ["https://images.unsplash.com/photo-1505691723518-36a5ac3be353?auto=format&fit=crop&w=800&q=80"],
      rating: 4.7,
    },
  ];

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const res = await axios.get("/api/hotels");
        setHotels(res.data);
      } catch (err) {
        // fallback to mock if API fails (keeps dev flow)
        console.warn("Failed to fetch hotels from API, using mock data.", err);
        setHotels(mockHotels);
      } finally {
        setLoading(false);
      }
    };

    // Simulate small delay and fetch
    fetchHotels();

    const updateSkeletonCount = () => {
      const width = window.innerWidth;
      if (width >= 1024) setSkeletonCount(6);
      else if (width >= 768) setSkeletonCount(4);
      else setSkeletonCount(2);
    };

    updateSkeletonCount();
    window.addEventListener("resize", updateSkeletonCount);
    return () => window.removeEventListener("resize", updateSkeletonCount);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
      <main className="p-6 min-h-[80vh] w-[100vw] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">Available Hotels</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: skeletonCount }).map((_, idx) => (
              <SkeletonCard key={idx} />
            ))}
          </div>
        ) : hotels.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <motion.div
                key={hotel._id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <HotelCard hotel={hotel} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p>No hotels available at the moment.</p>
        )}
      </main>
  );
};

export default GuestDashboard;
