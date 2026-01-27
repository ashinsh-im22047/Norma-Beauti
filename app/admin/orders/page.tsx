"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function ManageOrders() {
  const router = useRouter();

  // Dummy Orders
  const orders = [
    { id: "ORD-9901", customer: "Prabhani Maheeka", items: "3 items", total: "LKR 12,500", status: "Pending", date: "2024-01-27" },
    { id: "ORD-9902", customer: "Jane Doe", items: "1 item", total: "LKR 4,200", status: "Shipped", date: "2024-01-26" },
    { id: "ORD-9903", customer: "John Smith", items: "5 items", total: "LKR 25,000", status: "Pending", date: "2024-01-27" },
    { id: "ORD-9904", customer: "Sarah Lee", items: "2 items", total: "LKR 8,900", status: "Delivered", date: "2024-01-25" },
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

        <h1 className="text-3xl font-bold font-serif mb-6 text-[#4A1D46]">Manage Orders</h1>
        
        <div className="bg-white/40 rounded-[2.5rem] p-8 backdrop-blur-xl border border-white/60 shadow-2xl">
          <table className="w-full text-left border-collapse">
              <thead className="border-b border-[#D883B7]/30">
                  <tr>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Order ID</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Customer</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Items</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Date</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Total</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Status</th>
                      <th className="p-4 text-xs font-bold text-[#7B2C62] uppercase tracking-wider">Action</th>
                  </tr>
              </thead>
              <tbody>
                  {orders.map((order) => (
                      <tr key={order.id} className="border-b border-gray-200/30 hover:bg-white/40 transition">
                          <td className="p-4 font-bold text-[#4A1D46]">{order.id}</td>
                          <td className="p-4">{order.customer}</td>
                          <td className="p-4 text-sm">{order.items}</td>
                          <td className="p-4 text-sm text-gray-500">{order.date}</td>
                          <td className="p-4 font-bold">{order.total}</td>
                          <td className="p-4">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                                  order.status === 'Pending' ? 'bg-yellow-200/80 text-yellow-800' : 
                                  order.status === 'Shipped' ? 'bg-blue-200/80 text-blue-800' :
                                  'bg-green-200/80 text-green-800'
                              }`}>
                                  {order.status}
                              </span>
                          </td>
                          <td className="p-4">
                              <button className="text-xs bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-4 py-2 rounded-full font-bold shadow-md hover:opacity-90 transition">
                                Process
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