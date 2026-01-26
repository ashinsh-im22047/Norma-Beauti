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
      // NOTE: Ensure your 'app/api/login/route.ts' returns the role correctly!
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Session Management (LocalStorage)
      if (data.user) {
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        if (data.user.role) localStorage.setItem('userRole', data.user.role);
      }

      // ✅ NEW: Set the "Gatekeeper" Cookie
      // This allows the Middleware to let you visit the Home Page
      document.cookie = "user_session=true; path=/; max-age=86400"; 

      alert('Login Successful!');

      // --- SMART REDIRECT FIXED ---
      // Your database sends 'ADMIN', so we check for that.
      if (data.user.role === 'ADMIN') {
        router.push('/admin/dashboard'); 
      } else {
        router.push('/');
      }

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-900 font-sans">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/backgroundimage.jpg" 
          alt="Background" 
          fill 
          className="object-cover blur-sm opacity-90" 
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-3xl h-[500px] flex rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* LEFT SIDE: Dark Teal Background */}
        <div className="w-1/2 bg-[#134B5F] flex flex-col items-center justify-center p-8 text-center relative">
            <div className="w-32 h-32 bg-[#134B5F] rounded-full flex items-center justify-center mb-4 shadow-xl border-4 border-[#134B5F] relative z-20 overflow-hidden">
                 <Image src="/logo.jpeg" alt="Logo" width={120} height={120} className="object-cover" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white tracking-widest leading-snug uppercase">
              Welcome To<br />Norma Beauti
            </h2>
            <p className="text-white/80 mt-2 text-xs tracking-wide font-light">
              Your beauty, our passion.
            </p>
        </div>

        {/* RIGHT SIDE: OFF-WHITE Background */}
        <div className="w-1/2 bg-[#FAF9F6] flex flex-col items-center justify-center p-10">
            <h2 className="text-3xl font-bold text-black mb-6">Login</h2>

            <div className="w-full flex flex-col gap-4">
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#D8C5D3] text-gray-800 placeholder-gray-600 px-5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a4e69] text-sm"
              />
              <input 
                type="password" 
                placeholder="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#D8C5D3] text-gray-800 placeholder-gray-600 px-5 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a4e69] text-sm"
              />

              <button 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#403b58] hover:bg-[#2e2a40] text-white font-bold py-3 rounded-xl shadow-md transition-all mt-2 text-md"
              >
                {loading ? 'Checking...' : 'Login'}
              </button>

              <div className="text-center flex flex-col gap-1 mt-2">
                 <Link href="/forgot-password" className="text-[#403b58] text-xs font-semibold hover:underline">
                   Forgot your password?
                 </Link>
                 <p className="text-[#403b58] text-xs">
                   Don't have an account? <Link href="/register" className="font-bold hover:underline">sign up</Link>
                 </p>
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}