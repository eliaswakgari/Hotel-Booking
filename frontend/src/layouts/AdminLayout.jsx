// layouts/AdminLayout.jsx
import React, { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation, Link } from "react-router-dom"; // Add Link import
import {
  AiOutlineHome,
  AiOutlineUser,
  AiOutlineSetting,
  AiOutlineAppstore,
  AiOutlineFileDone,
  AiOutlineLineChart,
  AiOutlineBell,
  AiOutlineLogout,
  AiOutlineMenuFold,
  AiOutlineMenuUnfold,
} from "react-icons/ai";
import { FaBell } from "react-icons/fa";
import { HiMenu } from "react-icons/hi";
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../features/auth/authSlice";
import { motion, AnimatePresence } from "framer-motion";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // ✅ Get user initials for avatar fallback
  const getUserInitials = () => {
    if (!user?.name) return "A";
    const nameParts = user.name.split(' ');
    if (nameParts.length >= 2) {
      return `${nameParts[0][0]}${nameParts[nameParts.length-1][0]}`.toUpperCase();
    }
    return user.name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  // ✅ Menu items with better icons and organization
  const menuItems = [
    { name: "Dashboard", path: "/admin", icon: <AiOutlineHome />, section: "main" },
    { name: "Hotels", path: "/admin/hotels", icon: <AiOutlineAppstore />, section: "management" },
    { name: "Bookings", path: "/admin/bookings", icon: <AiOutlineFileDone />, section: "management" },
    { name: "Users", path: "/admin/users", icon: <AiOutlineUser />, section: "management" },
    { name: "Analytics", path: "/admin/analytics", icon: <AiOutlineLineChart />, section: "analytics" },
    { name: "Audit", path: "/admin/audit", icon: <AiOutlineLineChart />, section: "analytics" },
    { name: "Notifications", path: "/admin/notifications", icon: <FaBell />, section: "notification" },
    { name: "Settings", path: "/admin/settings", icon: <AiOutlineSetting />, section: "settings" },
  ];

  const menuSections = {
    main: "Main",
    management: "Management",
    analytics: "Analytics",
    settings: "Settings",
    notification: "Notification",
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* HEADER */}
      <header className="h-16 w-full bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-gray-800 dark:text-white shadow-sm fixed top-0 left-0 z-50">
        <div className="flex justify-between items-center h-full px-4">
          <div className="flex items-center gap-3">
            {/* Hamburger (mobile) */}
            <button
              className="md:hidden p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <HiMenu size={20} />
            </button>

            {/* Collapse (desktop) */}
            <button
              className="hidden md:inline-flex p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              onClick={() => setSidebarCollapsed((s) => !s)}
            >
              {sidebarCollapsed ? <AiOutlineMenuUnfold size={20} /> : <AiOutlineMenuFold size={20} />}
            </button>

            {/* UPDATED: Logo that links to home page */}
            <Link 
              to="/" 
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                HotelBooking
              </h2>
            </Link>
          </div>

          {/* Avatar + Dropdown */}
          <div className="relative flex items-center gap-3">
            <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-300">
              {user?.name || "Admin"}
            </span>
            <div className="relative">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt={`${user.name}'s avatar`}
                  className="w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 cursor-pointer object-cover hover:border-indigo-500 transition-colors"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                />
              ) : (
                <div 
                  className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 cursor-pointer flex items-center justify-center text-white text-sm font-bold border-2 border-gray-300 dark:border-gray-600 hover:border-indigo-500 transition-colors"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  {getUserInitials()}
                </div>
              )}
              
              <AnimatePresence>
                {dropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden z-50"
                  >
                    <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                      <p className="font-semibold text-gray-900 dark:text-white">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                    
                    {/* UPDATED: Link to main site home */}
                    <Link
                      to="/"
                      className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <AiOutlineHome size={16} />
                      Visit Main Site
                    </Link>
                    
                    <NavLink
                      to="/admin/settings"
                      className="flex items-center gap-2 px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <AiOutlineSetting size={16} />
                      Settings
                    </NavLink>
                    <button
                      className="flex items-center gap-2 w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                      onClick={handleLogout}
                    >
                      <AiOutlineLogout size={16} />
                      Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </header>

      {/* BODY */}
      <div className="flex mt-16">
        {/* SIDEBAR */}
        <motion.aside
          initial={false}
          animate={{
            width:
              sidebarCollapsed && window.innerWidth >= 768
                ? 80
                : window.innerWidth >= 768
                ? 280
                : sidebarOpen
                ? "80vw"
                : 0,
          }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className={`fixed top-16 left-0 h-[calc(100vh-4rem)]
          bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700
          shadow-lg z-40 overflow-y-auto
          /* Hide scrollbar completely */
          scrollbar-none`}
          style={{
            /* Hide scrollbar for Chrome, Safari and Opera */
            scrollbarWidth: 'none',
            /* Hide scrollbar for IE, Edge and Firefox */
            msOverflowStyle: 'none'
          }}
        >
          {/* Additional CSS to hide scrollbar for Webkit browsers */}
          <style jsx>{`
            .scrollbar-none::-webkit-scrollbar {
              display: none;
              width: 0;
              height: 0;
            }
          `}</style>

          <div
            className={`flex flex-col h-full p-4 transition-all duration-300 ${
              sidebarCollapsed ? "items-center" : ""
            }`}
          >
            {!sidebarCollapsed && (
              <div className="mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Navigation
                </h2>
                <div className="w-12 h-1 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full"></div>
              </div>
            )}

            <nav className="flex flex-col gap-1 w-full">
              {Object.entries(menuSections).map(([sectionKey, sectionName]) => {
                const sectionItems = menuItems.filter(item => item.section === sectionKey);
                if (sectionItems.length === 0) return null;
                
                return (
                  <div key={sectionKey} className="mb-4">
                    {!sidebarCollapsed && (
                      <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-3">
                        {sectionName}
                      </h3>
                    )}
                    {sectionItems.map((item, index) => (
                      <NavLink
                        key={index}
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={({ isActive }) =>
                          `group flex items-center gap-3 p-3 rounded-xl transition-all duration-200 ${
                            isActive
                              ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg shadow-purple-500/25"
                              : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white"
                          }`
                        }
                      >
                        <motion.span
                          whileHover={{ scale: 1.1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="text-lg"
                        >
                          {item.icon}
                        </motion.span>
                        
                        {/* FIXED: Show tooltip on hover when collapsed, show text when not collapsed */}
                        <div className="relative flex-1">
                          {sidebarCollapsed ? (
                            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
                              {item.name}
                            </div>
                          ) : (
                            <motion.span
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.3 }}
                              className="font-medium whitespace-nowrap"
                            >
                              {item.name}
                            </motion.span>
                          )}
                        </div>
                      </NavLink>
                    ))}
                  </div>
                );
              })}
            </nav>
          </div>
        </motion.aside>

        {/* OVERLAY */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
          )}
        </AnimatePresence>

        {/* MAIN CONTENT - Adjusted for proper spacing */}
        <main
          className="flex-1 w-full min-h-[calc(100vh-4rem)] p-4 md:p-6 lg:p-8 overflow-y-auto transition-all duration-300"
          style={{
            marginLeft:
              sidebarCollapsed && window.innerWidth >= 768
                ? 80
                : window.innerWidth >= 768
                ? 280
                : 0,
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;