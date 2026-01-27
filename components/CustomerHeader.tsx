"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function CustomerHeader() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const session = document.cookie.includes('user_session'); 
    setIsLoggedIn(session);
  }, []);

  const handleLogout = async () => {
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.clear();
    window.location.href = '/'; 
  };

  // --- UPDATED POPUP LOGIC ---
  const handleProtectedClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault(); 
    if (isLoggedIn) {
      router.push(path);
    } else {
      // Show Confirm Dialog (OK / Cancel)
      const confirmed = window.confirm("Please login to access this feature.");
      if (confirmed) {
        // If OK clicked -> Go to Login
        router.push('/login');
      }
      // If Cancel clicked -> Do nothing (Stay on page)
    }
  };

  return (
    <header className="bg-[#134B5F] text-white px-8 py-4 flex justify-between items-center shadow-md sticky top-0 z-50">
      
      {/* LEFT: Logo */}
      <div className="flex items-center gap-2">
        <div className="w-10 h-10 rounded-full bg-white overflow-hidden">
           {/* Ensure this logo path is correct */}
           <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
        </div>
        <span className="font-serif font-bold text-lg tracking-wide hidden md:block">NORMA BEAUTI</span>
      </div>

      {/* RIGHT: Navigation & Auth Buttons grouped together */}
      <div className="flex items-center gap-6">
        
        {/* Navigation Links */}
        <nav className="hidden md:flex gap-6 text-sm font-bold tracking-wide items-center">
            {/* 'HOME' links to the Shop page as requested */}
            <Link href="/shop" className="hover:text-[#E0B0D8] transition">HOME</Link>
            
            <button onClick={(e) => handleProtectedClick(e, '/cart')} className="hover:text-[#E0B0D8] transition uppercase">
                CART
            </button>
            <button onClick={(e) => handleProtectedClick(e, '/profile')} className="hover:text-[#E0B0D8] transition uppercase">
                PROFILE
            </button>
        </nav>

        {/* Divider Line */}
        <div className="hidden md:block h-6 w-[1px] bg-white/30"></div>

        {/* Auth Buttons */}
        <div className="flex gap-3">
          {isLoggedIn ? (
            <button onClick={handleLogout} className="bg-[#E0B0D8] text-[#134B5F] px-5 py-2 rounded-full font-bold text-xs hover:bg-white transition">
              LOGOUT
            </button>
          ) : (
            <>
              <Link href="/login">
                 <button className="border border-[#E0B0D8] text-[#E0B0D8] px-5 py-2 rounded-full font-bold text-xs hover:bg-[#E0B0D8] hover:text-[#134B5F] transition">
                   LOGIN
                 </button>
              </Link>
              <Link href="/register">
                 <button className="bg-[#E0B0D8] text-[#134B5F] px-5 py-2 rounded-full font-bold text-xs hover:bg-white transition">
                   SIGN UP
                 </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}