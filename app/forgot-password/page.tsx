'use client'
import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return alert("Please enter your email");
    
    setLoading(true);
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        alert("If an account exists with this email, you will receive a reset link shortly.");
      } else {
        alert("Something went wrong. Please try again.");
      }
    } catch (error) {
      alert("Error sending request.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-100 font-sans">
      <div className="absolute inset-0 z-0">
        <Image src="/backgroundimage.jpg" alt="Background" fill className="object-cover blur-sm opacity-90" />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      <div className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-[2rem] shadow-2xl w-full max-w-md text-center border border-white/40">
        <div className="w-16 h-16 bg-[#134B5F] rounded-full flex items-center justify-center shadow-lg border-2 border-white mx-auto mb-6 overflow-hidden">
             <Image src="/logo.jpeg" alt="Logo" width={64} height={64} className="object-cover" />
        </div>
        
        <h2 className="text-2xl font-bold text-[#134B5F] mb-2">Forgot Password?</h2>
        <p className="text-gray-600 mb-8 text-sm">Enter your email to receive a reset link.</p>

        <input 
          type="email" 
          placeholder="Enter your email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full bg-[#f3e6ef] text-gray-800 px-5 py-3 rounded-full mb-4 focus:outline-none focus:ring-2 focus:ring-[#134B5F]"
        />

        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-[#134B5F] hover:bg-[#0f3c4c] text-white font-bold py-3 rounded-full transition shadow-lg"
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <Link href="/login" className="block mt-6 text-sm text-gray-500 hover:text-[#134B5F] font-bold">
          ← Back to Login
        </Link>
      </div>
    </div>
  );
}