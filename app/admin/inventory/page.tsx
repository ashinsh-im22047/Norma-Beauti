"use client";

import React, { useState } from "react";
import Link from "next/link"; 

export default function InventoryPage() {
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const toggleMenu = (cardName: string) => {
    setOpenMenu(openMenu === cardName ? null : cardName);
  };

  return (
    // MAIN PAGE CONTAINER (Lavender Background)
    <div className="min-h-screen bg-[#F3E6EF] flex flex-col font-sans">
      
      {/* --- 1. ADMIN PANEL HEADER (Dark Teal) --- */}
      <header className="w-full bg-[#134B5F] text-white py-4 px-10 flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          {/* Logo Placeholder */}
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
      <main className="flex-1 p-10 flex flex-col items-center">
        
        {/* Page Title */}
        <div className="w-full max-w-6xl mb-10">
          <h1 className="text-4xl font-serif text-gray-900 mb-2">Inventory Management</h1>
          <p className="text-gray-600 text-base">Manage your products, ready-made & custom boxes.</p>
        </div>

        {/* --- CARDS GRID --- */}
        <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl">
          
          {/* CARD 1: Individual Products (Reference Size) */}
          <div className="w-[320px] flex flex-col relative">
            <Link href="/admin/inventory/individual-products" className="group block">
              {/* Changed min-h to fixed h-[260px] */}
              <div className="bg-[#94A3B8] rounded-2xl p-8 h-[260px] relative shadow-sm flex flex-col justify-center transition group-hover:-translate-y-1 group-hover:shadow-md cursor-pointer">
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu("custom");
                  }}
                  className="absolute top-4 right-4 text-2xl text-gray-700 hover:text-black z-10 p-2"
                >
                  ⋮
                </button>
                
                {openMenu === "custom" && (
                  <div className="absolute top-12 right-4 bg-white rounded-lg shadow-xl border border-gray-100 w-32 overflow-hidden z-50 flex flex-col">
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      className="text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600"
                    >
                      Delete
                    </button>
                  </div>
                )}

                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                  💄
                </div>
                
                <h3 className="text-xl font-bold text-black mb-2">Individual Products</h3>
                <p className="text-gray-800 text-sm leading-relaxed">Manage Individual Products.</p>
              </div>
            </Link>
          </div>

          {/* CARD 2: Ready Made Gift Box */}
          <div className="w-[320px] flex flex-col">
            {/* Changed min-h to fixed h-[260px] */}
            <div className="bg-[#94A3B8] rounded-2xl p-8 h-[260px] relative shadow-sm flex flex-col justify-center transition hover:-translate-y-1">
              <button 
                onClick={() => toggleMenu("ready")}
                className="absolute top-4 right-4 text-2xl text-gray-700 hover:text-black z-10"
              >
                ⋮
              </button>
              
              {openMenu === "ready" && (
                <div className="absolute top-12 right-4 bg-white rounded-lg shadow-xl border border-gray-100 w-32 overflow-hidden z-50 flex flex-col">
                  <button className="text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600">Edit</button>
                  <button className="text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">Delete</button>
                </div>
              )}

              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                🎁
              </div>

              <h3 className="text-xl font-bold text-black mb-2">Ready Made Gift Box</h3>
              <p className="text-gray-800 text-sm leading-relaxed">Inventory for pre-packed gift boxes.</p>
            </div>
            
            {/* BUTTON (Outside Card) */}
            <button className="mt-4 bg-[#403b58] hover:bg-[#2e2a40] text-white font-bold py-3 px-4 rounded-lg shadow-md transition w-full">
              + Add New 
            </button>
          </div>

          {/* CARD 3: Customizable Gift Boxes */}
          <div className="w-[320px] flex flex-col">
            {/* Changed min-h to fixed h-[260px] */}
            <div className="bg-[#94A3B8] rounded-2xl p-8 h-[260px] relative shadow-sm flex flex-col justify-center transition hover:-translate-y-1">
              <button 
                onClick={() => toggleMenu("suppliers")}
                className="absolute top-4 right-4 text-2xl text-gray-700 hover:text-black z-10"
              >
                ⋮
              </button>
              
              {openMenu === "suppliers" && (
                <div className="absolute top-12 right-4 bg-white rounded-lg shadow-xl border border-gray-100 w-32 overflow-hidden z-50 flex flex-col">
                  <button className="text-left px-4 py-2 text-sm hover:bg-gray-100 text-blue-600">Edit</button>
                  <button className="text-left px-4 py-2 text-sm hover:bg-gray-100 text-red-600">Delete</button>
                </div>
              )}

              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-2xl mb-4 shadow-sm">
                ⚙️
              </div>

              <h3 className="text-xl font-bold text-black mb-2">Customizable Gift Boxes</h3>
              <p className="text-gray-800 text-sm leading-relaxed">Manage List of products which are available for customize.</p>
            </div>
          </div>

        </div>
      </main>

      {/* Overlay to close menu when clicking outside */}
      {openMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpenMenu(null)}
        ></div>
      )}
    </div>
  );
}