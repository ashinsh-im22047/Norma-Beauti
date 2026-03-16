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
    phone: '', // Stores full phone like +94771234567
    address: '',
    dob: '',
    gender: ''
  });

  // --- UI STATES ---
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  // Temp data for editing (Phone is split for easier handling)
  const [editData, setEditData] = useState({ 
    name: '',
    email: '',
    phoneNoPrefix: '', // Just the 9 digits
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
        // Extract 9 digits if it starts with +94, otherwise keep as is
        const rawPhone = fullPhone.startsWith('+94') ? fullPhone.slice(3) : fullPhone;

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

  // Handle Input Changes
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    // Special handling for Phone: Allow only numbers, max 9 digits
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
    // 1. Validate Name
    if (!editData.name.trim()) {
        setAlertState({ show: true, type: 'error', title: 'Missing Information', message: 'Full Name is required.' });
        return;
    }

    // 2. Validate Phone (Must be exactly 9 digits)
    if (editData.phoneNoPrefix.length !== 9) {
        setAlertState({ show: true, type: 'error', title: 'Invalid Phone Number', message: 'Please enter exactly 9 digits after +94.' });
        return;
    }

    // 3. Validate Address
    if (!editData.address.trim()) {
        setAlertState({ show: true, type: 'error', title: 'Missing Information', message: 'Address is required.' });
        return;
    }

    // 4. Validate Date of Birth (No future dates)
    const today = new Date().toISOString().split('T')[0];
    if (editData.dob && editData.dob > today) {
        setAlertState({ show: true, type: 'error', title: 'Invalid Date', message: 'Date of Birth cannot be in the future.' });
        return;
    }

    // 5. Construct Final Data to Save
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#880e4f]"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46] pb-20">
      <CustomerHeader />
      
      <main className="container mx-auto px-6 py-8 max-w-7xl">
        
        {/* --- ELEGANT CUSTOMER HERO SECTION --- */}
        <div className="bg-[#4A1D46]/95 backdrop-blur-xl rounded-[2rem] p-10 md:p-12 shadow-2xl border border-white/20 mb-12 text-white relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
            
            {/* Decorative background glows */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#D883B7]/20 rounded-full blur-[80px] pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#9B5DE5]/20 rounded-full blur-[80px] pointer-events-none"></div>
            
            <div className="relative z-10 text-center md:text-left">
                <div className="inline-block bg-white/10 px-5 py-1.5 rounded-full border border-white/20 text-xs font-bold tracking-widest uppercase mb-4 text-[#F3E5F5] shadow-inner">
                    My Account
                </div>
                <h1 className="text-4xl md:text-5xl font-serif font-bold tracking-wide mb-3">Your Profile</h1>
                <p className="text-[#D883B7] font-medium text-lg max-w-md mx-auto md:mx-0">
                    Manage your personal details, track orders, and curate your wishlist.
                </p>
            </div>
            
            <div className="relative z-10 flex items-center justify-center shrink-0">
                <div className="w-24 h-24 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center text-5xl shadow-inner border border-white/20 relative group hover:scale-105 transition-transform duration-500">
                    <span className="animate-pulse drop-shadow-[0_0_15px_rgba(216,131,183,0.6)]">👤</span>
                </div>
            </div>
        </div>
        {/* --- END HERO SECTION --- */}

        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
            {/* --- LEFT SIDEBAR (Profile Card) --- */}
            <div className="w-full md:w-1/3 flex flex-col gap-6">
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-xl border border-white/60 flex flex-col items-center text-center">
                    <div className="w-32 h-32 bg-gradient-to-tr from-[#D883B7] to-[#9B5DE5] rounded-full flex items-center justify-center text-5xl text-white shadow-inner mb-4 border-4 border-white">
                        {user.name ? user.name.charAt(0).toUpperCase() : '👤'}
                    </div>
                    <h2 className="text-2xl font-serif font-bold text-[#4A1D46] mb-1">{user.name || "Customer"}</h2>
                    <p className="text-sm text-gray-500 mb-8">{user.email}</p>

                    <div className="w-full space-y-4">
                        <button onClick={() => router.push('/wishlist')} className="w-full py-3.5 bg-white text-[#4A1D46] border border-pink-200 rounded-2xl font-bold shadow-sm hover:bg-pink-50 hover:border-pink-300 transition-all flex items-center justify-center gap-2">
                            <span>💖</span> My Wishlist
                        </button>
                        <button onClick={() => router.push('/profile/my-orders')} className="w-full py-3.5 bg-white text-[#4A1D46] border border-pink-200 rounded-2xl font-bold shadow-sm hover:bg-pink-50 hover:border-pink-300 transition-all flex items-center justify-center gap-2">
                            <span>📦</span> My Orders
                        </button>
                        <button onClick={() => router.push('/contact')} className="w-full py-3.5 bg-white text-[#4A1D46] border border-pink-200 rounded-2xl font-bold shadow-sm hover:bg-pink-50 hover:border-pink-300 transition-all flex items-center justify-center gap-2">
                            <span>✉️</span> Contact Owner
                        </button>
                    </div>
                </div>
                
                <div className="text-center">
                    <button onClick={() => setShowDeleteConfirm(true)} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors tracking-wide">Delete my account permanently</button>
                </div>
            </div>

            {/* --- RIGHT SIDE (Details View) --- */}
            <div className="w-full md:w-2/3">
                <div className="bg-white/60 backdrop-blur-xl p-10 rounded-[2.5rem] shadow-xl border border-white/60 relative min-h-[500px]">
                    <div className="flex justify-between items-center mb-10 pb-6 border-b border-pink-100">
                        <h2 className="text-3xl font-serif font-bold text-[#4A1D46]">Personal Details</h2>
                        <button 
                            onClick={openEdit} 
                            className="text-sm font-bold text-[#880e4f] bg-pink-50 hover:bg-[#880e4f] hover:text-white px-5 py-2.5 rounded-full transition-all border border-pink-200 hover:border-transparent shadow-sm flex items-center gap-2"
                        >
                            <span>✎</span> Edit Details
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                        <DetailRow label="Full Name" value={user.name} width="col-span-1 md:col-span-2" />
                        <DetailRow label="Email Address" value={user.email} width="col-span-1 md:col-span-2" />
                        <DetailRow label="Phone Number" value={user.phone} />
                        <DetailRow label="Gender" value={user.gender} />
                        <DetailRow label="Date of Birth" value={user.dob} width="col-span-1 md:col-span-2" />
                        <DetailRow label="Shipping Address" value={user.address} width="col-span-1 md:col-span-2" />
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* --- EDIT POPUP MODAL --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-lg w-full border border-white/60 relative animate-scale-up">
                
                <button onClick={closeEdit} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 text-2xl font-bold transition-colors leading-none">✕</button>

                <div className="flex flex-col items-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-tr from-[#D883B7] to-[#9B5DE5] rounded-full flex items-center justify-center text-3xl text-white shadow-inner mb-3">
                        ✎
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-[#4A1D46]">Edit Profile</h3>
                </div>

                <div className="space-y-5 max-h-[50vh] overflow-y-auto px-2 pb-4 custom-scrollbar">
                    
                    {/* Read-Only Email */}
                    <div className="opacity-60 cursor-not-allowed">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-3">Email Address</label>
                        <input type="text" value={editData.email} disabled className="w-full p-3.5 rounded-2xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed font-medium" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-3">Full Name</label>
                        <input type="text" name="name" value={editData.name} onChange={handleEditChange} placeholder="Enter your full name" className="w-full p-3.5 rounded-2xl bg-white border border-pink-100 focus:border-[#9B5DE5] focus:ring-1 focus:ring-[#9B5DE5] outline-none font-medium shadow-sm transition-all text-[#4A1D46]" />
                    </div>

                    {/* PHONE NUMBER FIELD WITH FROZEN +94 */}
                    <div>
                        <label className="block text-xs font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-3">Phone Number</label>
                        <div className="flex items-center w-full p-3.5 rounded-2xl bg-white border border-pink-100 focus-within:border-[#9B5DE5] focus-within:ring-1 focus-within:ring-[#9B5DE5] shadow-sm transition-all">
                            <span className="text-gray-400 font-bold mr-2 select-none">+94</span>
                            <input 
                                type="text" 
                                name="phoneNoPrefix" 
                                value={editData.phoneNoPrefix} 
                                onChange={handleEditChange} 
                                maxLength={9} 
                                placeholder="7XXXXXXXX" 
                                className="w-full outline-none bg-transparent font-medium text-[#4A1D46]"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-3">Shipping Address</label>
                        <input type="text" name="address" value={editData.address} onChange={handleEditChange} placeholder="Enter your full address" className="w-full p-3.5 rounded-2xl bg-white border border-pink-100 focus:border-[#9B5DE5] focus:ring-1 focus:ring-[#9B5DE5] outline-none font-medium shadow-sm transition-all text-[#4A1D46]" />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-5">
                        <div className="w-full sm:w-1/2">
                            <label className="block text-xs font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-3">Date of Birth</label>
                            <input type="date" name="dob" max={maxDate} value={editData.dob} onChange={handleEditChange} className="w-full p-3.5 rounded-2xl bg-white border border-pink-100 focus:border-[#9B5DE5] focus:ring-1 focus:ring-[#9B5DE5] outline-none font-medium shadow-sm transition-all text-[#4A1D46] cursor-pointer" />
                        </div>
                        <div className="w-full sm:w-1/2">
                            <label className="block text-xs font-bold text-[#D883B7] uppercase tracking-widest mb-1.5 ml-3">Gender</label>
                            <select name="gender" value={editData.gender} onChange={handleEditChange} className="w-full p-3.5 rounded-2xl bg-white border border-pink-100 focus:border-[#9B5DE5] focus:ring-1 focus:ring-[#9B5DE5] outline-none font-medium shadow-sm transition-all text-[#4A1D46] cursor-pointer appearance-none">
                                <option value="">Select</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8 pt-6 border-t border-pink-50">
                    <button onClick={closeEdit} className="flex-1 py-3.5 bg-gray-50 text-gray-500 rounded-full font-bold hover:bg-gray-100 transition-colors border border-gray-200">Discard</button>
                    <button onClick={saveChanges} className="flex-1 py-3.5 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all">Save Changes</button>
                </div>
            </div>
        </div>
      )}

      {/* --- CUSTOM ALERT DIALOG --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 relative animate-scale-up">
              <button onClick={() => setAlertState({ ...alertState, show: false })} className="absolute top-5 right-5 text-gray-400 hover:text-[#880e4f] transition-colors p-2 text-xl leading-none">✕</button>
              
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border 
                  ${alertState.type === 'success' ? 'bg-green-50 border-green-200 text-green-500' : 'bg-[#FFF9C4] border-[#FFF59D] text-yellow-600'}`}>
                {alertState.type === 'success' ? '✅' : '⚠️'}
              </div>
              
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium text-sm">{alertState.message}</p>
              
              <button onClick={() => setAlertState({ ...alertState, show: false })} className="px-10 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all w-full border border-white/20">
                Continue
              </button>
           </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 animate-scale-up">
              <div className="w-16 h-16 bg-[#FFEBEE] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#FFCDD2] text-red-500">💔</div>
              <h3 className="text-2xl font-serif font-bold text-[#4A1D46] mb-2">Delete Account?</h3>
              <p className="text-[#7B2C62] font-medium text-sm mb-8">This action cannot be undone. All your data, orders, and wishlist items will be permanently lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors">Cancel</button>
                <button className="flex-1 py-3 bg-gradient-to-r from-[#e53935] to-[#d32f2f] text-white rounded-xl font-bold shadow-lg hover:shadow-red-200 hover:scale-105 transition-all">Yes, Delete</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

// Helper Component for Display Rows
const DetailRow = ({ label, value, width = "w-full" }: { label: string, value: string, width?: string }) => (
    <div className={width}>
        <p className="text-[10px] font-bold text-[#D883B7] uppercase mb-1.5 tracking-widest ml-3">{label}</p>
        <div className="px-5 py-4 bg-white/50 rounded-2xl border border-white/60 text-[#4a1d46] font-medium shadow-sm min-h-[3.5rem] flex items-center">
            {value || <span className="text-gray-400 italic">Not set</span>}
        </div>
    </div>
);