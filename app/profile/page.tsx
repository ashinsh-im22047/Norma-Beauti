"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import CustomerHeader from '@/components/CustomerHeader'; 

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null); 
  
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', dob: '', gender: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const storedUserId = localStorage.getItem('userId');
        const url = storedUserId ? `/api/profile?id=${storedUserId}` : '/api/profile';
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data);
          setFormData({
            name: data.name || '', email: data.email || '', phone: data.phone || '',
            address: data.address || '', dob: data.dob || '', gender: data.gender || ''
          });
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    if (!currentUser?.userid) return alert("Error: User ID missing");
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: currentUser.userid, ...formData })
      });
      if (res.ok) alert("Changes Saved!");
      else alert("Failed to save.");
    } catch (err) { alert("Error saving."); }
  };

  const handleLogout = () => {
    document.cookie = "user_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    localStorage.clear(); 
    router.push('/login');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#483D58]">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3E6EF] to-[#E0B0D8] font-sans text-[#483D58]">
      
      <CustomerHeader />

      <div className="container mx-auto px-4 min-h-[calc(100vh-80px)] flex items-start justify-center pt-10">
        <div className="flex flex-col md:flex-row w-full max-w-5xl gap-8">
            
            {/* LEFT SIDEBAR */}
            <div className="md:w-1/3 flex flex-col items-center gap-6">
                <div className="w-28 h-28 bg-[#D9D9D9] rounded-full flex items-center justify-center text-4xl shadow-lg border-4 border-white text-gray-600">
                    👤
                </div>
                <h2 className="text-2xl font-bold font-serif text-[#134B5F] text-center">{formData.name || "Guest User"}</h2>

                <div className="flex flex-col gap-3 w-full max-w-[220px] mt-2">
                    <button className="bg-[#483D58] hover:bg-[#2e2a40] text-white py-3 px-6 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-3">
                        <span>❤️</span> Wishlist
                    </button>
                    <button className="bg-[#483D58] hover:bg-[#2e2a40] text-white py-3 px-6 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-3">
                        <span>📦</span> My Orders
                    </button>
                    <button className="bg-[#483D58] hover:bg-[#2e2a40] text-white py-3 px-6 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-3">
                        <span>📞</span> Contact Owner
                    </button>
                    <button onClick={handleLogout} className="bg-white hover:bg-red-50 text-red-600 border-2 border-red-100 py-3 px-6 rounded-xl font-bold text-sm shadow-md transition flex items-center gap-3">
                        <span>🚪</span> Logout
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE (Form) */}
            <div className="md:w-2/3">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-black font-serif">Account Details</h1>
                </div>

                <div className="bg-[#D9D9D9]/40 backdrop-blur-md rounded-[2rem] p-8 shadow-xl border border-white/40">
                    <h3 className="text-sm font-bold mb-4 text-black pl-1">Personal Details</h3>
                    
                    <div className="flex flex-col gap-3">
                        
                        {/* Name */}
                        <div className="bg-[#EAE0E4]/80 p-2 rounded-lg px-4 border border-white/50">
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Name</label>
                            <input type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="bg-transparent w-full text-gray-900 font-bold text-sm focus:outline-none"/>
                        </div>

                        {/* ✅ EMAIL FIELD (READ-ONLY & TRANSPARENT) */}
                        <div className="bg-[#EAE0E4]/40 p-2 rounded-lg px-4 border border-white/20">
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Email</label>
                            <input 
                                type="email" 
                                value={formData.email} 
                                readOnly // 1. Prevents editing
                                className="bg-transparent w-full text-gray-600 font-bold text-sm focus:outline-none opacity-50 cursor-not-allowed" // 2. Increases transparency
                            />
                        </div>

                        {/* Phone */}
                        <div className="bg-[#EAE0E4]/80 p-2 rounded-lg px-4 border border-white/50 relative">
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Phone Number</label>
                            <input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} className="bg-transparent w-full text-gray-900 font-bold text-sm focus:outline-none"/>
                            <span className="absolute right-4 top-4 text-[10px] font-bold text-gray-500">Home</span>
                        </div>

                        {/* Address */}
                        <div className="bg-[#EAE0E4]/80 p-2 rounded-lg px-4 border border-white/50">
                            <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Address</label>
                            <input type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} className="bg-transparent w-full text-gray-900 font-bold text-sm focus:outline-none"/>
                        </div>

                        {/* DOB & Gender */}
                        <div className="flex gap-3">
                            <div className="w-1/2 bg-[#EAE0E4]/80 p-2 rounded-lg px-4 border border-white/50">
                                <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Date of Birth</label>
                                <input type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} className="bg-transparent w-full text-gray-900 font-bold text-sm focus:outline-none"/>
                            </div>
                            <div className="w-1/2 bg-[#EAE0E4]/80 p-2 rounded-lg px-4 border border-white/50">
                                <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Gender</label>
                                <select value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})} className="bg-transparent w-full text-gray-900 font-bold text-sm focus:outline-none cursor-pointer">
                                    <option value="">Select</option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end mt-2">
                            <button onClick={handleSave} className="bg-[#483D58] text-white px-6 py-2 rounded-full font-bold text-sm shadow-lg hover:bg-[#352c42] transition transform hover:scale-105">
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}