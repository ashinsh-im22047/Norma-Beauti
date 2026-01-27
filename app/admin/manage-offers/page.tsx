"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ManageOffers() {
  const router = useRouter();

  // Dummy Offers
  const offers = [
    { id: 1, title: "New Year Sale", discount: "20% OFF", status: "Active", code: "NY2024" },
    { id: 2, title: "Flash Deal", discount: "Buy 1 Get 1", status: "Expired", code: "FLASHB1G1" },
    { id: 3, title: "Member Exclusive", discount: "Free Shipping", status: "Active", code: "FREESHIP" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46] p-8">
      
      {/* Decorative Background */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 px-4 py-2 bg-white/50 rounded-full font-bold shadow-sm hover:bg-white transition flex items-center gap-2">
            <span>←</span> Back
        </button>

        <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold font-serif text-[#4A1D46]">Manage Offers</h1>
            <button className="bg-[#4A1D46] text-white px-6 py-3 rounded-2xl font-bold shadow-lg hover:opacity-90">
                + Create New Offer
            </button>
        </div>
        
        <div className="grid gap-4">
            {offers.map((offer) => (
                <div key={offer.id} className="bg-white/40 p-6 rounded-[2rem] flex justify-between items-center backdrop-blur-xl border border-white/60 shadow-lg group hover:bg-white/50 transition">
                    
                    <div className="flex items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-inner ${
                            offer.status === 'Active' ? 'bg-[#9B5DE5]/20 text-[#9B5DE5]' : 'bg-gray-200 text-gray-400'
                        }`}>
                            🏷️
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-[#4A1D46]">{offer.title}</h3>
                            <div className="flex items-center gap-3 mt-1">
                                <span className="text-sm font-bold text-[#D883B7] bg-[#D883B7]/10 px-2 py-1 rounded-lg border border-[#D883B7]/20">Code: {offer.code}</span>
                                <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                                    offer.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'
                                }`}>
                                    {offer.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <span className="text-2xl font-bold text-[#4A1D46]">{offer.discount}</span>
                        
                        {/* 3-DOTS OPTION BAR */}
                        <button className="w-10 h-10 rounded-full bg-white/50 hover:bg-white flex items-center justify-center text-[#4A1D46] font-bold shadow-sm transition">
                            ⋮
                        </button>
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}