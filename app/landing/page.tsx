"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative font-sans overflow-hidden">
      
      {/* 1. BACKGROUND IMAGE */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{ backgroundImage: "url('/homePageHeaderBackground.jpg')" }} 
      >
        {/* Optional: Podi light overlay ekak text eka penuwata kiyawanna lesi wenna.
            Kamathi nathnam 'bg-white/10' ain karanna. */}
        <div className="absolute inset-0 bg-white/10"></div>
      </div>

      {/* 2. TOP NAVIGATION (Logo & Buttons) */}
      <nav className="relative z-20 flex justify-between items-center px-8 py-6">
        
        {/* LOGO (Top Left) */}
        <div className="w-16 h-16 md:w-20 md:h-20 bg-[#134B5F] rounded-full flex items-center justify-center shadow-lg border-2 border-white/50 overflow-hidden">
             {/* Logo image eka methana danna */}
             <Image 
               src="/logo.jpeg" 
               alt="Norma Beauti Logo" 
               width={80} 
               height={80} 
               className="object-cover"
             />
        </div>

        {/* LOGIN & SIGN UP BUTTONS (Top Right) */}
        <div className="flex gap-4">
          <Link href="/login">
            <button className="px-6 py-2 rounded-full border-2 border-[#134B5F] text-[#134B5F] font-bold text-sm hover:bg-[#134B5F] hover:text-white transition duration-300">
              LOGIN
            </button>
          </Link>
          
          <Link href="/register">
            <button className="px-6 py-2 rounded-full bg-[#134B5F] text-white font-bold text-sm shadow-lg hover:bg-[#0f3a4a] transition duration-300">
              SIGN UP
            </button>
          </Link>
        </div>
      </nav>

      {/* 3. CENTER CONTENT (Text) */}
      <div className="relative z-10 flex flex-col items-center justify-center text-center h-[calc(100vh-150px)] px-4">
        
        {/* Welcome Text */}
        <div className="flex items-center gap-4 mb-6 opacity-80">
            <div className="h-[1px] w-12 bg-[#333333]"></div>
            <h5 className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-[#333333]">
                WELCOME TO NORMA BEAUTI
            </h5>
            <div className="h-[1px] w-12 bg-[#333333]"></div>
        </div>

        {/* Main Headline */}
        <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight text-[#1a1a1a]">
          Elegance is the only beauty <br />
          <span className="italic font-normal text-[#483D58] block mt-2">that never fades</span>
        </h1>

        {/* Description */}
        <p className="text-gray-800 text-sm md:text-lg max-w-xl font-light tracking-wide leading-relaxed">
          Discover our exclusive collection of premium cosmetics, jewelry and beauti item designed for the modern muse.
        </p>

      </div>
    </div>
  );
}