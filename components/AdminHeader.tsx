"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // These are the main links that will appear in the center of the header
  const navLinks = [
    { name: 'Dashboard', path: '/admin/dashboard' },
    { name: 'Orders', path: '/admin/orders' },
    { name: 'Support', path: '/admin/support' },
    { name: 'Inventory', path: '/admin/inventory' },
  ];

  const handleLogout = () => {
    localStorage.removeItem('userId');
    // document.cookie = "user_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    router.push('/login');
  };

  return (
    <header className="bg-gradient-to-r from-[#fff5f4]/90 via-[#ffe8e6]/90 to-[#fff5f4]/90 backdrop-blur-lg shadow-sm sticky top-0 z-[100] border-b border-[#FFAFA8]/30 transition-all duration-300">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LEFT: BRAND LOGO WITH COLORFUL GRADIENT RING */}
        <Link href="/admin/dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-full p-[2px] bg-gradient-to-tr from-[#FFAFA8] via-purple-300 to-blue-300 shadow-sm group-hover:scale-105 transition-all duration-300">
            <div className="w-full h-full rounded-full overflow-hidden bg-white">
              <img src="/logo.jpeg" alt="Norma Beauti Logo" className="w-full h-full object-cover" />
            </div>
          </div>
          <div className="flex flex-col justify-center">
            <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-800 to-slate-600 group-hover:from-[#FFAFA8] group-hover:to-purple-500 transition-all duration-300">
              NORMA BEAUTI
            </h1>
            <p className="text-[10px] font-bold text-[#ff8a80] uppercase tracking-widest leading-none mt-0.5">
              Admin Portal
            </p>
          </div>
        </Link>

        {/* MIDDLE: DESKTOP NAVIGATION LINKS */}
        <nav className="hidden md:flex items-center gap-2 flex-grow justify-center">
          {navLinks.map((link) => {
            // Highlight the link if we are currently on that page
            const isActive = pathname === link.path || pathname.startsWith(link.path + '/');
            return (
              <Link 
                key={link.name} 
                href={link.path}
                className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white shadow-md' 
                    : 'text-slate-600 hover:bg-white/60 hover:text-[#ff8a80]'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT: WARM GRADIENT LOGOUT BUTTON */}
        <div className="shrink-0">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-2 px-6 py-2.5 bg-white/80 border border-[#FFAFA8]/40 text-slate-600 text-xs font-bold uppercase tracking-widest rounded-full shadow-sm hover:shadow-md hover:border-rose-300 hover:bg-gradient-to-r hover:from-rose-50 hover:to-orange-50 hover:text-rose-500 transition-all hover:-translate-y-0.5"
          >
            LOGOUT
            {/* Modern Line-Art SVG for Logout */}
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>

      </div>
    </header>
  );
}