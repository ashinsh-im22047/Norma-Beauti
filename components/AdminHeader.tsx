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
    <header className="bg-[#310A27] text-white shadow-lg sticky top-0 z-[100] border-b border-[#7B2C62]/50">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        
        {/* LEFT: BRAND LOGO */}
        <Link href="/admin/dashboard" className="flex items-center gap-3 group shrink-0">
          <div className="w-10 h-10 rounded-full bg-white/90 overflow-hidden border-2 border-[#D883B7] shadow-md group-hover:scale-105 transition-transform">
            <img src="/logo.jpeg" alt="Norma Beauti Logo" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold tracking-widest text-white">NORMA BEAUTI</h1>
            <p className="text-[9px] font-bold text-[#D883B7] uppercase tracking-widest">Admin Portal</p>
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
                className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all duration-300 ${
                  isActive 
                    ? 'bg-white/20 text-white shadow-sm' 
                    : 'text-[#F3E5F5]/70 hover:bg-white/10 hover:text-white'
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT: LOGOUT BUTTON */}
        <div className="shrink-0">
          <button 
            onClick={handleLogout}
            className="px-6 py-2.5 bg-gradient-to-r from-[#d500f9] to-[#880e4f] hover:from-[#aa00ff] hover:to-[#ad1457] text-white text-xs font-bold uppercase tracking-widest rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
          >
            LOGOUT
          </button>
        </div>

      </div>
    </header>
  );
}