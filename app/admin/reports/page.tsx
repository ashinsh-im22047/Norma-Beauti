"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReportsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('This Month');

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#4A1D46] p-8">
      
      {/* Decorative Background */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 px-4 py-2 bg-white/50 rounded-full font-bold shadow-sm hover:bg-white transition flex items-center gap-2">
            <span>←</span> Back
        </button>

        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold font-serif text-[#4A1D46]">Reports & Analytics</h1>
            
            {/* FILTER DROPDOWN */}
            <div className="flex items-center gap-3 bg-white/50 px-4 py-2 rounded-full shadow-sm border border-white/60">
                <span className="text-xs font-bold text-[#7B2C62] uppercase">Filter By:</span>
                <select 
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                    className="bg-transparent text-[#4A1D46] font-bold outline-none cursor-pointer text-sm"
                >
                    <option>Today</option>
                    <option>This Week</option>
                    <option>This Month</option>
                    <option>Last 3 Months</option>
                    <option>This Year</option>
                </select>
            </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Report Card 1 */}
            <div className="bg-white/40 p-8 rounded-[2.5rem] border border-white/60 shadow-xl backdrop-blur-md">
                <h3 className="font-bold text-xl mb-6 text-[#4A1D46]">Sales Overview ({filter})</h3>
                <div className="h-64 flex items-end gap-6 justify-between px-6 pb-4 border-b border-[#D883B7]/20">
                    <div className="w-12 bg-[#D883B7]/40 h-[40%] rounded-t-xl hover:h-[45%] transition-all relative group">
                        <span className="absolute -top-6 left-2 text-xs font-bold opacity-0 group-hover:opacity-100">40%</span>
                    </div>
                    <div className="w-12 bg-[#D883B7]/60 h-[60%] rounded-t-xl hover:h-[65%] transition-all relative group">
                        <span className="absolute -top-6 left-2 text-xs font-bold opacity-0 group-hover:opacity-100">60%</span>
                    </div>
                    <div className="w-12 bg-[#9B5DE5] h-[85%] rounded-t-xl hover:h-[90%] transition-all shadow-lg relative group">
                        <span className="absolute -top-6 left-2 text-xs font-bold opacity-0 group-hover:opacity-100">85%</span>
                    </div>
                    <div className="w-12 bg-[#D883B7]/50 h-[50%] rounded-t-xl hover:h-[55%] transition-all relative group">
                        <span className="absolute -top-6 left-2 text-xs font-bold opacity-0 group-hover:opacity-100">50%</span>
                    </div>
                    <div className="w-12 bg-[#D883B7]/80 h-[75%] rounded-t-xl hover:h-[80%] transition-all relative group">
                        <span className="absolute -top-6 left-2 text-xs font-bold opacity-0 group-hover:opacity-100">75%</span>
                    </div>
                </div>
                <div className="flex justify-between mt-4 text-xs font-bold text-[#7B2C62] opacity-70">
                    <span>Week 1</span><span>Week 2</span><span>Week 3</span><span>Week 4</span><span>Week 5</span>
                </div>
            </div>

            {/* Report Card 2 */}
            <div className="bg-white/40 p-8 rounded-[2.5rem] border border-white/60 shadow-xl backdrop-blur-md">
                 <h3 className="font-bold text-xl mb-6 text-[#4A1D46]">User Demographics</h3>
                 <div className="flex items-center justify-center h-56 relative">
                    <div className="w-40 h-40 rounded-full border-[12px] border-[#9B5DE5] border-t-[#D883B7] border-l-[#D883B7] flex items-center justify-center shadow-inner">
                        <div className="text-center">
                            <span className="block text-2xl font-bold text-[#4A1D46]">1,203</span>
                            <span className="text-xs text-[#7B2C62]">Users</span>
                        </div>
                    </div>
                 </div>
                 <div className="flex justify-center gap-6 mt-4 text-sm font-bold">
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#D883B7]"></span>
                        <span className="text-[#4A1D46]">Female (70%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#9B5DE5]"></span>
                        <span className="text-[#4A1D46]">Male (30%)</span>
                    </div>
                 </div>
            </div>
        </div>
      </div>
    </div>
  );
}