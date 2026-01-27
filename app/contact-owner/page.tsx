"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';

export default function ContactOwnerPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46]">
      <CustomerHeader />
      <main className="container mx-auto px-6 py-12 relative z-10 flex justify-center">
        <div className="w-full max-w-3xl bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-10 shadow-2xl text-center">
            
            <button onClick={() => router.back()} className="absolute top-8 left-8 w-10 h-10 flex items-center justify-center rounded-full bg-white/50 hover:bg-white shadow-sm">←</button>
            
            <h1 className="text-3xl font-serif font-bold mb-2">Contact Us</h1>
            <p className="text-[#D883B7] mb-8">We'd love to hear from you.</p>

            <form className="flex flex-col gap-4 text-left" onSubmit={(e) => e.preventDefault()}>
                <div>
                    <label className="text-xs font-bold ml-2">SUBJECT</label>
                    <input type="text" className="w-full bg-white/50 px-6 py-3 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-[#D883B7]" placeholder="Inquiry about..." />
                </div>
                <div>
                    <label className="text-xs font-bold ml-2">MESSAGE</label>
                    <textarea className="w-full bg-white/50 px-6 py-3 rounded-xl border border-white/50 focus:outline-none focus:ring-2 focus:ring-[#D883B7] h-32" placeholder="Type your message here..."></textarea>
                </div>
                <button className="bg-[#4A1D46] text-white font-bold py-3 rounded-xl shadow-lg hover:opacity-90 mt-2">Send Message</button>
            </form>
        </div>
      </main>
    </div>
  );
}