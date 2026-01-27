"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image'; // Ensure Image is imported for the logo

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  useEffect(() => {
    // 1. Check if user is actually logged in as ADMIN
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    
    // Optional: Security check (uncomment if needed)
    // if (role !== 'ADMIN') { router.push('/login'); }

    if (name) setAdminName(name);
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = '/'; 
  };

  const handleAddAdmin = () => {
    // Logic to add new admin (e.g., redirect to a registration page or open modal)
    alert("Redirecting to Add New Admin page...");
    // router.push('/register?role=admin'); // Example route
  };

  // Dashboard Menu Items
  const menuItems = [
    { title: "Manage Inventory", desc: "Products, Ready-made & Custom Boxes.", icon: "📦", path: "/admin/inventory" },
    { title: "Manage Orders", desc: "View and process pending customer orders.", icon: "🚚", path: "/admin/orders", badge: "2 New" },
    { title: "Manage Offers", desc: "Create discount codes, sale banners, and promos.", icon: "🏷️", path: "/admin/offers" },
    { title: "Notifications", desc: "Check system alerts and stock warnings.", icon: "🔔", path: "/admin/notifications", badge: "3" },
    { title: "Sales Reports", desc: "View monthly earnings and analytics.", icon: "📊", path: "/admin/reports" },
    { title: "Customer List", desc: "View registered users and history.", icon: "👥", path: "/admin/customers" },
  ];

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] text-[#4A1D46]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9B5DE5]"></div>
      </div>
  );

  return (
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#2E1029]">
      
      {/* --- CUSTOM ADMIN HEADER (Logo, Name, Logout Only) --- */}
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50 border-b border-[#D883B7]/30">
        
        {/* Left: Logo & Business Name */}
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/90 overflow-hidden border-2 border-[#D883B7] shadow-md">
                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif font-bold text-lg tracking-wide text-[#F3E5F5] hidden md:block">NORMA BEAUTI</span>
        </div>

        {/* Right: Header Logout Button */}
        <button 
            onClick={handleLogout} 
            className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-6 py-2 rounded-full font-bold text-xs hover:opacity-90 transition shadow-md border border-white/20 tracking-wider"
        >
            LOGOUT
        </button>
      </header>

      {/* Decorative Background Glows */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 py-12 relative z-10 flex flex-col md:flex-row gap-8 max-w-7xl">
            
            {/* --- LEFT SIDEBAR: Admin Profile --- */}
            <div className="w-full md:w-1/4 flex flex-col items-center gap-6">
                
                {/* Admin Avatar */}
                <div className="w-32 h-32 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-5xl shadow-xl border border-white/60 text-[#4A1D46]">
                    🛡️
                </div>
                
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-serif text-[#4A1D46]">{adminName}</h2>
                    <p className="text-xs font-bold text-[#9B5DE5] tracking-widest uppercase mt-1">Administrator</p>
                </div>

                <div className="w-full flex flex-col gap-4 mt-4">
                    
                    {/* NEW: Add New Admin Button */}
                    <button 
                        onClick={handleAddAdmin}
                        className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all flex items-center justify-center gap-3 border border-white/30"
                    >
                        <span>➕</span> Add New Admin
                    </button>

                    <button 
                        onClick={() => router.push('/')}
                        className="w-full py-3 px-6 rounded-2xl bg-white/60 backdrop-blur-sm text-[#4A1D46] font-bold shadow-md hover:bg-white/80 transition-all flex items-center justify-center gap-3"
                    >
                        <span>👀</span> View Live Store
                    </button>
                </div>
            </div>

            {/* --- RIGHT SIDE: Dashboard Grid (Glassmorphism) --- */}
            <div className="w-full md:w-3/4">
                <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/60">
                    
                    <div className="flex items-center justify-between mb-8 border-b border-[#D883B7]/30 pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#4A1D46] font-serif tracking-wide">Admin Dashboard</h1>
                            <p className="text-sm text-[#7B2C62] italic mt-1">Manage your empire.</p>
                        </div>
                    </div>

                    {/* DASHBOARD GRID BUTTONS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {menuItems.map((item, index) => (
                            <button 
                                key={index}
                                onClick={() => router.push(item.path)}
                                className="group relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl bg-white/50 border border-white/60 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                            >
                                {/* Notification Badge */}
                                {item.badge && (
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                                        {item.badge}
                                    </div>
                                )}

                                {/* Icon Circle */}
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform text-white">
                                    {item.icon}
                                </div>
                                
                                <div className="text-center z-10">
                                    <h3 className="text-lg font-bold text-[#4A1D46] group-hover:text-[#9B5DE5] transition-colors">{item.title}</h3>
                                    <p className="text-xs text-[#7B2C62] mt-1 opacity-80 group-hover:opacity-100">{item.desc}</p>
                                </div>

                                {/* Hover Glow Effect */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-[#D883B7]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </button>
                        ))}

                    </div>
                </div>
            </div>

      </div>
    </div>
  );
}