"use client";

import React from 'react';
import CustomerHeader from '@/components/CustomerHeader';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46] pb-20">
      <CustomerHeader />
      
      <main className="container mx-auto px-6 py-8 max-w-5xl">
        
        {/* --- ELEGANT HERO SECTION --- */}
        <div className="bg-[#4A1D46]/95 backdrop-blur-xl rounded-[2rem] p-10 md:p-12 shadow-2xl border border-white/20 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D883B7]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9B5DE5]/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-white/10 px-5 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase mb-4 text-[#F3E5F5] shadow-inner">
                    Get in Touch
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-wide mb-3">Contact Us</h1>
                <p className="text-[#D883B7] font-medium text-lg max-w-md mx-auto md:mx-0">
                    We'd love to hear from you. Reach out to the store owner directly for any inquiries.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-4xl shadow-inner border border-white/20 relative group hover:scale-105 transition-transform duration-500">
                    <span className="animate-pulse drop-shadow-[0_0_15px_rgba(216,131,183,0.6)]">✉️</span>
                </div>
            </div>
        </div>

        {/* --- CONTACT CARD --- */}
        <div className="max-w-2xl mx-auto bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/60 p-10 text-center relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5]"></div>
            
            <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-sm border border-pink-100">
                💌
            </div>
            
            <h2 className="text-3xl font-serif font-bold text-[#4A1D46] mb-2">Direct Email</h2>
            <p className="text-[#7B2C62] font-medium mb-8">For support, custom requests, or general inquiries, please email the owner directly at the address below.</p>
            
            <div className="bg-[#F3E5F5] py-6 px-4 rounded-3xl border border-pink-100 mb-8 inline-block w-full">
                <p className="text-xl md:text-2xl font-bold text-[#880e4f] tracking-wide break-all">
                    normabeauti123@gmail.com
                </p>
            </div>
            
            <a 
                href="mailto:normabeauti123@gmail.com" 
                className="inline-block px-10 py-4 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all border border-white/20"
            >
                Send an Email Now
            </a>
        </div>

      </main>
    </div>
  );
}