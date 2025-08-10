import { useState, useRef, useEffect, use } from 'react';
import { Link } from 'react-router-dom';
import { getCurrentUser, signOut } from '../utils/auth';
import type { User } from '../types';
const Navbar: React.FC = () => {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [user, setUser] = useState<User | null>(null);

useEffect(() => {
    const currentUser = getCurrentUser();
    setUser(currentUser);
  }, []);

  const handleSignOut = () => {
    signOut();
    window.location.href = '/';
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
<nav className="bg-gradient-to-r from-slate-900 to-purple-900 p-4 text-white relative z-[10000] border-b border-white/10">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo / Title */}
        <Link to="/dashboard" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7M4 7c0-2.21 1.79-4 4-4h8c2.21 0 4 1.79 4 4M4 7h16M10 11h4" />
            </svg>
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            PromptDB
          </span>
        </Link>

        {user?.picture ? (
<div className="relative flex items-center">

            {/* Welcome Text */}
            <span className="hidden sm:inline text-sm text-gray-300">
              Welcome, <span className="font-semibold text-white mr-4">{user.name} </span>
            </span>

            {/* Profile Picture */}
            <div className="relative  z-[9999]">
              <img
                src={user.picture} 
                alt={user.name}
                className="w-10 h-10 rounded-full cursor-pointer ring-2 ring-white/20 hover:ring-white/40 transition-all duration-200"
                onClick={() => setShowDropdown(prev => !prev)}
              />
            </div>

            {showDropdown && (
              <div
                ref={dropdownRef}
  className="absolute top-14 right-0 bg-white/95 backdrop-blur-md text-gray-900 rounded-xl shadow-xl border border-gray-200/50 w-[320px] py-6 px-6 z-[9999] animate-in slide-in-from-top-2 duration-200"
              >
                {/* Profile Section */}
                <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-200">
                  <img 
                    src={user.picture} 
                    alt={user.name} 
                    className="w-12 h-12 rounded-full ring-2 ring-gray-200" 
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{user.name}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium px-4 py-3 rounded-lg transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] active:scale-95 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link 
            to="/" 
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:shadow-lg transform hover:scale-105"
          >
            Sign In
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;