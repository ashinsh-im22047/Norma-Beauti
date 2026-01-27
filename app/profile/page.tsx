"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  
  const [profile, setProfile] = useState({
    fullName: '', 
    email: '', 
    phoneNumber: '', 
    address: '', 
    dob: '', 
    gender: 'Select'
  });

  // --- 1. FETCH REAL DATA ON LOAD ---
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userId = localStorage.getItem('userId');
        const storedEmail = localStorage.getItem('userEmail');

        if (!userId) {
            router.push('/login'); 
            return;
        }

        const res = await fetch(`/api/profile?id=${userId}`);
        
        if (res.ok) {
            const data = await res.json();
            setProfile({
                fullName: data.name || data.fullName || '', 
                email: data.email || storedEmail || '',
                phoneNumber: data.phone || data.phoneNumber || '',
                address: data.address || '',
                dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : '',
                gender: data.gender || 'Select'
            });
        }
      } catch (err) { 
        console.error("Failed to load profile", err); 
      } finally {
        setIsFetching(false);
      }
    };
    fetchProfile();
  }, [router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  // --- 2. ROBUST SAVE FUNCTION ---
  const handleSave = async () => {
    setLoading(true);
    try {
        const userId = localStorage.getItem('userId');

        if (!userId) {
            alert("User ID not found. Please log in again.");
            router.push('/login');
            return;
        }
        
        const payload = { 
            userId: userId,   
            id: userId,       
            
            fullName: profile.fullName,
            name: profile.fullName, 
            
            phoneNumber: profile.phoneNumber,
            phone: profile.phoneNumber, 
            
            address: profile.address,
            dob: profile.dob,
            gender: profile.gender
        };

        const response = await fetch('/api/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert("Changes Saved Successfully!");
            localStorage.setItem('userName', profile.fullName); 
        } else {
            const errorData = await response.json();
            console.error("Server Error:", errorData);
            alert(`Failed to save: ${errorData.message || 'Check server console for details'}`);
        }
    } catch (error) { 
        console.error("Network Error:", error);
        alert("Error connecting to server."); 
    } finally { 
        setLoading(false); 
    }
  };

  if (isFetching) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] text-[#880e4f]">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#f06292]"></div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-[#fff0f5] to-[#fce4ec] font-sans text-[#4a1d46]">
      <CustomerHeader />

      <div className="fixed top-20 left-0 w-96 h-96 bg-[#f48fb1]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-[#f06292]/20 rounded-full blur-[120px] pointer-events-none"></div>

      <main className="container mx-auto px-6 py-12 relative z-10 flex justify-center">
        <div className="w-full max-w-5xl flex flex-col md:flex-row gap-8">
            
            {/* Sidebar */}
            <div className="w-full md:w-1/3 flex flex-col items-center gap-6">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full bg-white/40 backdrop-blur-md border border-white/60 shadow-xl flex items-center justify-center overflow-hidden">
                        <span className="text-5xl">👤</span>
                    </div>
                </div>
                <h2 className="text-xl font-serif font-bold text-[#880e4f] tracking-wide text-center">
                    {profile.fullName || 'User'}
                </h2>

                <div className="w-full flex flex-col gap-3 mt-2">
                    {/* UPDATED: Added onClick to Navigate to Wishlist */}
                    <button 
                        onClick={() => router.push('/wishlist')}
                        className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-3"
                    >
                         Wishlist
                    </button>
                    
                    <button className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-3">
                         My Orders
                    </button>
                    <button className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-3">
                        Contact Owner
                    </button>
                </div>
            </div>

            {/* Profile Form */}
            <div className="w-full md:w-2/3 bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] p-8 md:p-12 shadow-2xl">
                <h1 className="text-3xl font-serif font-bold text-[#880e4f] mb-8 border-b border-[#f06292]/30 pb-4">Account Details</h1>
                <div className="flex flex-col gap-6">
                    <h3 className="text-sm font-bold text-[#ad1457] uppercase tracking-widest opacity-80">Personal Details</h3>

                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#880e4f] ml-2">NAME</label>
                        <input type="text" name="fullName" value={profile.fullName} onChange={handleInputChange} className="w-full bg-white/50 px-6 py-3 rounded-xl border border-white/50 text-[#4a1d46] font-medium focus:outline-none focus:ring-2 focus:ring-[#f06292] shadow-sm transition-all"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#880e4f] ml-2">EMAIL</label>
                        <input type="email" name="email" value={profile.email} readOnly className="w-full bg-white/30 px-6 py-3 rounded-xl border border-white/30 text-gray-500 cursor-not-allowed"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#880e4f] ml-2">PHONE NUMBER</label>
                        <input type="tel" name="phoneNumber" value={profile.phoneNumber} onChange={handleInputChange} className="w-full bg-white/50 px-6 py-3 rounded-xl border border-white/50 text-[#4a1d46] font-medium focus:outline-none focus:ring-2 focus:ring-[#f06292] shadow-sm transition-all"/>
                    </div>
                    <div className="flex flex-col gap-2">
                        <label className="text-xs font-bold text-[#880e4f] ml-2">ADDRESS</label>
                        <input type="text" name="address" value={profile.address} onChange={handleInputChange} className="w-full bg-white/50 px-6 py-3 rounded-xl border border-white/50 text-[#4a1d46] font-medium focus:outline-none focus:ring-2 focus:ring-[#f06292] shadow-sm transition-all"/>
                    </div>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex flex-col gap-2 w-full md:w-1/2">
                            <label className="text-xs font-bold text-[#880e4f] ml-2">DATE OF BIRTH</label>
                            <input type="date" name="dob" value={profile.dob} onChange={handleInputChange} className="w-full bg-white/50 px-6 py-3 rounded-xl border border-white/50 text-[#4a1d46] font-medium focus:outline-none focus:ring-2 focus:ring-[#f06292] shadow-sm transition-all"/>
                        </div>
                        <div className="flex flex-col gap-2 w-full md:w-1/2">
                            <label className="text-xs font-bold text-[#880e4f] ml-2">GENDER</label>
                            <select name="gender" value={profile.gender} onChange={handleInputChange} className="w-full bg-white/50 px-6 py-3 rounded-xl border border-white/50 text-[#4a1d46] font-medium focus:outline-none focus:ring-2 focus:ring-[#f06292] shadow-sm transition-all cursor-pointer appearance-none"><option>Select</option><option>Female</option><option>Male</option><option>Other</option></select>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <button onClick={handleSave} disabled={loading} className="px-10 py-3 rounded-full bg-gradient-to-r from-[#e91e63] to-[#ff4081] text-white font-bold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300">
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </main>
    </div>
  );
}