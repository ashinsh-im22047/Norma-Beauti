'use client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('User');

  useEffect(() => {
    // 1. Try to get the Real Name first (saved from Create Profile)
    const realName = localStorage.getItem('userName');
    
    // 2. Try to get the Email (saved from Login/Register)
    const email = localStorage.getItem('userEmail');

    if (realName) {
      setDisplayName(realName);
    } else if (email) {
      const nameFromEmail = email.split('@')[0];
      setDisplayName(nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1));
    }
  }, []);

  return (
    <div className="min-h-screen bg-[#F3E6FA] flex flex-col font-sans">

      {/* --- NAVBAR --- */}
      <nav className="bg-[#134B5F] text-white px-8 py-4 flex justify-between items-center shadow-md z-50">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white bg-white">
             <Image src="/logo.jpeg" alt="Logo" width={40} height={40} className="object-cover" />
           </div>
           <span className="text-xl font-bold tracking-wide">Norma Beauti</span>
        </div>
        
        <div className="flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="hover:text-gray-300 transition">Home</Link>
          <Link href="/cart" className="hover:text-gray-300 transition">Cart</Link>
          <Link href="/login" className="hover:text-gray-300 transition">Login</Link>
          <button 
            onClick={() => router.push('/register')}
            className="bg-[#D4B0C7] text-[#134B5F] px-6 py-2 rounded-full font-bold hover:bg-[#EAD2E0] transition shadow-sm"
          >
            Sign Up
          </button>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <div className="relative w-full h-[480px] overflow-hidden">
        
        {/* --- BACKGROUND IMAGE IS HERE --- */}
        <Image 
          src="/homePageHeaderBackground.jpg" 
          alt="Home Background" 
          fill 
          className="object-cover object-center blur-sm scale-105"
          priority
        />
        
        {/* Dark overlay to make text readable */}
        <div className="absolute inset-0 bg-black/10" />

        {/* --- CONTENT ON TOP OF IMAGE --- */}
        <div className="relative z-10 container mx-auto px-10 h-full flex flex-col justify-center gap-8">
          
          {/* Top Row: Greeting & Search */}
          <div className="flex items-center justify-between gap-6">
            
            {/* Greeting Box */}
            <div className="flex items-center gap-4 bg-white/30 backdrop-blur-md border border-white/20 px-6 py-3 rounded-full shadow-lg">
               <div className="w-12 h-12 bg-[#134B5F] rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm">
                 {displayName.charAt(0).toUpperCase()}
               </div>
               <div>
                 <p className="text-[11px] text-[#134B5F] font-bold tracking-wider uppercase">Welcome Back</p>
                 <h2 className="text-xl font-extrabold text-[#134B5F]">Hi, {displayName}</h2>
               </div>
            </div>

            {/* Search Bar */}
            <div className="flex-1 max-w-2xl relative">
              <input 
                type="text" 
                placeholder="Search here..." 
                className="w-full bg-white/30 backdrop-blur-md border border-white/20 rounded-full px-8 py-5 pl-8 text-[#134B5F] placeholder-[#134B5F]/70 focus:outline-none focus:ring-2 focus:ring-[#134B5F] shadow-lg text-lg"
              />
              <button className="absolute right-6 top-1/2 -translate-y-1/2 text-[#134B5F]/70 hover:text-[#134B5F] text-xl">
                 🔍
              </button>
            </div>

          </div>

          {/* Bottom Row: Buttons */}
          <div className="flex items-center justify-between mt-6 pl-2">
             
             <div className="flex gap-4">
                <button className="bg-[#D4B0C7] text-[#4A2C38] px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#EAD2E0] transition">
                  Products
                </button>
                <button className="bg-white/30 backdrop-blur-md border border-white/20 text-[#134B5F] px-8 py-3 rounded-full font-bold shadow-lg hover:bg-white/40 transition">
                  Ready-Made Gift Boxes
                </button>
                <button className="bg-[#D4B0C7] text-[#4A2C38] px-8 py-3 rounded-full font-bold shadow-md hover:bg-[#EAD2E0] transition">
                  Customize Gift Boxes
                </button>
             </div>

             <div className="flex items-center gap-4">
               <button className="bg-white/30 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl text-sm font-bold shadow-lg text-[#134B5F] flex items-center gap-2 hover:bg-white/40">
                 Sort <span>▼</span>
               </button>
               <button className="bg-white/30 backdrop-blur-md border border-white/20 px-6 py-3 rounded-xl text-sm font-bold shadow-lg text-[#134B5F] flex items-center gap-2 hover:bg-white/40">
                 Filter <span>▼</span>
               </button>
               <button className="bg-[#EF4444] text-white px-8 py-3 rounded-full font-bold shadow-md hover:bg-red-600 transition text-lg">
                 View Offers
               </button>
             </div>

          </div>

        </div>
      </div>

      {/* --- NEW ARRIVALS SECTION --- */}
      <div className="container mx-auto px-10 py-16">
        <h2 className="text-4xl font-serif font-bold text-[#134B5F] text-center mb-12 tracking-wide">New Arrivals</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
           {[1, 2, 3, 4].map((item) => (
             <div key={item} className="bg-white h-72 rounded-[2.5rem] shadow-xl border border-gray-100 flex flex-col items-center justify-end pb-8 hover:shadow-2xl transition-all cursor-pointer hover:-translate-y-2">
               <span className="text-gray-400 font-medium">Product Item {item}</span>
             </div>
           ))}
        </div>
      </div>

    </div>
  );
}