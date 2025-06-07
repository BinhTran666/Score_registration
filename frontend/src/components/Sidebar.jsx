import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", icon: "🏠", path: "/dashboard" },
    { name: "Search Scores", icon: "🔍", path: "/search" },
    { name: "Reports", icon: "📊", path: "/report" },
    { name: "Settings", icon: "⚙️", path: "/setting" },
  ];

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  const getActiveMenu = () => {
    const currentItem = menuItems.find(
      (item) => item.path === location.pathname
    );
    return currentItem ? currentItem.name : "Search Scores";
  };

  const handleMenuClick = (item) => {
    navigate(item.path);
    // Close sidebar on mobile after selection
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  const activeMenu = getActiveMenu();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Toggle button */}
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-yellow-400 hover:bg-yellow-500 rounded-md shadow-lg transition-colors duration-200 md:hidden"
        aria-label="Toggle menu"
      >
        <svg
          className={`w-6 h-6 transform transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          )}
        </svg>
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative
          top-0 left-0 z-40
          w-64 bg-gradient-to-b from-yellow-300 to-blue-700 
          p-4 sm:p-6 text-gray-800 
          min-h-screen md:min-h-full
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          ${!isOpen && "md:-translate-x-full"}
        `}
      >
        <h2 className="text-xl sm:text-2xl font-semibold mb-6 sm:mb-8 ml-12 md:ml-2 text-black">
          Menu
        </h2>
        <nav>
          <ul className="space-y-2 sm:space-y-4">
            {menuItems.map((item) => (
              <li key={item.name}>
                <button
                  onClick={() => handleMenuClick(item)}
                  className={`
                    w-full text-left flex items-center py-2 sm:py-3 px-3 sm:px-4 rounded-md 
                    transition-all duration-200 ease-in-out
                    text-sm sm:text-base
                    ${
                      activeMenu === item.name
                        ? "bg-yellow-500 font-bold text-black shadow-sm"
                        : "hover:bg-yellow-300 hover:text-black"
                    }
                  `}
                >
                  <span className="mr-3 text-lg">{item.icon}</span>
                  {item.name}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  );
}

export default Sidebar;
