"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; 

export default function CustomerHeader() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // --- CUSTOM DIALOG STATE ---
  const [showLoginDialog, setShowLoginDialog] = useState(false);

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

  const handleProtectedClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault(); 
    if (isLoggedIn) {
      router.push(path);
    } else {
      // Trigger Custom Dialog instead of window.confirm
      setShowLoginDialog(true);
    }
  };

  const confirmLoginRedirect = () => {
    setShowLoginDialog(false);
    router.push('/login');
  };

  // --- HELPER: Check if a path is active ---
  const isActive = (path: string) => pathname === path;
  
  // Profile is active for profile page OR sub-pages like wishlist/orders
  const isProfileActive = pathname === '/profile' || pathname === '/wishlist' || pathname === '/my-orders' || pathname === '/contact-owner';

  return (
    <>
      {/* MAIN HEADER CONTENT */}
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50 border-b border-[#D883B7]/30">
        
        {/* LEFT: Logo */}
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-full bg-white/90 overflow-hidden border border-[#D883B7]">
             <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-serif font-bold text-lg tracking-wide hidden md:block text-[#F3E5F5]">NORMA BEAUTI</span>
        </div>

        {/* RIGHT: Navigation & Auth Buttons */}
        <div className="flex items-center gap-6">
          
          {/* Navigation Links */}
          <nav className="hidden md:flex gap-6 text-sm font-bold tracking-wide items-center">
              
              {/* HOME LINK (Highlights on / or /shop) */}
              <Link 
                  href="/shop" 
                  className={`transition duration-300 relative group ${
                      isActive('/') || isActive('/shop') ? 'text-[#D883B7]' : 'text-white hover:text-[#D883B7]'
                  }`}
              >
                  HOME
                  {/* Active Underline */}
                  {(isActive('/') || isActive('/shop')) && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#D883B7] shadow-[0_0_8px_#D883B7]"></span>
                  )}
              </Link>
              
              {/* CART BUTTON */}
              <button 
                  onClick={(e) => handleProtectedClick(e, '/cart')} 
                  className={`transition duration-300 uppercase relative ${
                      isActive('/cart') ? 'text-[#D883B7]' : 'text-white hover:text-[#D883B7]'
                  }`}
              >
                  CART
                  {isActive('/cart') && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#D883B7] shadow-[0_0_8px_#D883B7]"></span>
                  )}
              </button>

              {/* PROFILE BUTTON */}
              <button 
                  onClick={(e) => handleProtectedClick(e, '/profile')} 
                  className={`transition duration-300 uppercase relative ${
                      isProfileActive ? 'text-[#D883B7]' : 'text-white hover:text-[#D883B7]'
                  }`}
              >
                  PROFILE
                  {isProfileActive && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[#D883B7] shadow-[0_0_8px_#D883B7]"></span>
                  )}
              </button>
          </nav>

          {/* Divider Line */}
          <div className="hidden md:block h-6 w-[1px] bg-white/20"></div>

          {/* Auth Buttons */}
          <div className="flex gap-3">
            {isLoggedIn ? (
              <button onClick={handleLogout} className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-5 py-2 rounded-full font-bold text-xs hover:opacity-90 transition shadow-md border border-white/20">
                LOGOUT
              </button>
            ) : (
              <>
                <Link href="/login">
                   <button className="border border-[#D883B7] text-[#D883B7] px-5 py-2 rounded-full font-bold text-xs hover:bg-[#D883B7] hover:text-white transition duration-300">
                     LOGIN
                   </button>
                </Link>
                <Link href="/register">
                   <button className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-5 py-2 rounded-full font-bold text-xs hover:opacity-90 transition shadow-md border border-white/20">
                     SIGN UP
                   </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- CUSTOM ELEGANT DIALOG BOX (LOGIN REQUIRED) --- */}
      {showLoginDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 transform transition-all scale-100">
              
              <div className="w-16 h-16 bg-[#FCE4EC] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#F8BBD0]">
                🔒
              </div>

              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">
                Login Required
              </h3>
              
              <p className="text-[#7B2C62] mb-8 font-medium">
                Please login to access this feature.
              </p>

              <div className="flex gap-3">
                  <button 
                    onClick={() => setShowLoginDialog(false)}
                    className="flex-1 py-3 rounded-full font-bold border border-[#D883B7] text-[#D883B7] hover:bg-[#FCE4EC] transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={confirmLoginRedirect}
                    className="flex-1 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all"
                  >
                    Login
                  </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}