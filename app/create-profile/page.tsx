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
      router.push('/login');
    }
  }, [email, router]);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName, address, phoneNumber: phone, dob, gender }),
      });

      if (!response.ok) throw new Error('Failed to create profile');

      localStorage.setItem('userEmail', email || '');
      localStorage.setItem('userName', fullName);

      alert('Profile Setup Complete!');
      router.push('/');

    } catch (error) {
      alert('Error saving profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans">
      
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Split Card */}
      <div className="relative z-10 w-full max-w-5xl h-[650px] flex rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 backdrop-blur-xl bg-white/30">
        
        {/* LEFT SIDE: Dark Gradient */}
        <div className="hidden md:flex w-1/3 bg-gradient-to-br from-[#4A1D46]/90 to-[#2E1029]/90 flex-col items-center justify-center p-10 text-center relative backdrop-blur-md">
            <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(216,131,183,0.3)] border border-white/20">
                 <Image src="/logo.jpeg" alt="Logo" width={120} height={120} className="object-cover opacity-90" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-white tracking-widest leading-snug uppercase">
              Almost<br />There
            </h2>
            <p className="text-[#D883B7] mt-3 text-xs tracking-wide font-light">
              We just need a few details to get you started.
            </p>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-2/3 bg-white/60 backdrop-blur-2xl flex flex-col justify-center p-12 relative overflow-y-auto">
            <h2 className="text-3xl font-serif font-bold text-[#4A1D46] mb-6 text-center">Complete Profile</h2>

            <div className="w-full flex flex-col gap-4">
              
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#7B2C62] ml-3 uppercase">Full Name</label>
                <input type="text" placeholder="e.g. Prabhani Maheeka" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full bg-white/50 text-[#2E1029] px-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm border border-white/50 transition-all"/>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#7B2C62] ml-3 uppercase">Address</label>
                <input type="text" placeholder="e.g. 123 Flower Road, Colombo" value={address} onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-white/50 text-[#2E1029] px-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm border border-white/50 transition-all"/>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#7B2C62] ml-3 uppercase">Phone</label>
                <input type="tel" placeholder="e.g. 077 123 4567" value={phone} onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-white/50 text-[#2E1029] px-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm border border-white/50 transition-all"/>
              </div>

              <div className="flex gap-4">
                <div className="w-2/3 flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#7B2C62] ml-3 uppercase">Date of Birth</label>
                    <input type="date" value={dob} onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] px-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm border border-white/50 transition-all"/>
                </div>
                <div className="w-1/3 flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#7B2C62] ml-3 uppercase">Gender</label>
                    <select value={gender} onChange={(e) => setGender(e.target.value)}
                      className="w-full bg-white/50 text-[#2E1029] px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm border border-white/50 transition-all cursor-pointer">
                      <option>Select</option><option>Female</option><option>Male</option><option>Other</option>
                    </select>
                </div>
              </div>

              <button onClick={handleSubmit} disabled={loading}
                className="w-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg transition-all mt-4 text-md tracking-wider border border-white/20">
                {loading ? 'Saving...' : 'Finish Setup'}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}