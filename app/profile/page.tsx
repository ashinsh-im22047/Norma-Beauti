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
    // Prepare edit data from current user data
    // Remove +94 prefix for the input field
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
    // --- SPECIFIC VALIDATION MESSAGES ---
    
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
        email: editData.email, // Email is sent but ignored by backend if locked
        phone: `+94${editData.phoneNoPrefix}`, // Re-attach prefix
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
        // Update main view with new data
        setUser({ ...finalProfile, phone: finalProfile.phone });
        setShowEditModal(false);
        setAlertState({ show: true, type: 'success', title: 'Success', message: 'Profile updated successfully.' });
      } else {
        throw new Error("Update failed");
      }
    } catch (error) {
      setAlertState({ show: true, type: 'error', title: 'Error', message: 'Failed to save changes.' });
    }
  };

  // Get Today's Date for Max Date Attribute
  const maxDate = new Date().toISOString().split("T")[0];

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#880e4f]">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46]">
      <CustomerHeader />
      
      <main className="container mx-auto px-6 py-12 flex flex-col md:flex-row gap-12 max-w-6xl">
        
        {/* --- LEFT SIDEBAR (Profile Card) --- */}
        <div className="w-full md:w-1/3 flex flex-col gap-6">
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2.5rem] shadow-2xl border border-white/60 flex flex-col items-center text-center">
                <div className="w-32 h-32 bg-gradient-to-tr from-[#f8bbd0] to-[#f48fb1] rounded-full flex items-center justify-center text-5xl text-white shadow-inner mb-4 border-4 border-white">
                    👤
                </div>
                <h2 className="text-2xl font-bold text-[#880e4f] mb-1">{user.name || "Customer"}</h2>
                <p className="text-sm text-gray-500 mb-6">{user.email}</p>

                <div className="w-full space-y-3">
                    <button onClick={() => router.push('/wishlist')} className="w-full py-3 bg-[#e91e63] text-white rounded-xl font-bold shadow-lg hover:bg-[#d81b60] transition-all">Wishlist</button>
                    <button onClick={() => router.push('/profile/my-orders')} className="w-full py-3 bg-[#ec407a] text-white rounded-xl font-bold shadow-lg hover:bg-[#e91e63] transition-all">My Orders</button>
                    <button onClick={() => router.push('/contact')} className="w-full py-3 bg-[#f06292] text-white rounded-xl font-bold shadow-lg hover:bg-[#ec407a] transition-all">Contact Owner</button>
                </div>
            </div>
            <div className="text-center">
                <button onClick={() => setShowDeleteConfirm(true)} className="text-xs text-gray-400 hover:text-red-500 underline transition-colors">Delete my account permanently</button>
            </div>
        </div>

        {/* --- RIGHT SIDE (Details View) --- */}
        <div className="w-full md:w-2/3">
            <div className="bg-white/60 backdrop-blur-md p-10 rounded-[2.5rem] shadow-xl border border-white/50 relative min-h-[500px]">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-serif font-bold text-[#880e4f]">Personal Details</h2>
                    <button onClick={openEdit} className="text-sm text-[#ad1457] hover:text-[#880e4f] hover:bg-[#fce4ec] px-4 py-2 rounded-full transition-all border border-transparent hover:border-[#f8bbd0]">✎ Edit Details</button>
                </div>

                <div className="space-y-6">
                    <DetailRow label="Full Name" value={user.name} />
                    <DetailRow label="Email Address" value={user.email} />
                    <DetailRow label="Phone Number" value={user.phone} />
                    <DetailRow label="Address" value={user.address} />
                    <div className="flex gap-8">
                        <DetailRow label="Date of Birth" value={user.dob} width="w-1/2" />
                        <DetailRow label="Gender" value={user.gender} width="w-1/2" />
                    </div>
                </div>
            </div>
        </div>
      </main>

      {/* --- EDIT POPUP MODAL (Glassmorphism) --- */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white/95 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-lg w-full border border-white relative">
                
                <button onClick={closeEdit} className="absolute top-5 right-5 text-gray-400 hover:text-[#880e4f] text-xl font-bold">✕</button>

                <h3 className="text-2xl font-serif font-bold text-[#880e4f] mb-6 text-center">Edit Profile</h3>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto p-2 custom-scrollbar">
                    
                    {/* Read-Only Email */}
                    <div className="opacity-60 cursor-not-allowed">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email (Cannot Change)</label>
                        <input type="text" value={editData.email} disabled className="w-full p-3 rounded-xl bg-gray-100 border border-gray-200 text-gray-500 cursor-not-allowed" />
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">Full Name</label>
                        <input type="text" name="name" value={editData.name} onChange={handleEditChange} placeholder="Enter your full name" className="w-full p-3 rounded-xl bg-white border border-gray-200 focus:border-[#e91e63] outline-none" />
                    </div>

                    {/* PHONE NUMBER FIELD WITH FROZEN +94 */}
                    <div>
                        <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">Phone Number</label>
                        <div className="flex items-center w-full p-3 rounded-xl bg-white border border-gray-200 focus-within:border-[#e91e63]">
                            <span className="text-gray-500 font-bold mr-2 select-none">+94</span>
                            <input 
                                type="text" 
                                name="phoneNoPrefix" 
                                value={editData.phoneNoPrefix} 
                                onChange={handleEditChange} 
                                maxLength={9} 
                                placeholder="7XXXXXXXX" 
                                className="w-full outline-none bg-transparent"
                            />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 ml-1">Enter exactly 9 digits.</p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">Address</label>
                        <input type="text" name="address" value={editData.address} onChange={handleEditChange} placeholder="Enter your address" className="w-full p-3 rounded-xl bg-white border border-gray-200 focus:border-[#e91e63] outline-none" />
                    </div>

                    <div className="flex gap-4">
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">DOB</label>
                            {/* MAX set to Today to prevent future dates */}
                            <input type="date" name="dob" max={maxDate} value={editData.dob} onChange={handleEditChange} className="w-full p-3 rounded-xl bg-white border border-gray-200 focus:border-[#e91e63] outline-none" />
                        </div>
                        <div className="w-1/2">
                            <label className="block text-xs font-bold text-[#ad1457] uppercase mb-1">Gender</label>
                            <select name="gender" value={editData.gender} onChange={handleEditChange} className="w-full p-3 rounded-xl bg-white border border-gray-200 focus:border-[#e91e63] outline-none">
                                <option value="">Select</option>
                                <option value="Female">Female</option>
                                <option value="Male">Male</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 mt-8">
                    <button onClick={closeEdit} className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Discard</button>
                    <button onClick={saveChanges} className="flex-1 py-3 bg-gradient-to-r from-[#e91e63] to-[#c2185b] text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all">Save Changes</button>
                </div>
            </div>
        </div>
      )}

      {/* --- CUSTOM ALERT DIALOG --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border ${alertState.type === 'success' ? 'bg-green-100 border-green-200' : 'bg-red-100 border-red-200'}`}>
                {alertState.type === 'success' ? '✅' : '⚠️'}
              </div>
              <h3 className="text-2xl font-serif font-bold mb-2 text-[#4A1D46]">{alertState.title}</h3>
              <p className="text-[#7B2C62] mb-8 font-medium">{alertState.message}</p>
              <button onClick={() => setAlertState({ ...alertState, show: false })} className="px-10 py-3 bg-gray-800 text-white rounded-full font-bold shadow-lg hover:scale-105 transition-all">Okay</button>
           </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border-2 border-red-100">
              <h3 className="text-2xl font-bold text-red-600 mb-2">Delete Account?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone. All your data will be lost.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-2 bg-gray-100 rounded-xl font-bold">Cancel</button>
                <button className="flex-1 py-2 bg-red-500 text-white rounded-xl font-bold">Delete</button>
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
        <p className="text-xs font-bold text-[#ad1457] uppercase mb-1 tracking-wider">{label}</p>
        <div className="p-4 bg-white/50 rounded-xl border border-white/40 text-[#4a1d46] font-medium shadow-sm min-h-[3.5rem] flex items-center">
            {value || <span className="text-gray-400 italic">Not set</span>}
        </div>
    </div>
);