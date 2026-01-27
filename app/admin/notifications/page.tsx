"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const router = useRouter();

  const notifications = [
    { id: 1, type: "Warning", title: "Low Stock Warning", message: "Product 'Rose Gold Toner' is running low (Qty: 3).", time: "2 hours ago" },
    { id: 2, type: "Info", title: "New User Registration", message: "5 new users registered today.", time: "5 hours ago" },
    { id: 3, type: "Success", title: "Sales Milestone", message: "You reached LKR 100,000 in sales this week!", time: "1 day ago" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46] p-8">
      
      {/* Decorative Background */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 px-4 py-2 bg-white/50 rounded-full font-bold shadow-sm hover:bg-white transition flex items-center gap-2">
            <span>←</span> Back
        </button>

        <h1 className="text-3xl font-bold font-serif mb-6 text-[#4A1D46]">Notifications</h1>
        
        <div className="bg-white/40 rounded-[2.5rem] p-8 backdrop-blur-xl border border-white/60 shadow-2xl flex flex-col gap-4">
            {notifications.map((notif) => (
                <div key={notif.id} className="flex items-center justify-between bg-white/50 p-6 rounded-3xl border border-white/50 hover:shadow-md transition">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner ${
                            notif.type === 'Warning' ? 'bg-red-100 text-red-500' :
                            notif.type === 'Success' ? 'bg-green-100 text-green-600' :
                            'bg-blue-100 text-blue-500'
                        }`}>
                            {notif.type === 'Warning' ? '⚠️' : notif.type === 'Success' ? '🎉' : 'ℹ️'}
                        </div>
                        <div>
                            <h4 className="font-bold text-[#4A1D46] text-lg">{notif.title}</h4>
                            <p className="text-sm text-[#7B2C62]">{notif.message}</p>
                            <p className="text-xs text-gray-400 mt-1 font-bold">{notif.time}</p>
                        </div>
                    </div>
                    
                    <button className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-6 py-2 rounded-full font-bold text-sm shadow-md hover:opacity-90 transition">
                        View
                    </button>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}