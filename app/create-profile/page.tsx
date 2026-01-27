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
  
  // State for the 9 digits entered by user
  const [phoneDigits, setPhoneDigits] = useState(''); 
  
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('Select');
  const [loading, setLoading] = useState(false);

  // --- CUSTOM ALERT STATE ---
  const [alertState, setAlertState] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'error', // 'success' or 'error'
    redirectPath: '' 
  });

  const closeAlert = () => {
    setAlertState({ ...alertState, show: false });
    if (alertState.redirectPath) {
      router.push(alertState.redirectPath);
    }
  };

  useEffect(() => {
    if (!email) {
      router.push('/login');
    }
  }, [email, router]);

  // Handle Phone Input (Allow only numbers, max 9)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers
    if (/^\d*$/.test(value)) {
        // Limit to 9 digits
        if (value.length <= 9) {
            setPhoneDigits(value);
        }
    }
  };

  const handleSubmit = async () => {
    // 1. Phone Number Validation
    if (phoneDigits.length !== 9) {
        setAlertState({
            show: true,
            title: 'Invalid Phone Number',
            message: 'Please enter a valid phone number (9 digits after +94).',
            type: 'error',
            redirectPath: ''
        });
        return;
    }

    // 2. Date Validation (No Future Dates)
    if (dob) {
        const selectedDate = new Date(dob);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time for accurate comparison

        if (selectedDate > today) {
            setAlertState({
                show: true,
                title: 'Invalid Date',
                message: 'Date of birth cannot be in the future.',
                type: 'error',
                redirectPath: ''
            });
            return;
        }
    }

    // 3. Combine Prefix + Digits
    const finalPhoneNumber = "+94" + phoneDigits;

    setLoading(true);
    try {
      const response = await fetch('/api/create-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            email, 
            fullName, 
            address, 
            phoneNumber: finalPhoneNumber, // Send the full +9477... format
            dob, 
            gender 
        }),
      });

      if (!response.ok) throw new Error('Failed to create profile');

      localStorage.setItem('userEmail', email || '');
      localStorage.setItem('userName', fullName);

      // Success Dialog -> Redirect to Shop
      setAlertState({
        show: true,
        title: 'Profile Setup Complete!',
        message: 'Your profile has been created successfully.',
        type: 'success',
        redirectPath: '/shop'
      });

    } catch (error) {
        setAlertState({
            show: true,
            title: 'Error',
            message: 'Error saving profile. Please try again.',
            type: 'error',
            redirectPath: ''
        });
    } finally {
      setLoading(false);
    }
  };

  // Get today's date for the max attribute
  const todayDate = new Date().toISOString().split("T")[0];

  return (
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Split Card (Glassmorphism) */}
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

              {/* PHONE INPUT SECTION */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-[#7B2C62] ml-3 uppercase">Phone Number</label>
                <div className="w-full bg-white/50 rounded-2xl flex items-center border border-white/50 overflow-hidden focus-within:ring-2 focus-within:ring-[#D883B7] transition-all">
                    {/* Fixed Prefix */}
                    <div className="bg-[#D883B7]/20 px-4 py-3 text-[#4A1D46] font-bold border-r border-white/30 select-none">
                        +94
                    </div>
                    {/* Input for remaining 9 digits */}
                    <input 
                      type="text" 
                      placeholder="77 123 4567" 
                      value={phoneDigits} 
                      onChange={handlePhoneChange}
                      className="flex-1 bg-transparent text-[#2E1029] px-4 py-3 outline-none text-sm placeholder-[#7B2C62]/50"
                    />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-2/3 flex flex-col gap-1">
                    <label className="text-xs font-bold text-[#7B2C62] ml-3 uppercase">Date of Birth</label>
                    <input 
                      type="date" 
                      value={dob} 
                      max={todayDate} // UI Validation: Prevents future dates
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full bg-white/50 text-[#2E1029] px-6 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm border border-white/50 transition-all"
                    />
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

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 animate-fade-in-up">
              
              <h3 className={`text-2xl font-serif font-bold mb-2 ${
                  alertState.type === 'error' ? 'text-[#880E4F]' : 'text-[#4A1D46]'
              }`}>
                {alertState.title}
              </h3>
              
              <p className="text-[#7B2C62] mb-8 font-medium">
                {alertState.message}
              </p>

              <button 
                onClick={closeAlert}
                className="px-10 py-3 bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] text-white rounded-full font-bold shadow-lg hover:opacity-90 hover:scale-105 transition-all w-full"
              >
                OK
              </button>
           </div>
        </div>
      )}

    </div>
  );
}