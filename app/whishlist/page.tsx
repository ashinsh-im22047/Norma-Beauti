"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';

export default function WishlistPage() {
  const router = useRouter();

  return (
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient (Matching Profile & Shop)
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46]">
      
      <CustomerHeader />
      
      {/* Decorative Background Glows */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="container mx-auto px-6 py-12 relative z-10 flex justify-center">
        
        {/* Glassmorphism Wishlist Container */}
        <div className="w-full max-w-5xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
            
            {/* Header Section */}
            <div className="flex items-center justify-between mb-8 border-b border-[#D883B7]/30 pb-4">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => router.back()} 
                        className="w-10 h-10 flex items-center justify-center rounded-full bg-white/50 text-[#4A1D46] hover:bg-white transition shadow-sm"
                    >
                        ←
                    </button>
                    <h1 className="text-3xl font-serif font-bold text-[#4A1D46]">
                        Your Wishlist
                    </h1>
                </div>
            </div>
            
            {/* Wishlist Content Placeholder */}
            <div className="text-center py-20 opacity-70 flex flex-col items-center gap-6">
                <div className="w-24 h-24 bg-white/30 rounded-full flex items-center justify-center text-6xl shadow-inner">
                    ❤️
                </div>
                <div>
                    <p className="text-[#7B2C62] italic text-lg font-medium">Your wishlist is currently empty.</p>
                    <p className="text-sm text-[#4A1D46] mt-2">Save items you love here to buy later.</p>
                </div>
                
                <button 
                    onClick={() => router.push('/shop')}
                    className="mt-4 px-8 py-3 rounded-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all"
                >
                    Browse Products
                </button>
            </div>

        </div>
      </main>
    </div>
  );
}