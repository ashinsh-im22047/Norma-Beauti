"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';

export default function WishlistPage() {
  const router = useRouter();

  // Dummy Wishlist Data
  const wishlistItems = [
    { id: 1, name: "Radiant Glow Serum", price: "LKR 4,500", status: "In Stock", image: "✨" },
    { id: 2, name: "Silk Touch Foundation", price: "LKR 3,200", status: "Low Stock", image: "🧴" },
    { id: 3, name: "Midnight Recovery Oil", price: "LKR 5,100", status: "In Stock", image: "🌙" },
    { id: 4, name: "Velvet Lip Tint", price: "LKR 2,100", status: "Out of Stock", image: "💄" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46]">
      <CustomerHeader />
      
      {/* Decorative Background */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="container mx-auto px-6 py-12 relative z-10 flex justify-center">
        <div className="w-full max-w-5xl">
            
            {/* 1. ATTRACTIVE TITLE BOX */}
            <div className="bg-gradient-to-r from-[#4A1D46] to-[#2E1029] text-white p-6 rounded-3xl shadow-xl flex items-center justify-between mb-8 relative overflow-hidden animate-fade-in-up">
                <div className="relative z-10 flex items-center gap-4">
                    <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition">←</button>
                    <div>
                        <h1 className="text-2xl font-serif font-bold tracking-wide">Your Wishlist</h1>
                        <p className="text-xs text-[#D883B7] opacity-90">Saved items for later</p>
                    </div>
                </div>
                {/* Decorative Circle */}
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#D883B7]/20 rounded-full blur-2xl"></div>
            </div>

            {/* 2. WISHLIST CONTAINER */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {wishlistItems.map((item) => (
                        // PRODUCT CARD: Soft Pink Background
                        <div key={item.id} className="flex items-center justify-between bg-[#FFF0F5] p-5 rounded-3xl border border-[#F8E1EB] shadow-sm hover:shadow-md transition hover:scale-[1.02]">
                            
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-white">
                                    {item.image}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-[#4A1D46]">{item.name}</h3>
                                    <p className="text-[#D883B7] font-bold text-sm">{item.price}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                                        item.status === 'In Stock' ? 'bg-green-100 text-green-700' :
                                        item.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {item.status}
                                    </span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <button className="w-10 h-10 rounded-full bg-[#4A1D46] text-white flex items-center justify-center shadow-md hover:bg-[#9B5DE5] transition" title="Add to Cart">
                                    🛒
                                </button>
                                <button className="w-10 h-10 rounded-full bg-white text-red-400 border border-red-200 flex items-center justify-center shadow-sm hover:bg-red-50 transition" title="Remove">
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}