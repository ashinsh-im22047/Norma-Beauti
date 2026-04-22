// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useEffect, useState } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

// Fetch notifications from the backend API and update the state accordingly, handling loading state and potential errors
    const fetchNotifications = () => {
        fetch('/api/notifications')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setNotifications(data);
                setLoading(false);
            }).catch(err => setLoading(false));
    };

// Handle click on a notification: if it's unread, mark it as read in the backend, then navigate to the related order details page if a reference ID exists
    const handleNotificationClick = async (notif: any) => {
        if (!notif.is_read) {
            await fetch('/api/notifications', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: notif.id })
            });
        }
        
        if (notif.reference_id) {
            router.push(`/profile/my-orders?highlight=${notif.reference_id}`);
        }
    };
    
// Handle deletion of a notification by sending a DELETE request to the backend API with the notification ID, then refreshing the notifications list if successful
    const handleDelete = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Prevent triggering the click event of the whole card
        if (confirm("Delete this notification?")) {
            try {
                const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
                if (res.ok) {
                    fetchNotifications(); // Refresh list
                }
            } catch (error) {
                console.error(error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24">
            <CustomerHeader />
            <main className="container mx-auto px-4 md:px-6 py-10 max-w-[800px]">
                
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Your Notifications</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Stay updated on your orders and requests.</p>
                    </div>
                </div>
                
                {loading ? (
                    <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#FFAFA8]"></div></div>
                ) : notifications.length === 0 ? (
                    <div className="bg-white p-12 rounded-[2.5rem] shadow-sm border border-slate-200 text-center">
                        <svg className="w-16 h-16 mx-auto text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                        <p className="text-lg font-bold text-slate-500">No notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {notifications.map((notif: any) => (
                            <div 
                                key={notif.id} 
                                onClick={() => handleNotificationClick(notif)}
                                className={`p-6 md:p-8 rounded-3xl border cursor-pointer transition-all hover:shadow-md hover:scale-[1.01] ${notif.is_read ? 'bg-white border-slate-200' : 'bg-[#fff5f4] border-[#FFAFA8] shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className={`font-bold text-lg ${notif.is_read ? 'text-slate-700' : 'text-[#D94452]'}`}>{notif.title}</h3>
                                        {!notif.is_read && <span className="w-3 h-3 rounded-full bg-[#ff8a80] shadow-sm animate-pulse"></span>}
                                    </div>
                                    
                                    {/* --- DELETE BUTTON --- */}
                                    <button onClick={(e) => handleDelete(e, notif.id)} className="text-slate-300 hover:text-rose-500 transition-colors p-1">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                    </button>
                                </div>
                                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-4">
                                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">{notif.message}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(notif.date).toLocaleString()}</p>
                                    <span className="text-[10px] font-bold text-[#ff8a80] uppercase tracking-widest flex items-center gap-1">
                                        View Details <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}