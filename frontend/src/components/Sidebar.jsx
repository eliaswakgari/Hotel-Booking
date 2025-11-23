import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Hotel, BookOpen, Users, LogOut, Menu, X } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const links = [
    { name: "Dashboard", path: "/admin", icon: <Home size={18} /> },
    { name: "Hotels", path: "/admin/hotels", icon: <Hotel size={18} /> },
    { name: "Bookings", path: "/admin/bookings", icon: <BookOpen size={18} /> },
    { name: "Users", path: "/admin/users", icon: <Users size={18} /> },
  ];

  return (
    <>
      {/* Mobile Header with toggle button */}
      <div className="md:hidden flex items-center justify-between bg-blue-900 text-white p-4">
        <h1 className="text-xl font-bold">Admin Panel</h1>
        <button onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-50 h-full bg-gradient-to-b from-blue-900 to-blue-700 text-white p-5 shadow-lg transform transition-transform duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:relative md:flex md:flex-col md:w-64`}
      >
        <h1 className="text-2xl font-semibold mb-6 text-center tracking-wide md:hidden">
          Admin Panel
        </h1>

        <nav className="flex flex-col space-y-2 mt-10 md:mt-0">
          {links.map(({ name, path, icon }) => (
            <Link
              key={name}
              to={path}
              className={`flex items-center gap-3 p-2 rounded-lg transition ${
                location.pathname === path
                  ? "bg-blue-600 text-white"
                  : "hover:bg-blue-600/70 hover:text-white"
              }`}
              onClick={() => setIsOpen(false)} // close sidebar on mobile
            >
              {icon}
              <span>{name}</span>
            </Link>
          ))}
        </nav>

        <div className="mt-auto border-t border-blue-400/40 pt-4">
          <button className="flex items-center gap-2 text-sm hover:text-red-400 transition w-full">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
