import React from "react";
import { FaFacebookF, FaInstagram, FaTwitter } from "react-icons/fa";
import { motion } from "framer-motion";

const Footer = () => {
  const linkHover = { y: -2, scale: 1.05, transition: { duration: 0.2 } };
  const iconHover = { scale: 1.2, transition: { duration: 0.2 } };

  return (
    <motion.footer
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      viewport={{ once: true }}
      className="bg-gray-900 text-gray-200 mt-auto w-full flex flex-col"
    >
      <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 w-full">

        {/* Branding */}
        <div className="flex flex-col gap-2">
          <h2 className="text-2xl font-bold text-white">Hotel Booking</h2>
          <p className="text-gray-400 text-sm">
            Book your dream stay easily and securely.
          </p>
        </div>

        {/* About */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-white uppercase">About</h3>
          <ul className="space-y-1 text-gray-400 text-sm">
            {["Company", "Careers", "Press", "Blog"].map((item) => (
              <motion.li
                key={item}
                whileHover={linkHover}
                className="cursor-pointer hover:text-white transition"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Explore */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-white uppercase">Explore</h3>
          <ul className="space-y-1 text-gray-400 text-sm">
            {["Hotels", "Destinations", "Deals", "Travel Guides"].map((item) => (
              <motion.li
                key={item}
                whileHover={linkHover}
                className="cursor-pointer hover:text-white transition"
              >
                {item}
              </motion.li>
            ))}
          </ul>
        </div>

        {/* Connect */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-white uppercase">Connect</h3>
          <div className="flex space-x-4 mt-1">
            {[FaFacebookF, FaInstagram, FaTwitter].map((Icon, idx) => (
              <motion.a
                key={idx}
                href="#"
                whileHover={iconHover}
                className="text-gray-400 hover:text-white transition"
              >
                <Icon size={18} />
              </motion.a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="border-t border-gray-800 mt-4 py-4 flex flex-col md:flex-row justify-between items-center px-6 gap-4 md:gap-0 w-full">
        <p className="text-gray-500 text-sm text-center md:text-left">
          &copy; {new Date().getFullYear()} Hotel Booking. All rights reserved.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
          <motion.select
            whileHover={{ scale: 1.05 }}
            className="bg-gray-900 border border-gray-700 text-gray-400 text-sm p-1 rounded cursor-pointer"
          >
            <option>English</option>
          </motion.select>
          <motion.select
            whileHover={{ scale: 1.05 }}
            className="bg-gray-900 border border-gray-700 text-gray-400 text-sm p-1 rounded cursor-pointer"
          >
            <option>USD</option>
          </motion.select>
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
