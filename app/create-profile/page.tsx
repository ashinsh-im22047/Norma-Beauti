'use client'
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function CreateProfile() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  const [fullName, setFullName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Select');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!email) {
      // If no email in URL, send them back to login
      router.push('/login');
    }
  }, [email, router]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email, 
          fullName, 
          address, 
          phoneNumber: phone, 
          dob, 
          gender 
        }),
      });

      if (!response.ok) throw new Error('Failed to create profile');

      // Success! Save name for the home page greeting
      localStorage.setItem('userEmail', email || '');
      localStorage.setItem('userName', fullName); // Save name to show "Hi, [Name]"

      alert('Profile Setup Complete!');
      router.push('/'); // Go to Home

    } catch (error) {
      alert('Error saving profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gray-100 font-sans">
      
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/backgroundimage.jpg" 
          alt="Background" 
          fill 
          className="object-cover blur-sm opacity-90" 
        />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      {/* Main Card */}
      <div className="relative z-10 bg-[#d4b0c7]/90 backdrop-blur-md p-8 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col items-center border border-white/40">
        
        {/* Logo */}
        <div className="w-16 h-16 bg-[#1a4a5a] rounded-full flex items-center justify-center shadow-lg border-2 border-white mb-4 overflow-hidden">
             <Image src="/logo.jpeg" alt="Logo" width={64} height={64} className="object-cover" />
        </div>

        <h2 className="text-2xl font-serif font-bold text-[#1a4a5a] mb-1">Complete Your Profile</h2>
        <p className="text-xs text-[#1a4a5a] mb-6">We need a few details to deliver your items.</p>

        <div className="w-full flex flex-col gap-3">
          
          {/* Full Name */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1a4a5a] ml-3">Full Name *</label>
            <input 
              type="text" 
              placeholder="e.g. Prabhani Maheeka" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full bg-[#f3e6ef] text-gray-800 px-5 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a5a]"
            />
          </div>

          {/* Shipping Address */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1a4a5a] ml-3">Shipping Address *</label>
            <input 
              type="text" 
              placeholder="e.g. 123 Flower Road, Colombo" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-[#f3e6ef] text-gray-800 px-5 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a5a]"
            />
          </div>

          {/* Phone Number */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-bold text-[#1a4a5a] ml-3">Phone Number *</label>
            <input 
              type="tel" 
              placeholder="e.g. 077 123 4567" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-[#f3e6ef] text-gray-800 px-5 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a5a]"
            />
          </div>

          {/* Row for DOB and Gender */}
          <div className="flex gap-3">
            <div className="flex flex-col gap-1 w-2/3">
                <label className="text-xs font-bold text-[#1a4a5a] ml-3">Date of Birth (Optional)</label>
                <input 
                type="date" 
                value={dob}
                onChange={(e) => setDob(e.target.value)}
                className="w-full bg-[#f3e6ef] text-gray-800 px-5 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a5a]"
                />
            </div>
            <div className="flex flex-col gap-1 w-1/3">
                <label className="text-xs font-bold text-[#1a4a5a] ml-3">Gender</label>
                <select 
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full bg-[#f3e6ef] text-gray-800 px-4 py-3 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#1a4a5a]"
                >
                  <option>Select</option>
                  <option>Female</option>
                  <option>Male</option>
                  <option>Other</option>
                </select>
            </div>
          </div>

          {/* Submit Button */}
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-[#1a4a5a] hover:bg-[#133842] text-white font-bold py-3 rounded-full shadow-lg transition-all mt-4"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </button>

        </div>
      </div>
    </div>
  );
}