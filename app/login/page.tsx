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
      // 1. MySQL Backend Call
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // 2. Session Management
      localStorage.setItem('userId', data.user.id);
      localStorage.setItem('userEmail', data.user.email);

      alert('Login Successful!');
      router.push('/'); 

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-100">
      
      {/* Background Image (Blurred behind everything) */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/backgroundimage.jpg" 
          alt="Background" 
          fill 
          className="object-cover blur-sm opacity-90" 
        />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      {/* Main Card Container (Split Layout) */}
      <div className="relative z-10 w-full max-w-4xl h-[600px] flex rounded-[2rem] shadow-2xl overflow-hidden">
        
        {/* LEFT SIDE: Dark Teal Background with Logo */}
        <div className="w-1/2 bg-[#134B5F] flex flex-col items-center justify-center p-12 text-center relative">
            
            {/* Logo Circle */}
            <div className="w-40 h-40 bg-[#134B5F] rounded-full flex items-center justify-center mb-8 shadow-xl border-4 border-[#134B5F] relative z-20 overflow-hidden">
                 <Image 
                   src="/logo.jpeg" 
                   alt="Logo" 
                   width={150} 
                   height={150} 
                   className="object-cover" 
                 />
            </div>

            {/* Welcome Text */}
            <h2 className="text-4xl font-serif font-bold text-white tracking-widest leading-snug">
              WELCOME<br />BACK
            </h2>
        </div>

        {/* RIGHT SIDE: White Background with Form */}
        <div className="w-1/2 bg-white flex flex-col items-center justify-center p-12">
            
            <h2 className="text-4xl font-bold text-black mb-10">Login</h2>

            <div className="w-full flex flex-col gap-5">
              
              {/* Email Input */}
              <input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[#D8C5D3] text-gray-800 placeholder-gray-600 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a4e69]"
              />
              
              {/* Password Input */}
              <input 
                type="password" 
                placeholder="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-[#D8C5D3] text-gray-800 placeholder-gray-600 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#4a4e69]"
              />

              {/* Login Button */}
              <button 
                onClick={handleLogin}
                disabled={loading}
                className="w-full bg-[#403b58] hover:bg-[#2e2a40] text-white font-bold py-4 rounded-xl shadow-md transition-all mt-2 text-lg"
              >
                {loading ? 'Checking...' : 'Login'}
              </button>

              {/* Links */}
              <div className="text-center flex flex-col gap-2 mt-2">
                 <a href="/forgot-password" className="text-[#403b58] text-sm font-semibold hover:underline">
                   Forgot your password?
                 </a>
                 <p className="text-[#403b58] text-sm">
                   Don't have an account? <Link href="/register" className="font-bold hover:underline">sign up</Link>
                 </p>
              </div>

              {/* Admin Button */}
              <button 
                className="w-full bg-[#403b58] hover:bg-[#2e2a40] text-white font-bold py-4 rounded-xl shadow-md transition-all mt-4 text-lg"
              >
                Login as admin
              </button>

            </div>
        </div>

      </div>
    </div>
  );
}