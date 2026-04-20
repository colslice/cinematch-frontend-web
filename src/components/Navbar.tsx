import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const Navbar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAccountMenuOpen, setAccountMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  let initials = "U";
  let displayName = "User";

  try {
    const storedUser = localStorage.getItem("user");
    
    if (storedUser) {
      const user = JSON.parse(storedUser); // Turn the string back into an object
      
      const first = user.FirstName || "";
      const last = user.LastName || "";

      if (first && last) {
        initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
        displayName = `${first} ${last.charAt(0)}.`; // Creates "John D."
      } else if (first) {
        initials = first.charAt(0).toUpperCase();
        displayName = first;
      }
    }
  } catch (error) {
    console.error('Error occurred while fetching user data:', error);
  }

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="w-full flex items-center justify-between px-8 py-6 bg-[#0a0a0a] border-b border-white/5 relative">
      {/* Left: Logo */}
      <Link to="/" className="text-xl font-bold tracking-[0.2em] text-gray-400 cursor-pointer">
        CINEMATCH
      </Link>

      {/* Center: Navigation Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-medium">
        <Link to="/" className={`${isActive('/') ? 'text-white' : 'text-gray-400 hover:text-gray-200'} transition-colors`}>
          Home
        </Link>
        <Link to="/search" className={`${isActive('/search') ? 'text-white' : 'text-gray-400 hover:text-gray-200'} transition-colors`}>
          Search
        </Link>
        <Link to="/watchlist" className={`${isActive('/watchlist') ? 'text-white' : 'text-gray-400 hover:text-gray-200'} transition-colors`}>
          Watchlist
        </Link>
        <Link to="/reviews" className={`${isActive('/reviews') ? 'text-white' : 'text-gray-400 hover:text-gray-200'} transition-colors`}>
          My Ratings
        </Link>
      </div>

      {/* Right: User Profile */}
      <div className="flex items-center gap-3 cursor-pointer mr-8 relative">
        <button onClick={() => setAccountMenuOpen(prev => !prev)} className="flex items-center gap-2">
          {/* Dynamically injected Initials */}
          <div className="w-8 h-8 rounded-full bg-[#E85D22] flex items-center justify-center text-white text-xs font-bold uppercase">
            {initials}
          </div>
          {/* Dynamically injected Display Name */}
          <span className="text-gray-300 text-sm hidden sm:block hover:text-white transition-colors capitalize">
            {displayName}
          </span>
        </button>

        {/* Account Dropdown */}
        {isAccountMenuOpen && (
          <div className="absolute right-0 top-12 mt-2 bg-[#141414] border border-white/10 rounded shadow-lg py-2 w-48 z-50">
            <button 
              onClick={handleLogout}
              className="w-full text-left block px-4 py-2 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
