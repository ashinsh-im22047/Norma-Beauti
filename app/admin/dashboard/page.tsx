// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminName, setAdminName] = useState("Admin");

  // --- Centralized Real-time Stats ---
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

  // --- Navigation Items with Dynamic Badges ---
  const menuItems = [
    { 
        title: "Manage Inventory", 
        desc: "Products, Ready-made & Custom Boxes.", 
        icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>, 
        path: "/admin/inventory" 
    },
    { 
        title: "Manage Orders", 
        desc: "View and process pending customer orders.", 
        icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 14a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zm-8-2h8m4-4h-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v10h2m12 0h2v-4l-3-3h-3v7z" /></svg>, 
        path: "/admin/orders", 
        badge: pendingOrders > 0 ? `${pendingOrders} New` : null,
        needsAttention: pendingOrders > 0 
    },
    { 
        title: "Manage Offers", 
        desc: "Create discount codes, sale banners, and promos.", 
        icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>, 
        path: "/admin/manage-offers" 
    },
    { 
        title: "Support Hub", 
        desc: "Manage reviews, returns, and complaints.", 
        icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>, 
        path: "/admin/support", 
        badge: null,
        needsAttention: false
    },
    { 
        title: "Notifications", 
        desc: "Check system alerts and stock warnings.", 
        icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>, 
        path: "/admin/notifications", 
        badge: unreadNotifications > 0 ? unreadNotifications.toString() : null,
        needsAttention: unreadNotifications > 0
    },
    { 
        title: "Sales Reports", 
        desc: "View monthly earnings and analytics.", 
        icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>, 
        path: "/admin/reports" 
    },
    { 
        title: "Customer List", 
        desc: "View registered users and history.", 
        icon: <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>, 
        path: "/admin/registered-users" 
    },
  ];

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-[#fff5f4] text-slate-800">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-[#fff5f4] font-sans text-slate-800 pb-12">
      
      <AdminHeader />

      <div className="container mx-auto px-6 py-10 relative z-10 flex flex-col md:flex-row gap-8 max-w-[1400px]">
            
            {/* --- LEFT SIDEBAR: Admin Profile --- */}
            <div className="w-full md:w-1/4 flex flex-col items-center gap-6">
                <div className="w-36 h-36 bg-gradient-to-br from-[#FFAFA8] to-[#ff8a80] rounded-full flex items-center justify-center shadow-lg border-4 border-white text-white">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                </div>
                <div className="text-center">
                    <h2 className="text-3xl font-bold font-sans text-slate-800">{adminName}</h2>
                    <p className="text-xs font-bold text-[#ff8a80] tracking-widest uppercase mt-1">Administrator</p>
                </div>
                <div className="w-full flex flex-col gap-4 mt-4 px-4">
                    <button onClick={() => router.push('/')} className="w-full py-3.5 px-6 rounded-2xl bg-white text-slate-700 font-bold shadow-sm border border-slate-200 hover:border-[#FFAFA8] hover:bg-[#fff5f4] hover:text-[#ff8a80] transition-all flex items-center justify-center gap-3">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View Live Store
                    </button>
                </div>
            </div>

            {/* --- RIGHT SIDE: Dashboard Content --- */}
            <div className="w-full md:w-3/4">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                    
                    <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">System Overview</h1>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Monitor and manage your platform activities.</p>
                        </div>
                    </div>

                    {/* --- COLORFUL STATS ROW --- */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
                        {/* Sales - Emerald */}
                        <div className="bg-gradient-to-br from-emerald-50/50 to-white p-6 rounded-2xl border border-emerald-100 shadow-sm flex flex-col items-center justify-center hover:-translate-y-1 transition-transform">
                            <h3 className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider text-center">Today's Sales</h3>
                            <p className="text-xl font-bold text-slate-800 mt-2">LKR {parseFloat(stats.todaySales.toString()).toLocaleString()}</p>
                        </div>
                        {/* Orders - Blue */}
                        <div className="bg-gradient-to-br from-blue-50/50 to-white p-6 rounded-2xl border border-blue-100 shadow-sm flex flex-col items-center justify-center hover:-translate-y-1 transition-transform">
                            <h3 className="text-[11px] font-bold text-blue-600 uppercase tracking-wider text-center">Today's Orders</h3>
                            <p className="text-2xl font-bold text-slate-800 mt-2">{stats.todayOrders}</p>
                        </div>
                        {/* Users - Purple */}
                        <div className="bg-gradient-to-br from-purple-50/50 to-white p-6 rounded-2xl border border-purple-100 shadow-sm flex flex-col items-center justify-center hover:-translate-y-1 transition-transform">
                            <h3 className="text-[11px] font-bold text-purple-600 uppercase tracking-wider text-center">Total Users</h3>
                            <p className="text-2xl font-bold text-slate-800 mt-2">{stats.users}</p>
                        </div>
                        {/* Low Stock - Rose/Peach Alert */}
                        <div className={`p-6 rounded-2xl border shadow-sm flex flex-col items-center justify-center transition-all ${stats.lowStock > 0 ? 'bg-gradient-to-br from-rose-50 to-white border-rose-200 hover:-translate-y-1' : 'bg-gradient-to-br from-slate-50 to-white border-slate-100'}`}>
                            <h3 className={`text-[11px] font-bold uppercase tracking-wider text-center ${stats.lowStock > 0 ? 'text-rose-500' : 'text-slate-500'}`}>Low Stock Items</h3>
                            <p className={`text-2xl font-bold mt-2 ${stats.lowStock > 0 ? 'text-rose-600' : 'text-slate-800'}`}>{stats.lowStock}</p>
                        </div>
                    </div>

                    {/* --- DASHBOARD GRID BUTTONS --- */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {menuItems.map((item, index) => (
                            <button 
                                key={index}
                                onClick={() => router.push(item.path)}
                                className={`group relative flex flex-col items-center justify-center gap-4 p-8 rounded-[1.5rem] border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden
                                    ${item.needsAttention 
                                        ? 'bg-[#fff5f4] border-[#FFAFA8]' 
                                        : 'bg-white border-slate-200 hover:border-[#FFAFA8] hover:bg-[#fffafa]'
                                    }
                                `}
                            >
                                {/* Notification Badge */}
                                {item.badge && (
                                    <div className="absolute top-4 right-4 bg-[#ff8a80] text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-sm z-20">
                                        {item.badge}
                                    </div>
                                )}
                                
                                {/* Icon Circle */}
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center shadow-sm transition-all duration-300 z-10 
                                    ${item.needsAttention 
                                        ? 'bg-gradient-to-br from-[#FFAFA8] to-[#ff8a80] text-white' 
                                        : 'bg-gradient-to-br from-slate-50 to-slate-100 text-slate-500 group-hover:from-[#FFAFA8] group-hover:to-[#ff8a80] group-hover:text-white group-hover:scale-110'
                                    }`}
                                >
                                    {item.icon}
                                </div>
                                <div className="text-center z-10">
                                    <h3 className={`text-lg font-bold transition-colors ${item.needsAttention ? 'text-[#ff8a80]' : 'text-slate-800 group-hover:text-[#ff8a80]'}`}>{item.title}</h3>
                                    <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">{item.desc}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
      </div>
    </div>
  );
}