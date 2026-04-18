"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AdminHeader from '@/components/AdminHeader';

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // States for Tracking
  const [readNotifs, setReadNotifs] = useState<Set<string>>(new Set());
  const [deletedNotifs, setDeletedNotifs] = useState<Set<string>>(new Set());
  const [selectedNotifs, setSelectedNotifs] = useState<Set<string>>(new Set());
  
  // UI States
  const [showMenu, setShowMenu] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'unread' | 'read'

  useEffect(() => {
    // Load read & deleted notifications from local storage on mount
    const savedRead = localStorage.getItem('readNotifs');
    const savedDeleted = localStorage.getItem('deletedNotifs');
    if (savedRead) setReadNotifs(new Set(JSON.parse(savedRead)));
    if (savedDeleted) setDeletedNotifs(new Set(JSON.parse(savedDeleted)));

    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/admin/notifications');
        if (res.ok) setNotifications(await res.json());
      } catch (error) { 
        console.error(error); 
      } finally { 
        setLoading(false); 
      }
    };
    fetchNotifications();

    // Close dropdown when clicking outside
    const closeMenu = () => setShowMenu(false);
    window.addEventListener('click', closeMenu);
    return () => window.removeEventListener('click', closeMenu);
  }, []);

  // --- FILTERING LOGIC ---
  const activeNotifications = notifications.filter(n => !deletedNotifs.has(n.id));
  const unreadCount = activeNotifications.filter(n => !readNotifs.has(n.id)).length;

  const visibleNotifications = activeNotifications.filter(n => {
      const isRead = readNotifs.has(n.id);
      if (filter === 'unread' && isRead) return false;
      if (filter === 'read' && !isRead) return false;
      return true;
  });

  const handleViewClick = (notif: any) => {
      const newReadSet = new Set(readNotifs);
      newReadSet.add(notif.id);
      setReadNotifs(newReadSet);
      localStorage.setItem('readNotifs', JSON.stringify(Array.from(newReadSet)));
      
      router.push(notif.link || '/admin/dashboard');
  };

  const toggleSelection = (id: string) => {
      const newSet = new Set(selectedNotifs);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      setSelectedNotifs(newSet);
  };

  // --- DELETE ACTIONS ---
  const saveDeleted = (newDeletedSet: Set<string>) => {
      setDeletedNotifs(newDeletedSet);
      localStorage.setItem('deletedNotifs', JSON.stringify(Array.from(newDeletedSet)));
      setSelectedNotifs(new Set()); // Clear selection after delete
  };

  const handleDeleteSelected = () => {
      if (selectedNotifs.size === 0) return;
      const newDeleted = new Set(deletedNotifs);
      selectedNotifs.forEach(id => newDeleted.add(id));
      saveDeleted(newDeleted);
  };

  const handleDeleteRead = () => {
      const newDeleted = new Set(deletedNotifs);
      activeNotifications.forEach(n => {
          if (readNotifs.has(n.id)) newDeleted.add(n.id);
      });
      saveDeleted(newDeleted);
  };

  const handleDeleteAll = () => {
      const newDeleted = new Set(deletedNotifs);
      activeNotifications.forEach(n => newDeleted.add(n.id));
      saveDeleted(newDeleted);
  };

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans pb-20 text-slate-800">
      
      <AdminHeader />

      <main className="container mx-auto px-4 md:px-6 py-10 max-w-[1000px] relative z-10">
        
        {/* --- ELEGANT HERO SECTION --- */}
        <div className="relative z-50 bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#fff5f4] to-transparent rounded-bl-full pointer-events-none opacity-70"></div>
            
            <div className="relative z-10">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900">System Alerts</h2>
                <p className="text-sm text-slate-500 mt-2 font-medium">Monitor low stock warnings and new pending orders.</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-start md:justify-end gap-4 relative z-10 w-full md:w-auto">
                
                {/* FILTER DROPDOWN */}
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-slate-50 text-slate-700 px-5 py-3 rounded-full border border-slate-200 outline-none text-sm font-bold cursor-pointer hover:bg-slate-100 transition-colors shadow-sm focus:ring-2 focus:ring-[#FFAFA8]"
                >
                    <option value="all">All Notifications</option>
                    <option value="unread">Unread Only</option>
                    <option value="read">Read Only</option>
                </select>

                <div className={`px-5 py-3 rounded-full border flex items-center gap-2 shadow-sm transition-colors ${unreadCount > 0 ? 'bg-[#fff5f4] border-[#FFAFA8] text-[#ff8a80]' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                    <svg className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                    <span className="font-bold text-sm tracking-wide">{unreadCount} Unread</span>
                </div>
                
                {/* 3-DOT MENU */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setShowMenu(!showMenu)} 
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-[#FFAFA8] hover:border-[#FFAFA8] shadow-sm transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-xl py-2 w-56 border border-slate-100 z-[100] flex flex-col overflow-hidden">
                            {/* Option 1: Delete Selected */}
                            <button onClick={() => { handleDeleteSelected(); setShowMenu(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-500 transition-colors flex items-center gap-3">
                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                Delete Selected
                            </button>
                            
                            {/* Option 2: Delete Read */}
                            <button onClick={() => { handleDeleteRead(); setShowMenu(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 hover:text-amber-500 transition-colors flex items-center gap-3">
                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>
                                Delete Read
                            </button>
                            
                            <div className="border-t border-slate-100 my-1 mx-3"></div>
                            
                            {/* Option 3: Delete All */}
                            <button onClick={() => { handleDeleteAll(); setShowMenu(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors flex items-center gap-3">
                                <svg className="w-4 h-4 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                Delete All
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- NOTIFICATIONS LIST --- */}
        <div className="flex flex-col gap-4 relative z-10">
          {visibleNotifications.length === 0 ? (
            <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm flex flex-col items-center justify-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-5 border border-slate-100 text-[#FFAFA8]">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight mb-2">
                {filter === 'unread' ? "No unread alerts!" : filter === 'read' ? "No read alerts!" : "All caught up!"}
              </h3>
              <p className="text-slate-500 text-sm font-medium">You have no pending notifications to display here.</p>
            </div>
          ) : (
            visibleNotifications.map((notif) => {
              const isUnread = !readNotifs.has(notif.id);
              const isSelected = selectedNotifs.has(notif.id);
              
              return (
                <div 
                  key={notif.id} 
                  className={`p-6 md:p-8 rounded-[2rem] border transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group relative overflow-hidden
                    ${isSelected ? 'bg-[#fffafa] border-[#FFAFA8] shadow-md scale-[1.01]' : 
                      isUnread 
                        ? 'bg-white ring-1 ring-[#FFAFA8]/50 border-[#FFAFA8] shadow-lg' 
                        : 'bg-white border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                    }
                  `}
                >
                  <div className="flex items-start sm:items-center gap-5 relative z-10 w-full min-w-0">
                    {/* CHECKBOX */}
                    <div className="relative flex items-center justify-center shrink-0 pt-2 sm:pt-0">
                        <input 
                          type="checkbox" 
                          checked={isSelected} 
                          onChange={() => toggleSelection(notif.id)} 
                          className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-md checked:bg-[#FFAFA8] checked:border-[#FFAFA8] transition-all cursor-pointer shadow-sm"
                        />
                        <svg className="absolute w-3.5 h-3.5 text-white pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                    </div>

                    {/* NEW Badge */}
                    {isUnread && (
                        <div className="absolute -top-3 sm:-top-4 left-10 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full shadow-sm tracking-widest">
                            NEW
                        </div>
                    )}
                    
                    {/* Icon Circle */}
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full flex items-center justify-center shadow-sm border transition-all duration-300 ${
                      notif.type === 'Warning' 
                        ? (isUnread ? 'bg-rose-50 text-rose-500 border-rose-200' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-rose-50 group-hover:text-rose-400')
                        : (isUnread ? 'bg-blue-50 text-blue-500 border-blue-200' : 'bg-slate-50 text-slate-400 border-slate-100 group-hover:bg-blue-50 group-hover:text-blue-400')
                    }`}>
                      {notif.type === 'Warning' ? (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                      ) : (
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                      )}
                    </div>

                    {/* Text Content */}
                    <div className="min-w-0 pr-4">
                      <h4 className={`font-bold text-base sm:text-lg mb-1 truncate transition-colors ${isUnread ? 'text-slate-900' : 'text-slate-700 group-hover:text-[#ff8a80]'}`}>
                        {notif.title}
                      </h4>
                      <p className={`text-xs sm:text-sm font-medium leading-relaxed ${isUnread ? 'text-slate-600' : 'text-slate-500'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <button 
                    onClick={() => handleViewClick(notif)}
                    className={`px-6 py-2.5 rounded-full font-bold text-xs sm:text-sm shadow-sm whitespace-nowrap shrink-0 border transition-all relative z-10 ${
                        isUnread 
                        ? 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white border-transparent hover:shadow-md hover:scale-105'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-[#ff8a80] hover:border-[#FFAFA8]'
                    }`}
                  >
                    View Details
                  </button>

                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}