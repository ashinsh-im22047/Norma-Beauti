'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user) {
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        if (data.user.role) localStorage.setItem('userRole', data.user.role);
      }

      document.cookie = "user_session=true; path=/; max-age=86400"; 

      alert('Login Successful!');

      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard'); 
      } else {
        router.push('/shop'); 
      }

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- BACK BUTTON --- */}
      <Link href="/" className="absolute top-6 left-6 z-50">
        <button className="flex items-center gap-2 px-6 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-[#4A1D46] font-bold text-sm hover:bg-white/70 shadow-lg transition">
          <span>←</span> Back
        </button>
      </Link>

      {/* Main Card Container (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-4xl h-[550px] flex rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 backdrop-blur-xl bg-white/30">
        
        {/* LEFT SIDE: Dark Purple Gradient with Glass Effect */}
        <div className="w-1/2 bg-gradient-to-br from-[#4A1D46]/90 to-[#2E1029]/90 flex flex-col items-center justify-center p-10 text-center relative backdrop-blur-md">
            
            {/* Logo Circle with Glow */}
            <div className="w-36 h-36 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(216,131,183,0.3)] border border-white/20 relative z-20 overflow-hidden">
                 <Image src="/logo.jpeg" alt="Logo" width={140} height={140} className="object-cover opacity-90" />
            </div>
            
            <h2 className="text-3xl font-serif font-bold text-white tracking-widest leading-snug uppercase drop-shadow-md">
              Welcome To<br />Norma Beauti
            </h2>
            <p className="text-[#D883B7] mt-3 text-sm tracking-wide font-medium italic">
              Your beauty, our passion.
            </p>
        </div>

        {/* RIGHT SIDE: Light Glass Background */}
        <div className="w-1/2 bg-white/60 backdrop-blur-2xl flex flex-col items-center justify-center p-12 relative">
            <h2 className="text-4xl font-serif font-bold text-[#4A1D46] mb-8">Login</h2>

            <div className="w-full flex flex-col gap-5">
              
              {/* Email Input */}
              <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>

              {/* Password Input */}
              <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>

              {/* Login Button */}
              <button 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg transition-all mt-4 text-md tracking-wider border border-white/20"
              >
                {loading ? 'Checking...' : 'Login'}
              </button>

              <div className="text-center flex flex-col gap-2 mt-4">
                 <Link href="/forgot-password" className="text-[#7B2C62] text-xs font-semibold hover:text-[#9B5DE5] transition">
                   Forgot your password?
                 </Link>
                 <p className="text-[#4A1D46] text-xs">
                   Don't have an account? <Link href="/register" className="font-bold text-[#D883B7] hover:underline hover:text-[#9B5DE5] transition">Sign up</Link>
                 </p>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}