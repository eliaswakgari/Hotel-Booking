import React from "react";
import HotelCard, { cardVariants } from "./HotelCard";
import { motion } from "framer-motion";

const HotelsList = ({ hotels }) => {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
      initial="hidden"
      animate="visible"
    >
      {hotels.map((hotel, index) => (
        <HotelCard key={hotel._id} hotel={hotel} index={index} />
      ))}
    </motion.div>
  );
};

export default HotelsList;
