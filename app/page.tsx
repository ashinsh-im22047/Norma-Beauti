"use client";

import React from 'react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen relative font-sans overflow-hidden flex flex-col">
      
      {/* 1. BLURRED BACKGROUND */}
      <div 
        className="absolute inset-0 z-0"
        style={{ 
            backgroundImage: "url('/homePageHeaderBackground.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(4px)', 
            transform: 'scale(1.02)' 
        }} 
      >
        <div className="absolute inset-0 bg-white/5"></div>
      </div>

      {/* 2. HEADER (Only Logo, Login, Signup) */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-8 py-4 
                      bg-white/10 backdrop-blur-md border-b border-white/20 shadow-sm">
        
        {/* Logo */}
        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/50 shadow-md">
             <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <Link href="/login">
            <button className="px-6 py-2 rounded-full border border-white/50 bg-white/20 text-[#134B5F] font-bold text-sm 
                               hover:bg-[#134B5F] hover:text-white transition duration-300">
              LOGIN
            </button>
          </Link>
          <Link href="/register">
            <button className="px-6 py-2 rounded-full bg-[#134B5F] text-white font-bold text-sm shadow-md 
                               hover:bg-[#0e3645] transition duration-300">
              SIGN UP
            </button>
          </Link>
        </div>
      </nav>

      {/* 3. CENTER CONTENT (Glass Card) */}
      <div className="relative z-10 flex-grow flex items-center justify-center px-4">
        <div className="p-12 md:p-16 rounded-3xl text-center max-w-4xl mx-auto
                        bg-white/20 backdrop-blur-xl border border-white/40 shadow-2xl">
          
          <div className="flex items-center justify-center gap-4 mb-6 opacity-80">
              <div className="h-[1px] w-12 bg-gray-700"></div>
              <h5 className="text-xs md:text-sm uppercase tracking-[0.2em] font-bold text-gray-800">
                  WELCOME TO NORMA BEAUTI
              </h5>
              <div className="h-[1px] w-12 bg-gray-700"></div>
          </div>

          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight text-gray-900 drop-shadow-sm">
            Elegance is the only beauty <br />
            <span className="italic font-normal text-[#2e2e2e] block mt-2">that never fades</span>
          </h1>

          <p className="text-gray-800 text-sm md:text-lg max-w-xl mx-auto font-medium tracking-wide leading-relaxed">
           Discover our exclusive collection of premium cosmetics, jewelry and beauti items designed for the modern muse.
          </p>

          <div className="mt-8">
             <Link href="/shop">
                <button className="px-8 py-3 rounded-full bg-white/40 text-[#134B5F] font-bold border border-white/50 
                                   hover:bg-[#134B5F] hover:text-white transition duration-300 shadow-lg">
                   VISIT SHOP →
                </button>
             </Link>
          </div>

        </div>
      </div>
    </div>
  );
}