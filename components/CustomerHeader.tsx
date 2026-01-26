"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';

export default function CustomerHeader() {
  const pathname = usePathname();

  // Highlight active link logic
  const isActive = (path: string) => pathname === path ? "text-[#E0B0D8]" : "text-white hover:text-[#E0B0D8]";

  return (
    <header className="bg-[#134B5F] sticky top-0 z-50 shadow-xl h-20">
      <div className="container mx-auto px-6 h-full flex justify-between items-center">
        
        {/* --- LEFT: LOGO & BUSINESS NAME --- */}
        <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-12 h-12 rounded-full border-2 border-white/20 overflow-hidden group-hover:border-[#E0B0D8] transition duration-300">
               {/* Make sure logo.jpeg is in your public folder */}
               <Image src="/logo.jpeg" alt="Norma Beauti Logo" fill className="object-cover" />
            </div>
            <span className="text-xl font-serif font-bold tracking-widest text-white group-hover:text-[#E0B0D8] transition">
                NORMA BEAUTI
            </span>
        </Link>

        {/* --- RIGHT: NAVIGATION & ACTIONS --- */}
        <div className="flex items-center gap-8">
            
            {/* 1. LINKS (Home, Cart, Profile) */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-bold tracking-wider transition-all">
                <Link href="/" className={`${isActive('/')} transition duration-300`}>
                    HOME
                </Link>
                <Link href="/cart" className={`${isActive('/cart')} transition duration-300 relative`}>
                    CART
                    {/* Optional: Tiny Red Dot if items exist */}
                    {/* <span className="absolute -top-1 -right-2 w-2 h-2 bg-red-500 rounded-full"></span> */}
                </Link>
                <Link href="/profile" className={`${isActive('/profile')} transition duration-300`}>
                    PROFILE
                </Link>
            </nav>

            {/* Separator Line */}
            <div className="hidden md:block w-px h-8 bg-white/20"></div>

            {/* 2. BUTTONS (Login & Signup) */}
            <div className="flex items-center gap-4">
                {/* Login: Transparent Outline Style */}
                <Link href="/login" className="px-6 py-2 rounded-full border border-white/40 text-white text-xs font-bold uppercase tracking-wide hover:bg-white/10 transition">
                    Login
                </Link>

                {/* Sign Up: Solid Pink Style (Distinct) */}
                <Link href="/register" className="px-6 py-2 rounded-full bg-[#E0B0D8] text-[#134B5F] text-xs font-bold uppercase tracking-wide shadow-md hover:bg-white hover:scale-105 transition transform">
                    Sign Up
                </Link>
            </div>

        </div>
      </div>
    </header>
  );
}