'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); 
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // --- CUSTOM ALERT STATE ---
  const [alertState, setAlertState] = useState({ 
    show: false, 
    title: '', 
    message: '', 
    type: 'error', // 'success' or 'error'
    redirectPath: '' 
  });

  // --- CLOSE ALERT HANDLER ---
  const closeAlert = () => {
    setAlertState({ ...alertState, show: false });
    // Only redirect if a path is strictly defined
    if (alertState.redirectPath) {
      router.push(alertState.redirectPath);
    }
  };

  const handleRegister = async () => {
    // 1. Strict Email Format Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        setAlertState({
            show: true,
            title: 'Invalid Email',
            message: 'Please enter a valid email address (e.g., name@example.com).',
            type: 'error',
            redirectPath: ''
        });
        return;
    }

    // 2. Validation: Check if passwords match
    if (password !== confirmPassword) {
      setAlertState({
        show: true,
        title: 'Validation Error',
        message: 'Passwords do not match!',
        type: 'error',
        redirectPath: ''
      });
      return;
    }

    // 3. Validate Password Length
    if (password.length < 6) {
        setAlertState({
            show: true,
            title: 'Weak Password',
            message: 'Password must be at least 6 characters long.',
            type: 'error',
            redirectPath: ''
        });
        return;
    }

    // 4. Validate Password Complexity
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    const complexityCount = (hasUpper ? 1 : 0) + (hasLower ? 1 : 0) + (hasNumber ? 1 : 0);

    if (complexityCount < 2) {
        setAlertState({
            show: true,
            title: 'Weak Password',
            message: 'Password must contain at least 2 of the following:\n- Uppercase Letter\n- Lowercase Letter\n- Number',
            type: 'error',
            redirectPath: ''
        });
        return;
    }

    setLoading(true);
    try {
      // 5. Send to backend
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle "Email already exists"
        if (data.error && data.error.toLowerCase().includes('exist')) {
            throw new Error('This email is already registered. Please log in instead.');
        }
        throw new Error(data.error || 'Registration failed');
      }

      // --- SUCCESS: BLOCK ACCESS & FORCE VERIFICATION ---
      setAlertState({
        show: true,
        title: 'Verification Required',
        message: `Registration successful!\n\nA verification email has been sent to ${email}.\n\nPlease check your inbox and click the link to verify your account. You cannot log in until verified.`,
        type: 'success',
        redirectPath: '/login' 
      });

    } catch (error: any) {
      setAlertState({
        show: true,
        title: 'Registration Failed',
        message: error.message,
        type: 'error',
        redirectPath: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN BACKGROUND: Clean Corporate Slate
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 font-sans p-4 overflow-hidden">
      
      {/* Subtle Background Decoration */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFAFA8]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ff8a80]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- BACK BUTTON --- */}
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-sm hover:bg-slate-50 shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </div>

      {/* Main Split Card */}
      <div className="relative z-10 w-full max-w-4xl h-auto md:h-[650px] flex flex-col md:flex-row rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 bg-white">
        
        {/* LEFT SIDE: Brand Visual */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#fff5f4] to-white flex-col items-center justify-center p-12 text-center border-r border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#FFAFA8]/20 to-transparent rounded-bl-full pointer-events-none"></div>
            
            <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm border border-slate-100 p-2 relative z-10">
                 <Image src="/logo.jpeg" alt="Logo" width={130} height={130} className="object-contain rounded-full" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight uppercase relative z-10">
              Join<br />Norma Beauti
            </h2>
            <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed relative z-10 max-w-[240px]">
              Begin your journey to elegance and discover premium skincare tailored for you.
            </p>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-12 relative overflow-y-auto custom-scrollbar">
            <h2 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Create Account</h2>
            <p className="text-sm text-slate-500 mb-10 font-medium tracking-wide">Sign up to explore our collection</p>

            <div className="w-full flex flex-col gap-5">
              
              {/* Email Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                    <input 
                        type="email" 
                        placeholder="e.g. name@example.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                    />
                </div>
              </div>

              {/* Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest">Create Password</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <input 
                        type="password" 
                        placeholder="Minimum 6 characters" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                    />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest">Confirm Password</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <input 
                        type="password" 
                        placeholder="Repeat password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                    />
                </div>
              </div>

              {/* Sign Up Button */}
              <button 
                onClick={handleRegister}
                disabled={loading}
                className={`w-full text-white font-bold py-4 rounded-full shadow-md tracking-wide transition-all text-sm mt-4
                    ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] hover:shadow-lg hover:scale-[1.02]'}`}
              >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Creating...
                    </span>
                ) : 'Sign Up Account'}
              </button>

              <div className="text-center mt-6">
                 <p className="text-slate-400 text-xs font-medium">
                   Already have an account? <Link href="/login" className="font-bold text-[#ff8a80] hover:underline transition-all ml-1">Log in here</Link>
                 </p>
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
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 border-white
                  ${alertState.type === 'success' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                ) : (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                )}
              </div>
              
              <h3 className="text-2xl font-bold mb-3 text-slate-900 tracking-tight">{alertState.title}</h3>
              <p className="text-slate-500 mb-8 font-medium text-sm leading-relaxed whitespace-pre-line">{alertState.message}</p>
              
              <button onClick={closeAlert} className="px-10 py-3.5 bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] text-white rounded-full font-bold shadow-md hover:shadow-lg hover:scale-105 transition-all w-full tracking-wide uppercase text-xs">
                OK
              </button>
           </div>
        </div>
      )}

    </div>
  );
}