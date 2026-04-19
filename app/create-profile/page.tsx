"use client";
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

function CreateProfileContent() {
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
    // MAIN BACKGROUND: Clean Corporate Slate
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 font-sans p-4">
      
      {/* Main Split Card */}
      <div className="relative z-10 w-full max-w-5xl h-auto md:h-[650px] flex flex-col md:flex-row rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 bg-white">
        
        {/* LEFT SIDE: Elegant Brand Display */}
        <div className="hidden md:flex w-1/3 bg-gradient-to-br from-[#fff5f4] to-white flex-col items-center justify-center p-10 text-center border-r border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#FFAFA8]/20 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm border border-slate-100 p-2 relative z-10">
                 <Image src="/logo.jpeg" alt="Logo" width={110} height={110} className="object-contain rounded-full" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-snug relative z-10">
              Almost<br />There
            </h2>
            <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed relative z-10 max-w-[200px]">
              We just need a few more details to set up your account.
            </p>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-2/3 bg-white flex flex-col justify-center p-8 md:p-12 relative overflow-y-auto custom-scrollbar">
            
            {/* Mobile Logo */}
            <div className="md:hidden flex justify-center mb-6">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-100 p-1">
                    <Image src="/logo.jpeg" alt="Logo" width={70} height={70} className="object-contain rounded-full" />
                </div>
            </div>

            <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center md:text-left tracking-tight">Complete Profile</h2>

            <div className="w-full flex flex-col gap-5">
              
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Full Name</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                    <input type="text" placeholder="e.g. Jane Doe" value={fullName} onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 pl-12 pr-6 py-3.5 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-sm border border-slate-200 transition-all shadow-sm placeholder-slate-400"/>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Address</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                    <input type="text" placeholder="e.g. 123 Main St, City" value={address} onChange={(e) => setAddress(e.target.value)}
                      className="w-full bg-slate-50 text-slate-800 pl-12 pr-6 py-3.5 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-sm border border-slate-200 transition-all shadow-sm placeholder-slate-400"/>
                </div>
              </div>

              {/* PHONE INPUT SECTION */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Phone Number</label>
                <div className="w-full bg-slate-50 rounded-full flex items-center border border-slate-200 overflow-hidden focus-within:bg-white focus-within:ring-2 focus-within:ring-[#FFAFA8] focus-within:border-[#FFAFA8] transition-all shadow-sm">
                    {/* Fixed Prefix */}
                    <div className="bg-slate-100 px-5 py-3.5 text-slate-500 font-bold border-r border-slate-200 select-none text-sm">
                        +94
                    </div>
                    {/* Input for remaining 9 digits */}
                    <input 
                      type="text" 
                      placeholder="77 123 4567" 
                      value={phoneDigits} 
                      onChange={handlePhoneChange}
                      className="flex-1 bg-transparent text-slate-800 px-4 py-3.5 outline-none text-sm placeholder-slate-400 font-medium"
                    />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="w-[60%] flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Date of Birth</label>
                    <div className="relative">
                        <svg className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <input 
                          type="date" 
                          value={dob} 
                          max={todayDate} // UI Validation: Prevents future dates
                          onChange={(e) => setDob(e.target.value)}
                          className="w-full bg-slate-50 text-slate-800 pl-11 pr-5 py-3.5 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-sm border border-slate-200 transition-all shadow-sm cursor-pointer"
                        />
                    </div>
                </div>
                <div className="w-[40%] flex flex-col gap-2">
                    <label className="text-[10px] font-bold text-slate-500 ml-1 uppercase tracking-widest">Gender</label>
                    <div className="relative">
                        <select value={gender} onChange={(e) => setGender(e.target.value)}
                          className="w-full bg-slate-50 text-slate-800 px-4 py-3.5 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-sm border border-slate-200 transition-all cursor-pointer shadow-sm appearance-none font-medium">
                          <option>Select</option><option>Female</option><option>Male</option><option>Other</option>
                        </select>
                        <svg className="w-4 h-4 text-slate-400 absolute right-4 top-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 mt-2">
                  <button onClick={handleSubmit} disabled={loading}
                    className={`w-full text-white font-bold py-4 rounded-full shadow-md tracking-wide transition-all text-sm
                        ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] hover:shadow-lg hover:scale-[1.02]'}`}>
                    {loading ? (
                       <span className="flex items-center justify-center gap-2">
                           <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Saving...
                       </span>
                    ) : 'Complete Profile'}
                  </button>
              </div>
            </div>
        </div>
      </div>

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl max-w-sm w-full text-center border border-slate-100 relative transform transition-all scale-100">
              
              <button onClick={closeAlert} className="absolute top-6 right-6 text-slate-400 hover:text-rose-500 bg-slate-50 w-8 h-8 rounded-full flex items-center justify-center transition-colors shadow-sm" aria-label="Close">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 
                  ${alertState.type === 'success' ? 'bg-emerald-50 border-white text-emerald-500 shadow-emerald-200' : 'bg-rose-50 border-white text-rose-500 shadow-rose-200'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">{alertState.title}</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed">{alertState.message}</p>
              
              <button onClick={closeAlert} className="px-10 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all w-full tracking-wide">
                OK
              </button>
           </div>
        </div>
      )}
    </div>
  );
}

export default function CreateProfile() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
        </div>
    }>
      <CreateProfileContent />
    </Suspense>
  );
}