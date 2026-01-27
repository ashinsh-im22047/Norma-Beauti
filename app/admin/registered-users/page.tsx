"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function RegisteredUsers() {
  const router = useRouter();

  // Filtered Dummy Data (Admins removed)
  const customers = [
    { id: 1, name: "Prabhani Maheeka", email: "prabhani@example.com", phone: "+94 77 123 4567", joined: "2023-10-15" },
    { id: 2, name: "John Doe", email: "john@example.com", phone: "+94 71 987 6543", joined: "2024-01-02" },
    { id: 3, name: "Sarah Lee", email: "sarah@example.com", phone: "+94 70 111 2222", joined: "2024-01-20" },
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

        <h1 className="text-3xl font-bold font-serif mb-6 text-[#4A1D46]">Customer List</h1>
        
        <div className="bg-white/40 rounded-[2.5rem] p-8 backdrop-blur-xl border border-white/60 shadow-2xl">
          <table className="w-full text-left border-collapse">
              <thead className="border-b border-[#D883B7]/30">
                  <tr>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">ID</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Name</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Email</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Phone</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Joined Date</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Action</th>
                  </tr>
              </thead>
              <tbody>
                  {customers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-200/30 hover:bg-white/40 transition">
                          <td className="p-4 font-bold text-[#4A1D46]">{user.id}</td>
                          <td className="p-4 font-bold">{user.name}</td>
                          <td className="p-4 text-sm text-gray-600">{user.email}</td>
                          <td className="p-4 text-sm text-gray-600">{user.phone}</td>
                          <td className="p-4 text-sm text-gray-600">{user.joined}</td>
                          <td className="p-4">
                              <button className="text-xs bg-white border border-[#D883B7] text-[#D883B7] px-4 py-2 rounded-full font-bold shadow-sm hover:bg-[#D883B7] hover:text-white transition">
                                More Details
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}