"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  // --- NEW: Centralized Real-time Stats ---
  const [stats, setStats] = useState({
    todaySales: 0,
    todayOrders: 0,
    users: 0, 
    lowStock: 0  
  });
  
  const [pendingOrders, setPendingOrders] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  useEffect(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    if (name) setAdminName(name);

    const fetchDashboardData = async () => {
      try {
        // Fetch new unified Dashboard Stats & Notifications list
        const [dashRes, notifRes] = await Promise.all([
            fetch('/api/admin/dashboard'),
            fetch('/api/admin/notifications')
        ]);

        // 1. Process Dashboard Stats
        if (dashRes.ok) {
            const data = await dashRes.json();
            setStats({
                todaySales: data.todaySales || 0,
                todayOrders: data.todayOrders || 0,
                users: data.totalUsers || 0,
                lowStock: data.lowStockItems || 0
            });
            setPendingOrders(data.pendingOrders || 0);
        }

        // 2. Process Notifications (Checking against localStorage for 'Unread' count)
        if (notifRes.ok) {
            const notifData = await notifRes.json();
            
            // Get arrays of what the admin has already deleted/read
            const savedRead = localStorage.getItem('readNotifs');
            const savedDeleted = localStorage.getItem('deletedNotifs');
            const readSet = savedRead ? new Set(JSON.parse(savedRead)) : new Set();
            const deletedSet = savedDeleted ? new Set(JSON.parse(savedDeleted)) : new Set();
            
            // Calculate actual unread count
            if (Array.isArray(notifData)) {
                const visible = notifData.filter((n: any) => !deletedSet.has(n.id));
                const unread = visible.filter((n: any) => !readSet.has(n.id)).length;
                setUnreadNotifications(unread);
            }
        }

      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    window.location.href = '/'; 
  };

  const handleAddAdmin = () => {
    alert("Redirecting to Add New Admin page...");
  };

  // --- Navigation Items with Dynamic Badges ---
  const menuItems = [
    { title: "Manage Inventory", desc: "Products, Ready-made & Custom Boxes.", icon: "📦", path: "/admin/inventory" },
    { 
        title: "Manage Orders", 
        desc: "View and process pending customer orders.", 
        icon: "🚚", 
        path: "/admin/orders", 
        badge: pendingOrders > 0 ? `${pendingOrders} New` : null,
        needsAttention: pendingOrders > 0 
    },
    { title: "Manage Offers", desc: "Create discount codes, sale banners, and promos.", icon: "🏷️", path: "/admin/manage-offers" },
    { 
        title: "Notifications", 
        desc: "Check system alerts and stock warnings.", 
        icon: "🔔", 
        path: "/admin/notifications", 
        badge: unreadNotifications > 0 ? unreadNotifications.toString() : null,
        needsAttention: unreadNotifications > 0
    },
    { title: "Sales Reports", desc: "View monthly earnings and analytics.", icon: "📊", path: "/admin/reports" },
    { title: "Customer List", desc: "View registered users and history.", icon: "👥", path: "/admin/registered-users" },
  ];

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] text-[#4A1D46]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#9B5DE5]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans text-[#2E1029]">
      
      {/* --- CUSTOM ADMIN HEADER --- */}
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white px-8 py-4 flex justify-between items-center shadow-lg sticky top-0 z-50 border-b border-[#D883B7]/30">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/90 overflow-hidden border-2 border-[#D883B7] shadow-md">
                <img src="/logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-serif font-bold text-lg tracking-wide text-[#F3E5F5] hidden md:block">NORMA BEAUTI</span>
        </div>
        <button onClick={handleLogout} className="bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white px-6 py-2 rounded-full font-bold text-xs hover:opacity-90 transition shadow-md border border-white/20 tracking-wider">
            LOGOUT
        </button>
      </header>

      {/* Decorative Background Glows */}
      <div className="fixed top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="container mx-auto px-6 py-12 relative z-10 flex flex-col md:flex-row gap-8 max-w-7xl">
            
            {/* --- LEFT SIDEBAR: Admin Profile --- */}
            <div className="w-full md:w-1/4 flex flex-col items-center gap-6">
                <div className="w-32 h-32 bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-5xl shadow-xl border border-white/60 text-[#4A1D46]">🛡️</div>
                <div className="text-center">
                    <h2 className="text-2xl font-bold font-serif text-[#4A1D46]">{adminName}</h2>
                    <p className="text-xs font-bold text-[#9B5DE5] tracking-widest uppercase mt-1">Administrator</p>
                </div>
                <div className="w-full flex flex-col gap-4 mt-4">
                    <button onClick={handleAddAdmin} className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all flex items-center justify-center gap-3 border border-white/30">
                        <span>➕</span> Add New Admin
                    </button>
                    <button onClick={() => router.push('/')} className="w-full py-3 px-6 rounded-2xl bg-white/60 backdrop-blur-sm text-[#4A1D46] font-bold shadow-md hover:bg-white/80 transition-all flex items-center justify-center gap-3">
                        <span>👀</span> View Live Store
                    </button>
                </div>
            </div>

            {/* --- RIGHT SIDE: Dashboard Content --- */}
            <div className="w-full md:w-3/4">
                <div className="bg-white/40 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-white/60">
                    
                    <div className="flex items-center justify-between mb-8 border-b border-[#D883B7]/30 pb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-[#4A1D46] font-serif tracking-wide">Admin Dashboard</h1>
                            <p className="text-sm text-[#7B2C62] italic mt-1">Manage your empire.</p>
                        </div>
                    </div>

                    {/* --- STATS ROW --- */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <div className="bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-default">
                            <h3 className="text-[10px] font-bold text-[#7B2C62] uppercase tracking-wider text-center">Today's Sales</h3>
                            <p className="text-xl font-bold text-[#4A1D46] mt-1">LKR {parseFloat(stats.todaySales.toString()).toLocaleString()}</p>
                        </div>
                        <div className="bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-default">
                            <h3 className="text-[10px] font-bold text-[#7B2C62] uppercase tracking-wider text-center">Today's Orders</h3>
                            <p className="text-2xl font-bold text-[#4A1D46] mt-1">{stats.todayOrders}</p>
                        </div>
                        <div className="bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-default">
                            <h3 className="text-[10px] font-bold text-[#7B2C62] uppercase tracking-wider text-center">Total Users</h3>
                            <p className="text-2xl font-bold text-[#4A1D46] mt-1">{stats.users}</p>
                        </div>
                        <div className="bg-white/50 p-4 rounded-2xl border border-white/60 shadow-sm flex flex-col items-center justify-center hover:scale-105 transition-transform cursor-default relative overflow-hidden">
                            {stats.lowStock > 0 && <div className="absolute inset-0 bg-red-100/50 animate-pulse"></div>}
                            <h3 className="text-[10px] font-bold text-[#7B2C62] uppercase tracking-wider text-center relative z-10">Low Stock Items</h3>
                            <p className={`text-2xl font-bold mt-1 relative z-10 ${stats.lowStock > 0 ? 'text-red-600 drop-shadow-sm' : 'text-[#4A1D46]'}`}>{stats.lowStock}</p>
                        </div>
                    </div>

                    {/* --- DASHBOARD GRID BUTTONS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item, index) => (
                            <button 
                                key={index}
                                onClick={() => router.push(item.path)}
                                className={`group relative flex flex-col items-center justify-center gap-4 p-6 rounded-3xl border shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden
                                    ${item.needsAttention 
                                        ? 'bg-[#F3E5F5] border-[#9B5DE5]/50 ring-2 ring-inset ring-[#9B5DE5]/30' 
                                        : 'bg-white/50 border-white/60'
                                    }
                                `}
                            >
                                {/* Glowing Red Badge */}
                                {item.badge && (
                                    <div className="absolute top-4 right-4 bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-[0_0_10px_rgba(233,30,99,0.5)] animate-pulse z-20">
                                        {item.badge}
                                    </div>
                                )}
                                
                                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] flex items-center justify-center text-3xl shadow-md group-hover:scale-110 transition-transform text-white relative z-10">
                                    {item.icon}
                                </div>
                                <div className="text-center z-10">
                                    <h3 className="text-lg font-bold text-[#4A1D46] group-hover:text-[#9B5DE5] transition-colors">{item.title}</h3>
                                    <p className="text-xs text-[#7B2C62] mt-1 opacity-80 group-hover:opacity-100">{item.desc}</p>
                                </div>
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