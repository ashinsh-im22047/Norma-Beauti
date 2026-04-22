"use client";
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation'; 

export default function CustomerHeader() {
  const router = useRouter();
  const pathname = usePathname(); 
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const [showLoginDialog, setShowLoginDialog] = useState(false);

  useEffect(() => {
    const session = document.cookie.includes('user_session'); 
    setIsLoggedIn(session);

    if (session) {
        fetchUnreadCount();
        // Optional: Poll every 30 seconds for new notifications
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }
  }, []);

  const fetchUnreadCount = async () => {
      try {
          const res = await fetch('/api/notifications');
          if (res.ok) {
              const data = await res.json();
              if (Array.isArray(data)) {
                  const unread = data.filter((n: any) => !n.is_read).length;
                  setUnreadCount(unread);
              }
          }
      } catch (error) { console.error(error); }
  };

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
      setShowLoginDialog(true);
    }
  };

  const confirmLoginRedirect = () => {
    setShowLoginDialog(false);
    router.push('/login');
  };

  const isActive = (path: string) => pathname === path;
  const isProfileActive = pathname.startsWith('/profile') || pathname === '/wishlist';

  return (
    <>
      <header className="bg-gradient-to-r from-[#fff5f4] via-[#FFE4E1] to-[#FFAFA8]/40 backdrop-blur-md px-6 py-4 flex justify-between items-center shadow-md sticky top-0 z-50 border-b border-[#FFAFA8]/30">
        
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => router.push('/')}>
          <div className="w-10 h-10 rounded-full bg-white overflow-hidden border-2 border-[#FFAFA8] shadow-sm p-0.5">
             <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-contain rounded-full" />
          </div>
          <span className="font-bold text-lg tracking-[0.1em] hidden md:block text-slate-800">NORMA BEAUTI</span>
        </div>

        <div className="flex items-center gap-6 md:gap-8">
          
          <nav className="hidden md:flex gap-8 text-[11px] font-black tracking-[0.2em] items-center">
              <Link href="/shop" className={`transition-all duration-300 relative py-1 ${isActive('/') || isActive('/shop') ? 'text-[#ff8a80]' : 'text-slate-600 hover:text-slate-900'}`}>
                  HOME
                  {(isActive('/') || isActive('/shop')) && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2.5px] bg-[#ff8a80] rounded-full shadow-[0_0_8px_#ff8a80]"></span>
                  )}
              </Link>
              
              <button onClick={(e) => handleProtectedClick(e, '/cart')} className={`transition-all duration-300 uppercase relative py-1 tracking-[0.2em] font-black ${isActive('/cart') ? 'text-[#ff8a80]' : 'text-slate-600 hover:text-slate-900'}`}>
                  CART
                  {isActive('/cart') && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2.5px] bg-[#ff8a80] rounded-full shadow-[0_0_8px_#ff8a80]"></span>
                  )}
              </button>

              <button onClick={(e) => handleProtectedClick(e, '/profile')} className={`transition-all duration-300 uppercase relative py-1 tracking-[0.2em] font-black ${isProfileActive ? 'text-[#ff8a80]' : 'text-slate-600 hover:text-slate-900'}`}>
                  PROFILE
                  {isProfileActive && (
                      <span className="absolute -bottom-1 left-0 w-full h-[2.5px] bg-[#ff8a80] rounded-full shadow-[0_0_8px_#ff8a80]"></span>
                  )}
              </button>
          </nav>

          <div className="hidden md:block h-6 w-px bg-slate-300/50"></div>

          <div className="flex items-center gap-4">
            
            {/* --- NEW: NOTIFICATION BELL WITH BADGE --- */}
            {isLoggedIn && (
                <button onClick={(e) => handleProtectedClick(e, '/profile/notifications')} className="relative p-2 text-slate-500 hover:text-[#ff8a80] transition-colors group">
                    <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 bg-rose-500 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center border border-white shadow-sm animate-pulse">
                            {unreadCount > 10 ? '10+' : unreadCount}
                        </span>
                    )}
                </button>
            )}

            {isLoggedIn ? (
              <button onClick={handleLogout} className="bg-slate-900 text-white px-6 py-2 rounded-full font-bold text-[10px] tracking-widest hover:bg-[#ff8a80] transition-all shadow-md ml-2">
                LOGOUT
              </button>
            ) : (
              <>
                <Link href="/login">
                   <button className="border-2 border-[#ff8a80] text-[#ff8a80] px-6 py-2 rounded-full font-black text-[10px] tracking-widest hover:bg-[#ff8a80] hover:text-white transition-all">
                     LOGIN
                   </button>
                </Link>
                <Link href="/register">
                   <button className="bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white px-6 py-2.5 rounded-full font-black text-[10px] tracking-widest hover:shadow-lg hover:scale-[1.05] transition-all shadow-md border border-white/20">
                     SIGN UP
                   </button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* --- LOGIN REQUIRED DIALOG --- */}
      {showLoginDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[3rem] shadow-2xl max-w-sm w-full text-center border-4 border-[#FFAFA8]/20 transform transition-all">
              
              <div className="w-20 h-20 bg-[#fff5f4] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border-2 border-[#FFAFA8] text-[#ff8a80]">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>

              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">
                Account Required
              </h3>
              
              <p className="text-slate-500 mb-10 font-medium text-sm leading-relaxed">
                Please log in to your Norma Beauti account to access this feature.
              </p>

              <div className="flex flex-col gap-3">
                  <button 
                    onClick={confirmLoginRedirect}
                    className="w-full py-4 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-black shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all text-xs tracking-widest"
                  >
                    LOG IN NOW
                  </button>
                  <button 
                    onClick={() => setShowLoginDialog(false)}
                    className="w-full py-3 rounded-full font-bold text-slate-400 hover:text-slate-600 transition-all text-[10px] tracking-widest uppercase"
                  >
                    Cancel
                  </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
}