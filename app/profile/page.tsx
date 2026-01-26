"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '', dob: '', gender: ''
  });

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/profile');
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({
            name: data.name || '',
            email: data.email || '',
            phone: data.phone || '',
            address: data.address || '',
            dob: data.dob ? data.dob.split('T')[0] : '',
            gender: data.gender || ''
          });
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // Save Data
  const handleSave = async () => {
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userid: user.userid, ...formData })
      });

      if (res.ok) {
        alert("Changes Saved!");
      } else {
        alert("Failed to save.");
      }
    } catch (err) { alert("Error saving."); }
  };

  const handleLogout = () => router.push('/login');

  if (loading) return <div className="min-h-screen flex items-center justify-center text-[#483D58]">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3E6EF] to-[#E0B0D8] font-sans text-[#483D58] relative overflow-hidden">
      
      {/* Top Right Logo Badge */}
      <div className="absolute top-8 right-8 z-20">
         <div className="w-20 h-20 bg-[#134B5F]/90 backdrop-blur-sm rounded-full flex flex-col items-center justify-center shadow-2xl text-white font-serif text-xs text-center p-2 border-2 border-[#E0B0D8]">
            <span className="text-lg">NB</span>
            <span className="text-[8px] tracking-widest">NORMA</span>
         </div>
      </div>

      {/* MAIN CONTAINER */}
      <div className="container mx-auto px-4 h-screen flex items-center justify-center">
        
        <div className="flex flex-col md:flex-row w-full max-w-5xl gap-8">
            
            {/* --- LEFT SIDEBAR (Profile Info) --- */}
            <div className="md:w-1/3 flex flex-col items-center gap-6">
                
                {/* Avatar Circle */}
                <div className="relative">
                    <div className="w-32 h-32 bg-[#D9D9D9] rounded-full flex items-center justify-center text-5xl shadow-lg border-4 border-white text-gray-600">
                        👤
                    </div>
                </div>
                
                <h2 className="text-2xl font-bold font-serif text-[#134B5F]">{formData.name || "User Name"}</h2>

                {/* Navigation Buttons (Pill Shape from Reference) */}
                <div className="flex flex-col gap-3 w-full max-w-xs mt-4">
                    <button className="bg-[#EBC7E0]/80 hover:bg-[#EBC7E0] text-[#483D58] py-3 px-6 rounded-2xl font-bold text-left shadow-sm transition backdrop-blur-sm border border-white/40">
                        My Orders
                    </button>
                    <button className="bg-[#EBC7E0]/80 hover:bg-[#EBC7E0] text-[#483D58] py-3 px-6 rounded-2xl font-bold text-left shadow-sm transition backdrop-blur-sm border border-white/40">
                        Contact Owner
                    </button>
                    <button onClick={handleLogout} className="bg-[#EBC7E0]/80 hover:bg-red-200 text-[#483D58] py-3 px-6 rounded-2xl font-bold text-left shadow-sm transition backdrop-blur-sm border border-white/40">
                        Logout
                    </button>
                </div>
            </div>

            {/* --- RIGHT SIDE (Form Card) --- */}
            <div className="md:w-2/3">
                <div className="text-center mb-4">
                    <h1 className="text-3xl font-bold text-black font-serif">Account Details</h1>
                </div>

                <div className="bg-[#D9D9D9]/50 backdrop-blur-md rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-white/60">
                    <h3 className="text-lg font-bold mb-6 text-black pl-2">Personal Details</h3>
                    
                    <div className="flex flex-col gap-4">
                        
                        {/* Name Field */}
                        <div className="bg-[#EAE0E4]/80 p-2 rounded-xl flex flex-col px-4 border border-white/50">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Name</label>
                            <input 
                              type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                              className="bg-transparent text-gray-900 font-medium focus:outline-none"
                            />
                        </div>

                        {/* Email Field */}
                        <div className="bg-[#EAE0E4]/80 p-2 rounded-xl flex flex-col px-4 border border-white/50">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Email</label>
                            <input 
                              type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                              className="bg-transparent text-gray-900 font-medium focus:outline-none"
                            />
                        </div>

                        {/* Phone Field */}
                        <div className="bg-[#EAE0E4]/80 p-2 rounded-xl flex flex-col px-4 border border-white/50 relative">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Phone Number</label>
                            <input 
                              type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})}
                              className="bg-transparent text-gray-900 font-medium focus:outline-none"
                            />
                            <span className="absolute right-4 top-4 text-xs font-bold text-gray-500">Home</span>
                        </div>

                        {/* Address Field */}
                        <div className="bg-[#EAE0E4]/80 p-2 rounded-xl flex flex-col px-4 border border-white/50">
                            <label className="text-[10px] text-gray-500 font-bold uppercase">Address</label>
                            <input 
                              type="text" value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})}
                              className="bg-transparent text-gray-900 font-medium focus:outline-none"
                            />
                        </div>

                        {/* Row: DOB & Gender */}
                        <div className="flex gap-4">
                            <div className="w-1/2 bg-[#EAE0E4]/80 p-2 rounded-xl flex flex-col px-4 border border-white/50">
                                <label className="text-[10px] text-gray-500 font-bold uppercase">Date of Birth</label>
                                <input 
                                  type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})}
                                  className="bg-transparent text-gray-900 font-medium focus:outline-none w-full"
                                />
                            </div>
                            <div className="w-1/2 bg-[#EAE0E4]/80 p-2 rounded-xl flex flex-col px-4 border border-white/50">
                                <label className="text-[10px] text-gray-500 font-bold uppercase">Gender</label>
                                <select 
                                  value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}
                                  className="bg-transparent text-gray-900 font-medium focus:outline-none w-full cursor-pointer appearance-none"
                                >
                                    <option value="">Select</option>
                                    <option value="Female">Female</option>
                                    <option value="Male">Male</option>
                                </select>
                            </div>
                        </div>

                        {/* Save Button */}
                        <div className="flex justify-end mt-4">
                            <button 
                              onClick={handleSave}
                              className="bg-[#483D58] text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-[#352c42] transition transform hover:scale-105"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* BOTTOM LEFT HOME BUTTON */}
      <div className="fixed bottom-6 left-6 z-30">
          <Link href="/" className="flex flex-col items-center group">
              <div className="w-14 h-14 bg-[#483D58] text-white rounded-full flex items-center justify-center shadow-2xl group-hover:bg-[#134B5F] transition border-4 border-[#F3E6EF]">
                  <span className="text-3xl">🏠</span>
              </div>
              <span className="text-xs font-bold text-[#483D58] mt-1 group-hover:text-[#134B5F]">Home</span>
          </Link>
      </div>

    </div>
  );
}