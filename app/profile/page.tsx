// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client";

import React, { useState, useEffect } from 'react';
import CustomerHeader from '@/components/CustomerHeader';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  
  // --- DATA STATES ---
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '', 
    address: '',
    dob: '',
    gender: ''
  });

  // --- UI STATES ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Temp data for editing
  const [editData, setEditData] = useState({ 
    name: '',
    email: '',
    phoneNoPrefix: '', 
    address: '',
    dob: '',
    gender: ''
  });

  // --- CUSTOM ALERT STATE ---
  const [alertState, setAlertState] = useState({ 
    show: false, 
    type: 'success', 
    title: '', 
    message: '' 
  });

  // 1. FETCH PROFILE ON LOAD
  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('/api/profile');
      if (res.ok) {
        const data = await res.json();
        const fullPhone = data.phone || '';
        const cleanData = {
            name: data.name || '',
            email: data.email || '',
            phone: fullPhone,
            address: data.address || '',
            dob: data.dob ? data.dob.split('T')[0] : '',
            gender: data.gender || ''
        };
        setUser(cleanData);
      }
    } catch (error) {
      console.error("Load error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 2. EDIT LOGIC
  const openEdit = () => {
    const phoneDigits = user.phone.startsWith('+94') ? user.phone.slice(3) : user.phone;
    setEditData({
        ...user,
        phoneNoPrefix: phoneDigits
    });
    setShowEditModal(true);
  };

  const closeEdit = () => {
    setShowEditModal(false); 
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'phoneNoPrefix') {
        const numbersOnly = value.replace(/[^0-9]/g, '');
        if (numbersOnly.length <= 9) {
            setEditData({ ...editData, phoneNoPrefix: numbersOnly });
        }
        return;
    }
    setEditData({ ...editData, [name]: value });
  };

  const saveChanges = async () => {
    if (!editData.name.trim()) {
        setAlertState({ show: true, type: 'error', title: 'Missing Information', message: 'Full Name is required.' });
        return;
    }
    if (editData.phoneNoPrefix.length !== 9) {
        setAlertState({ show: true, type: 'error', title: 'Invalid Phone Number', message: 'Please enter exactly 9 digits after +94.' });
        return;
    }
    if (!editData.address.trim()) {
        setAlertState({ show: true, type: 'error', title: 'Missing Information', message: 'Address is required.' });
        return;
    }
    const today = new Date().toISOString().split('T')[0];
    if (editData.dob && editData.dob > today) {
        setAlertState({ show: true, type: 'error', title: 'Invalid Date', message: 'Date of Birth cannot be in the future.' });
        return;
    }

    const finalProfile = {
        name: editData.name,
        email: editData.email, 
        phone: `+94${editData.phoneNoPrefix}`, 
        address: editData.address,
        dob: editData.dob,
        gender: editData.gender
    };

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalProfile),
      });

      if (res.ok) {
        setUser({ ...finalProfile, phone: finalProfile.phone });
        setShowEditModal(false);
        setAlertState({ show: true, type: 'success', title: 'Success!', message: 'Your profile has been updated beautifully.' });
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      setAlertState({ show: true, type: 'error', title: 'Oops!', message: 'Failed to save changes. Please try again.' });
    }
  };

  const maxDate = new Date().toISOString().split("T")[0];

  if (loading) return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-24">
      <CustomerHeader />
      
      <main className="container mx-auto px-4 lg:px-8 py-12 max-w-7xl">
        
        {/* --- REFINED HERO SECTION --- */}
        <div className="relative overflow-hidden bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-200 mb-10">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#fff5f4] to-transparent pointer-events-none opacity-60"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
                <div className="flex-1">
                    <span className="inline-block bg-[#fff5f4] px-4 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase mb-4 text-[#ff8a80] border border-[#FFAFA8]/20">
                        Personal Dashboard
                    </span>
                    <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">
                        Welcome back, <span className="text-[#ff8a80]">{user.name.split(' ')[0] || "Guest"}!</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg max-w-xl">
                        Everything you need to manage your account and track your orders in one place.
                    </p>
                </div>
                <div className="hidden lg:flex w-32 h-32 items-center justify-center bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 rotate-3">
                     <svg className="w-16 h-16 text-[#FFAFA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* --- SIDEBAR --- */}
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 text-center">
                    <div className="relative inline-block mb-6">
                        <div className="w-28 h-28 bg-gradient-to-tr from-[#FFAFA8] to-[#ff8a80] rounded-3xl flex items-center justify-center text-4xl text-white shadow-lg border-4 border-white font-bold uppercase rotate-3">
                            {user.name ? user.name.charAt(0) : "C"}
                        </div>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-1">{user.name || "Customer"}</h2>
                    <p className="text-sm text-slate-400 font-medium mb-8 italic">{user.email}</p>

                    <div className="space-y-3">
                        <SidebarBtn onClick={() => router.push('/wishlist')} icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />} label="My Wishlist" color="text-rose-400" />
                        <SidebarBtn onClick={() => router.push('/profile/my-orders')} icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />} label="Order History" color="text-blue-400" />
                        {/* --- NEW: NOTIFICATIONS BUTTON --- */}
                        <SidebarBtn onClick={() => router.push('/profile/notifications')} icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />} label="Notifications" color="text-amber-400" />
                        <SidebarBtn onClick={() => router.push('/contact')} icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />} label="Help & Support" color="text-emerald-400" />
                    </div>
                </div>
                
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-rose-500 transition-colors tracking-widest uppercase">
                    Close Account Permanently
                </button>
            </div>

            {/* --- MAIN DETAILS --- */}
            <div className="lg:col-span-8">
                <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-slate-900">Personal Information</h2>
                            <p className="text-slate-400 text-sm font-medium">Verified account details</p>
                        </div>
                        <button 
                            onClick={openEdit} 
                            className="text-xs font-bold text-slate-600 bg-slate-50 hover:bg-[#ff8a80] hover:text-white px-6 py-3 rounded-2xl transition-all border border-slate-200 hover:border-[#ff8a80] shadow-sm flex items-center gap-2 uppercase tracking-wider"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                            Edit Profile
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <DetailRow label="Full Name" value={user.name} />
                        <DetailRow label="Email Address" value={user.email} />
                        <DetailRow label="Phone Number" value={user.phone} />
                        <DetailRow label="Gender" value={user.gender} />
                        <DetailRow label="Date of Birth" value={user.dob} />
                        <DetailRow label="Delivery Address" value={user.address} width="col-span-1 md:col-span-2" />
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* --- MODALS (STYLING IMPROVED) --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4" onClick={closeEdit}>
            <div className="bg-white p-8 md:p-10 rounded-[2rem] shadow-2xl max-w-lg w-full border border-slate-100 relative animate-scale-up" onClick={e => e.stopPropagation()}>
                <div className="mb-8">
                    <h3 className="text-2xl font-bold text-slate-900">Modify Profile</h3>
                    <p className="text-slate-400 text-sm font-medium mt-1">Update your personal contact information.</p>
                </div>

                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-[0.15em] mb-2 ml-1">Email (Fixed)</label>
                        <input type="text" value={editData.email} disabled className="w-full px-5 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-slate-400 cursor-not-allowed font-medium text-sm" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Full Name</label>
                        <input type="text" name="name" value={editData.name} onChange={handleEditChange} className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] outline-none font-medium transition-all text-sm" />
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Phone Number</label>
                        <div className="flex items-center w-full bg-white border border-slate-200 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-[#FFAFA8]">
                            <span className="bg-slate-50 px-4 py-3 text-slate-500 font-bold border-r border-slate-200 text-sm">+94</span>
                            <input type="text" name="phoneNoPrefix" value={editData.phoneNoPrefix} onChange={handleEditChange} maxLength={9} placeholder="7XXXXXXXX" className="w-full px-4 outline-none bg-transparent font-medium text-sm" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Shipping Address</label>
                        <input type="text" name="address" value={editData.address} onChange={handleEditChange} className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-[#FFAFA8] outline-none font-medium text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Birthday</label>
                            <input type="date" name="dob" max={maxDate} value={editData.dob} onChange={handleEditChange} className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-[#FFAFA8] outline-none font-medium text-sm" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-[0.15em] mb-2 ml-1">Gender</label>
                            <select name="gender" value={editData.gender} onChange={handleEditChange} className="w-full px-5 py-3 rounded-2xl bg-white border border-slate-200 focus:ring-2 focus:ring-[#FFAFA8] outline-none font-medium text-sm appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20width%3D%2220%22%20height%3D%2220%22%20viewBox%3D%220%200%2020%2020%22%20fill%3D%22none%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cpath%20d%3D%22M5%207L10%2012L15%207%22%20stroke%3D%22%2394A3B8%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22/%3E%3C/svg%3E')] bg-[length:20px_20px] bg-[right_12px_center] bg-no-repeat">
                                <option value="">Select</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 mt-10 pt-6 border-t border-slate-100">
                    <button onClick={closeEdit} className="flex-1 py-3 text-slate-500 rounded-xl font-bold hover:bg-slate-50 transition-colors border border-slate-200 text-xs uppercase tracking-widest">Discard</button>
                    <button onClick={saveChanges} className="flex-1 py-3 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-xl font-bold shadow-md hover:opacity-90 transition-all text-xs uppercase tracking-widest">Save Profile</button>
                </div>
            </div>
        </div>
      )}

      {/* --- CUSTOM ALERT --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
           <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm 
                  ${alertState.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              <h3 className="text-xl font-bold text-slate-900">{alertState.title}</h3>
              <p className="text-slate-500 mt-2 mb-8 text-sm leading-relaxed">{alertState.message}</p>
              <button onClick={() => setAlertState({ ...alertState, show: false })} className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm uppercase tracking-widest">
                Understood
              </button>
           </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
           <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100">
              <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-rose-500 shadow-sm">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900">Are you sure?</h3>
              <p className="text-slate-500 text-sm mt-2 mb-8 leading-relaxed">This will delete all orders and saved items. This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors text-xs uppercase tracking-widest">Keep Account</button>
                <button className="flex-1 py-3 bg-rose-500 text-white rounded-xl font-bold shadow-md hover:bg-rose-600 transition-all text-xs uppercase tracking-widest">Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// Optimized Sidebar Button Helper
const SidebarBtn = ({ onClick, icon, label, color }: { onClick: () => void, icon: React.ReactNode, label: string, color: string }) => (
    <button onClick={onClick} className="w-full group p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:border-[#FFAFA8] hover:bg-[#fffcfc] transition-all flex items-center gap-4">
        <div className={`p-2.5 rounded-xl bg-slate-50 group-hover:bg-white transition-colors ${color}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">{icon}</svg>
        </div>
        <span className="font-bold text-slate-700 text-sm">{label}</span>
        <svg className="w-4 h-4 ml-auto text-slate-300 group-hover:text-[#FFAFA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
    </button>
);

// Optimized Detail Display Helper
const DetailRow = ({ label, value, width = "w-full" }: { label: string, value: string, width?: string }) => (
    <div className={width}>
        <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-[0.15em] ml-1">{label}</p>
        <div className="px-5 py-4 bg-[#F8FAFC] rounded-2xl border border-slate-100 text-slate-700 font-semibold min-h-[3.5rem] flex items-center text-sm">
            {value || <span className="text-slate-300 italic font-medium">No information provided</span>}
        </div>
    </div>
);