"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function IndividualProductsPage() {
  const router = useRouter();

  return (
    // MAIN PAGE CONTAINER (Lavender Background)
    <div className="min-h-screen bg-[#F3E6EF] flex flex-col font-sans">
      
      {/* --- 1. ADMIN PANEL HEADER (Matches Previous Page) --- */}
      <header className="w-full bg-[#134B5F] text-white py-4 px-10 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full border border-white flex items-center justify-center bg-white/20 font-bold text-lg">
            N
          </div>
          <span className="font-bold tracking-wider text-lg">ADMIN PANEL</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm opacity-90">Hello, Admin</span>
          <button className="bg-red-500 hover:bg-red-600 text-white text-xs font-bold py-2 px-5 rounded-full transition">
            LOGOUT
          </button>
        </div>
      </header>

      {/* --- 2. MAIN CONTENT AREA --- */}
      <main className="flex-1 p-8 w-full max-w-7xl mx-auto">
        
        {/* Title Section */}
        <div className="flex items-center justify-center relative mb-8">
            {/* Back Button */}
            <button 
                onClick={() => router.back()}
                className="absolute left-0 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-md transition"
            >
                ← Back
            </button>
            
            <h1 className="text-4xl font-serif text-black tracking-wide">Products</h1>
        </div>

        {/* Content Grid: Left Controls | Right List */}
        <div className="flex flex-col md:flex-row gap-8 items-start justify-center mt-10">
            
            {/* LEFT SIDE: Controls Card */}
            <div className="bg-white/80 backdrop-blur-sm rounded-[30px] p-8 w-full md:w-[350px] shadow-lg flex flex-col gap-6 items-center">
                
                {/* Add New Button */}
                <button className="bg-[#3D315B] hover:bg-[#2a2240] text-white font-bold py-3 px-8 rounded-full shadow-md transition w-full max-w-[200px]">
                    + Add New
                </button>

                {/* Search Bar */}
                <div className="relative w-full">
                    <input 
                        type="text" 
                        placeholder="Search Product" 
                        className="w-full bg-[#D6A2B7] placeholder-gray-700 text-black py-3 px-5 rounded-full focus:outline-none focus:ring-2 focus:ring-[#3D315B] shadow-inner"
                    />
                    {/* Search Icon */}
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl">
                        🔍
                    </span>
                </div>
            </div>

            {/* RIGHT SIDE: Empty State (No Box Picture) */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[300px] text-center opacity-70 mt-10 md:mt-0">
                
                {/* REMOVED THE ICON AS REQUESTED */}
                {/* <div className="text-6xl mb-4">📦</div> */} 

                <h3 className="text-xl font-bold text-gray-600 mb-2">No products found</h3>
                <p className="text-gray-500">Click "+Add New" to add your first item!</p>
            </div>

        </div>

      </main>
    </div>
  );
}