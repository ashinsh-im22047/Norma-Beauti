'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // New State
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async () => {
    // 1. Validation: Check if passwords match
    if (password !== confirmPassword) {
      alert("Passwords do not match!");
      return;
    }

    setLoading(true);
    try {
      // 2. Send only email and password to backend
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      alert('Registration successful! Please check your email to verify.');
      router.push('/login');

    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden">
      
      {/* Background Layer */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/backgroundimage.jpg" 
          alt="Background" 
          fill 
          className="object-cover blur-sm opacity-90" 
        />
        <div className="absolute inset-0 bg-black/30" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 bg-[#d4b0c7]/90 backdrop-blur-md p-10 rounded-[3rem] shadow-2xl w-full max-w-md flex flex-col items-center gap-6 border border-white/40">
        
        {/* Logo Section */}
        <div className="w-20 h-20 bg-[#1a4a5a] rounded-full flex items-center justify-center shadow-lg border-2 border-white mb-2 overflow-hidden">
             <Image src="/logo.jpeg" alt="Logo" width={80} height={80} className="object-cover" />
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-[#1a4a5a]" style={{ fontFamily: 'serif' }}>
            Create your account
          </h1>
          <p className="text-sm text-[#1a4a5a] mt-2 font-medium">
            or <span onClick={() => router.push('/login')} className="underline cursor-pointer hover:text-white transition">log in to your existing account</span>
          </p>
        </div>

        <div className="w-full flex flex-col gap-4">
          {/* Email Input */}
          <input 
            type="email" 
            placeholder="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-[#f3e6ef] text-gray-800 placeholder-gray-500 px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a4a5a] shadow-inner"
          />
          
          {/* Password Input */}
          <input 
            type="password" 
            placeholder="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-[#f3e6ef] text-gray-800 placeholder-gray-500 px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a4a5a] shadow-inner"
          />

          {/* Confirm Password Input (Replaced Username) */}
          <input 
            type="password" 
            placeholder="confirm password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full bg-[#f3e6ef] text-gray-800 placeholder-gray-500 px-6 py-3 rounded-full focus:outline-none focus:ring-2 focus:ring-[#1a4a5a] shadow-inner"
          />
        </div>

        <button 
          onClick={handleRegister}
          disabled={loading}
          className="bg-[#1a4a5a] text-white font-bold py-3 px-12 rounded-full shadow-lg hover:bg-[#133842] hover:scale-105 transition-all mt-2"
        >
          {loading ? 'Creating...' : 'Sign up'}
        </button>

      </div>

      <div className="absolute bottom-8 left-8 z-20">
        <button 
          onClick={() => router.back()} 
          className="bg-[#8c8c9e]/80 hover:bg-[#7a7a8a] text-white font-bold py-2 px-8 rounded-full shadow-md backdrop-blur-sm transition flex items-center gap-2"
        >
          <span className="text-xl">{'<'}</span> Back
        </button>
      </div>

    </div>
  );
}