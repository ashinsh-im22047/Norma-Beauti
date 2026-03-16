"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f] bg-[#fff0f5]">Loading Notifications...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans pb-20 text-[#2E1029]">
      
      {/* --- ADMIN HEADER --- */}
      <header className="bg-gradient-to-r from-[#2E1029] to-[#4A1D46] text-white py-4 px-8 flex justify-between items-center shadow-lg sticky top-0 z-40">
        <div className="flex items-center gap-3">
           <button onClick={() => router.push('/admin/dashboard')} className="text-xl hover:bg-white/10 p-2 rounded-full transition">←</button>
           <h1 className="text-xl font-bold tracking-wider text-[#F3E5F5] uppercase">Notifications</h1>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-5xl relative z-10">
        
        {/* --- ELEGANT HERO SECTION (FIXED Z-INDEX) --- */}
        <div className="relative z-50 bg-[#4A1D46]/90 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/20 mb-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
                <h2 className="text-3xl font-serif text-white tracking-wide">System Alerts</h2>
                <p className="text-sm text-[#D883B7] mt-1 font-medium">Monitor low stock warnings and new pending orders.</p>
            </div>
            
            <div className="flex flex-wrap items-center justify-center gap-4">
                
                {/* FILTER DROPDOWN */}
                <select 
                  value={filter} 
                  onChange={(e) => setFilter(e.target.value)}
                  className="bg-white/10 text-white px-4 py-3 rounded-full border border-white/20 outline-none text-sm font-bold cursor-pointer hover:bg-white/20 transition-colors shadow-inner"
                >
                    <option value="all" className="text-[#4A1D46]">All Notifications</option>
                    <option value="unread" className="text-[#4A1D46]">Unread Only</option>
                    <option value="read" className="text-[#4A1D46]">Read Only</option>
                </select>

                <div className="bg-white/10 px-5 py-3 rounded-full border border-white/20 flex items-center gap-3 shadow-inner">
                    <span className={`text-xl ${unreadCount > 0 ? 'animate-bounce' : ''}`}>🔔</span>
                    <span className="font-bold text-sm">{unreadCount} Unread</span>
                </div>
                
                {/* 3-DOT MENU */}
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                    <button 
                      onClick={() => setShowMenu(!showMenu)} 
                      className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-xl font-bold transition-colors"
                    >
                        ⋮
                    </button>
                    {showMenu && (
                        <div className="absolute right-0 top-14 bg-white rounded-2xl shadow-2xl py-2 w-52 border border-gray-100 z-[100] flex flex-col">
                            {/* Option 1: Delete Selected */}
                            <button onClick={() => { handleDeleteSelected(); setShowMenu(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-[#4A1D46] hover:bg-pink-50 transition flex items-center gap-3">
                                <span className="text-lg">✓</span> Delete Selected
                            </button>
                            
                            {/* Option 2: Delete Read */}
                            <button onClick={() => { handleDeleteRead(); setShowMenu(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 transition flex items-center gap-3">
                                <span className="text-lg">📖</span> Delete Read
                            </button>
                            
                            <div className="border-t border-gray-100 my-1 mx-2"></div>
                            
                            {/* Option 3: Delete All */}
                            <button onClick={() => { handleDeleteAll(); setShowMenu(false); }} className="w-full text-left px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition flex items-center gap-3">
                                <span className="text-lg">🗑️</span> Delete All
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* --- NOTIFICATIONS LIST --- */}
        <div className="flex flex-col gap-5 relative z-10">
          {visibleNotifications.length === 0 ? (
            <div className="bg-white/60 rounded-[2rem] p-12 text-center border border-white/60 shadow-xl backdrop-blur-md">
              <div className="text-6xl mb-4">🎉</div>
              <p className="text-[#880e4f] text-3xl font-serif font-bold">
                {filter === 'unread' ? "No unread alerts!" : filter === 'read' ? "No read alerts!" : "All caught up!"}
              </p>
              <p className="text-[#7B2C62] text-sm mt-2 font-medium">You have no pending notifications to display here.</p>
            </div>
          ) : (
            visibleNotifications.map((notif) => {
              const isUnread = !readNotifs.has(notif.id);
              const isSelected = selectedNotifs.has(notif.id);
              
              return (
                <div 
                  key={notif.id} 
                  className={`p-6 rounded-[2rem] shadow-lg border hover:-translate-y-1 transition-all duration-300 flex flex-col sm:flex-row sm:items-center justify-between gap-6 group backdrop-blur-md
                    ${isSelected ? 'bg-pink-50 border-pink-300 scale-[1.01]' : 
                      isUnread 
                        ? 'bg-[#F3E5F5] ring-2 ring-inset ring-[#9B5DE5] shadow-[inset_0_0_15px_rgba(155,93,229,0.1)] border-[#9B5DE5]' 
                        : 'bg-white/80 border-white/60 hover:shadow-2xl'
                    }
                  `}
                >
                  <div className="flex items-center gap-5 relative">
                    {/* CHECKBOX */}
                    <input 
                      type="checkbox" 
                      checked={isSelected} 
                      onChange={() => toggleSelection(notif.id)} 
                      className="w-5 h-5 accent-[#9B5DE5] cursor-pointer rounded-md shrink-0 border-gray-300"
                    />

                    {/* NEW Badge */}
                    {isUnread && (
                        <div className="absolute -top-8 left-6 bg-[#9B5DE5] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-md animate-pulse">
                            NEW
                        </div>
                    )}
                    
                    <div className={`w-14 h-14 shrink-0 rounded-full flex items-center justify-center text-2xl shadow-inner border-2 transition-all duration-300 ${
                      notif.type === 'Warning' 
                        ? (isUnread ? 'bg-red-100 text-red-600 border-red-300' : 'bg-red-50 text-red-500 border-red-200 group-hover:bg-red-100 group-hover:scale-110')
                        : (isUnread ? 'bg-blue-100 text-blue-600 border-blue-300' : 'bg-[#F3E5F5] text-[#9B5DE5] border-[#D883B7] group-hover:bg-[#E6E6FA] group-hover:scale-110')
                    }`}>
                      {notif.type === 'Warning' ? '⚠️' : '📦'}
                    </div>
                    <div>
                      <h4 className={`font-bold text-lg mb-0.5 transition-colors ${isUnread ? 'text-[#4A1D46]' : 'text-[#4A1D46] group-hover:text-[#880e4f]'}`}>
                        {notif.title}
                      </h4>
                      <p className={`text-sm font-medium leading-relaxed ${isUnread ? 'text-[#4A1D46]' : 'text-[#7B2C62]'}`}>
                        {notif.message}
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => handleViewClick(notif)}
                    className={`px-8 py-3 rounded-full font-bold text-sm shadow-md whitespace-nowrap shrink-0 border transition-all ${
                        isUnread 
                        ? 'bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white border-white/20 hover:scale-105'
                        : 'bg-white text-[#880e4f] border-pink-200 hover:bg-pink-50'
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