'use client'
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleReset = async () => {
    if (password !== confirmPassword) return alert("Passwords do not match");
    if (!token) return alert("Invalid link");

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        alert("Password successfully reset! Logging you in...");
        router.push('/login'); // Go to login Page
      } else {
        alert(data.error || "Failed to reset password");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (!token) return <div className="text-center p-20 text-red-500 font-bold">Invalid Link</div>;

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gray-100 font-sans">
      <div className="absolute inset-0 z-0">
        <Image src="/backgroundimage.jpg" alt="Background" fill className="object-cover blur-sm opacity-90" />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      <div className="relative z-10 bg-white/90 backdrop-blur-md p-10 rounded-[2rem] shadow-2xl w-full max-w-md text-center border border-white/40">
        <h2 className="text-2xl font-bold text-[#134B5F] mb-6">Reset Password</h2>
        
        <input 
          type="password" 
          placeholder="New Password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-[#f3e6ef] text-gray-800 px-5 py-3 rounded-full mb-4 focus:outline-none focus:ring-2 focus:ring-[#134B5F]"
        />
        
        <input 
          type="password" 
          placeholder="Confirm New Password" 
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full bg-[#f3e6ef] text-gray-800 px-5 py-3 rounded-full mb-6 focus:outline-none focus:ring-2 focus:ring-[#134B5F]"
        />

        <button 
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-[#134B5F] hover:bg-[#0f3c4c] text-white font-bold py-3 rounded-full transition shadow-lg"
        >
          {loading ? 'Updating...' : 'Set New Password'}
        </button>
      </div>
    </div>
  );
}