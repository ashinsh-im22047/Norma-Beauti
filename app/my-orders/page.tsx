"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';

export default function MyOrdersPage() {
  const router = useRouter();

  const orders = [
    { id: "#ORD-8821", date: "2024-01-25", total: "LKR 8,500", status: "Processing", items: 3 },
    { id: "#ORD-8805", date: "2023-12-10", total: "LKR 12,250", status: "Delivered", items: 5 },
    { id: "#ORD-8790", date: "2023-11-05", total: "LKR 4,100", status: "Cancelled", items: 1 },
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
                        <h1 className="text-2xl font-serif font-bold tracking-wide">My Orders</h1>
                        <p className="text-xs text-[#D883B7] opacity-90">Track your past purchases</p>
                    </div>
                </div>
                {/* Decorative Circle */}
                <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#D883B7]/20 rounded-full blur-2xl"></div>
            </div>

            {/* 2. ORDERS CONTAINER */}
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 shadow-2xl">
                <div className="flex flex-col gap-5">
                    {orders.map((order) => (
                        // ORDER CARD: Soft Pink Background
                        <div key={order.id} className="flex flex-col md:flex-row justify-between items-center bg-[#FFF0F5] p-6 rounded-3xl border border-[#F8E1EB] shadow-sm hover:shadow-md transition hover:scale-[1.01]">
                            
                            <div className="flex flex-col gap-1 w-full md:w-auto">
                                <div className="flex items-center gap-3">
                                    <h3 className="text-lg font-bold text-[#4A1D46]">{order.id}</h3>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                        order.status === 'Processing' ? 'bg-yellow-100 text-yellow-700' :
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                                <p className="text-sm text-[#7B2C62] opacity-80">Placed on: <span className="font-bold">{order.date}</span></p>
                                <p className="text-xs text-gray-500">{order.items} Items included</p>
                            </div>

                            <div className="flex items-center gap-8 mt-4 md:mt-0 w-full md:w-auto justify-between md:justify-end">
                                <span className="font-bold text-xl text-[#4A1D46]">{order.total}</span>
                                <button className="text-sm font-bold text-[#D883B7] border border-[#D883B7] px-4 py-2 rounded-full hover:bg-[#D883B7] hover:text-white transition">
                                    View Details
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