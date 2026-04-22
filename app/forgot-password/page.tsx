// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
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
    // Only redirect if a path is set (for success cases)
    if (alertState.redirectPath) {
      router.push(alertState.redirectPath);
    }
  };

  const handleReset = async () => {
    // 1. Check if email is empty
    if (!email) {
      setAlertState({
        show: true,
        title: 'Input Required',
        message: 'Please enter your email address.',
        type: 'error',
        redirectPath: ''
      });
      return;
    }

    // 2. Validate Email Format (NEW)
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

    setLoading(true);
    try {
      // 3. REAL API CALL
      const response = await fetch('/api/forgot-password', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }
      
      // 4. Success Feedback (Triggers Redirect on Close)
      setAlertState({
        show: true,
        title: 'Email Sent',
        message: 'Password reset link has been sent to your email.',
        type: 'success',
        redirectPath: '/login'
      });

    } catch (error: any) {
      setAlertState({
        show: true,
        title: 'Error',
        message: error.message || "Something went wrong. Please try again.",
        type: 'error',
        redirectPath: ''
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    // MAIN BACKGROUND: Clean Corporate Slate
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 font-sans p-4">
      
      {/* --- BACK BUTTON --- */}
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-xs hover:bg-slate-50 hover:text-[#ff8a80] hover:border-[#FFAFA8] shadow-sm transition-all"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </div>

      {/* Main Split Card */}
      <div className="relative z-10 w-full max-w-4xl h-auto md:h-[550px] flex flex-col md:flex-row rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 bg-white">
        
        {/* LEFT SIDE: Elegant Brand Display */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#fff5f4] to-white flex-col items-center justify-center p-10 text-center border-r border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-[#FFAFA8]/20 to-transparent rounded-bl-full pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-[#FFAFA8]/20 to-transparent rounded-tr-full pointer-events-none"></div>
            
            {/* Icon Circle */}
            <div className="w-32 h-32 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm border border-slate-100 relative z-10">
                <svg className="w-14 h-14 text-[#FFAFA8]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7a4 4 0 00-8 0v4h8z" /></svg>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-snug relative z-10">
              Forgot<br />Password?
            </h2>
            <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed relative z-10 max-w-[220px]">
              Don't worry, it happens to the best of us. We'll help you reset it securely.
            </p>
        </div>

        {/* RIGHT SIDE: Light Form */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-14 relative overflow-y-auto">
            <h2 className="text-3xl font-bold text-slate-900 mb-3 text-center tracking-tight">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-10 text-center font-medium">
              Enter the email address associated with your account.
            </p>

            <div className="w-full flex flex-col gap-6">
              
              {/* Email Input */}
              <div className="relative">
                  <svg className="w-5 h-5 text-slate-400 absolute left-4 top-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                  <input 
                    type="email" 
                    placeholder="name@example.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-slate-50 text-slate-800 placeholder-slate-400 pl-12 pr-6 py-4 rounded-full focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] text-sm shadow-sm border border-slate-200 transition-all font-medium"
                  />
              </div>

              {/* Reset Button */}
              <button 
                onClick={handleReset}
                disabled={loading}
                className={`w-full text-white font-bold py-4 rounded-full shadow-md tracking-wide transition-all mt-2 flex items-center justify-center gap-2
                  ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] hover:shadow-lg hover:scale-[1.02]'}`}
              >
                {loading ? (
                    <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Sending...</>
                ) : (
                    <><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> Send Reset Link</>
                )}
              </button>

              <div className="text-center mt-6">
                  <Link href="/login" className="text-xs font-bold text-slate-500 hover:text-[#ff8a80] transition-colors inline-flex items-center justify-center gap-1.5 p-2">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    Back to Login
                  </Link>
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