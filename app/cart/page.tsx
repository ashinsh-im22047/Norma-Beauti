"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';

export default function CartPage() {
  const router = useRouter();
  const [showSummary, setShowSummary] = useState(false);

  // Dummy Cart Data
  const [cartItems, setCartItems] = useState([
    { id: 1, name: "Radiant Glow Serum", price: 4500, quantity: 1, image: "✨" },
    { id: 2, name: "Rose Gold Toner", price: 2800, quantity: 2, image: "🌹" },
    { id: 3, name: "Hydrating Face Mask", price: 1500, quantity: 1, image: "🧖‍♀️" },
  ]);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const shipping = 350; 
  const total = subtotal + shipping;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46]">
      <CustomerHeader />
      
      {/* Decorative Background */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="container mx-auto px-6 py-12 relative z-10 flex justify-center">
        
        {/* --- VIEW 1: CART LIST --- */}
        {!showSummary ? (
            <div className="w-full max-w-4xl">
                
                {/* 1. ATTRACTIVE TITLE BOX */}
                <div className="bg-gradient-to-r from-[#4A1D46] to-[#2E1029] text-white p-6 rounded-3xl shadow-xl flex items-center justify-between mb-8 relative overflow-hidden">
                    <div className="relative z-10 flex items-center gap-4">
                        <button onClick={() => router.back()} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/20 hover:bg-white/40 transition">←</button>
                        <div>
                            <h1 className="text-2xl font-serif font-bold tracking-wide">Your Shopping Cart</h1>
                            <p className="text-xs text-[#D883B7] opacity-90">Review your items before checkout</p>
                        </div>
                    </div>
                    {/* Decorative Circle in Header */}
                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#D883B7]/20 rounded-full blur-2xl"></div>
                </div>

                {/* 2. CART CONTAINER */}
                <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl">
                    <div className="flex flex-col gap-5">
                        {cartItems.map((item) => (
                            // PRODUCT CARD: Soft Pink Background
                            <div key={item.id} className="flex flex-col md:flex-row items-center justify-between bg-[#FFF0F5] p-5 rounded-3xl border border-[#F8E1EB] shadow-sm hover:shadow-md hover:scale-[1.01] transition-all">
                                
                                <div className="flex items-center gap-6 w-full md:w-auto">
                                    <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-white">
                                        {item.image}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-[#4A1D46]">{item.name}</h3>
                                        <p className="text-[#D883B7] font-bold text-sm">LKR {item.price.toLocaleString()}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6 mt-4 md:mt-0 ml-auto">
                                    <div className="flex items-center bg-white rounded-full px-3 py-1 shadow-sm border border-gray-200">
                                        <button className="text-[#4A1D46] font-bold px-2 hover:text-[#9B5DE5]">-</button>
                                        <span className="mx-2 text-sm font-bold">{item.quantity}</span>
                                        <button className="text-[#4A1D46] font-bold px-2 hover:text-[#9B5DE5]">+</button>
                                    </div>
                                    <button className="w-8 h-8 flex items-center justify-center rounded-full bg-red-100 text-red-500 hover:bg-red-200 transition">✕</button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Bottom Total & Action */}
                    <div className="mt-8 flex justify-end items-center gap-6 pt-6 border-t border-[#D883B7]/30">
                        <div className="text-right">
                            <p className="text-xs text-[#7B2C62] uppercase tracking-wider">Subtotal</p>
                            <p className="text-2xl font-bold text-[#4A1D46]">LKR {subtotal.toLocaleString()}</p>
                        </div>
                        
                        <button 
                            onClick={() => setShowSummary(true)}
                            className="px-10 py-4 rounded-2xl bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all tracking-wide"
                        >
                            Buy Now
                        </button>
                    </div>
                </div>
            </div>
        ) : (
            
            // --- VIEW 2: ORDER SUMMARY (Centered Card) ---
            <div className="w-full max-w-md animate-fade-in-up">
                <div className="bg-white/60 backdrop-blur-2xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-serif font-bold text-[#4A1D46]">Order Summary</h2>
                        <p className="text-sm text-[#7B2C62]">You are one step away!</p>
                    </div>

                    {/* Summary Details */}
                    <div className="bg-white/50 rounded-3xl p-6 border border-white/50 mb-8 space-y-3">
                        <div className="flex justify-between text-sm text-[#7B2C62]">
                            <span>Items Total</span>
                            <span className="font-bold">LKR {subtotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-[#7B2C62]">
                            <span>Shipping</span>
                            <span className="font-bold">LKR {shipping}</span>
                        </div>
                        <div className="border-t border-[#D883B7]/20 my-2"></div>
                        <div className="flex justify-between text-xl font-bold text-[#4A1D46]">
                            <span>Grand Total</span>
                            <span>LKR {total.toLocaleString()}</span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-3">
                        {/* NAVIGATE TO PAYMENT PAGE */}
                        <button 
                            onClick={() => router.push('/payment')}
                            className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all tracking-wide text-lg"
                        >
                            Confirm Purchase
                        </button>
                        
                        {/* BACK TO CART VIEW */}
                        <button 
                            onClick={() => setShowSummary(false)}
                            className="w-full py-3 rounded-2xl bg-white/50 text-[#4A1D46] font-bold shadow-sm hover:bg-white transition-all border border-white/60"
                        >
                            Back to Cart
                        </button>
                    </div>
                </div>
            </div>
        )}
      </main>
    </div>
  );
}