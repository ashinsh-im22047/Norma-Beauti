// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

'use client'
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

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
    // 1. Check Matching
    if (password !== confirmPassword) {
        setAlertState({
            show: true,
            title: 'Mismatch',
            message: 'Passwords do not match.',
            type: 'error',
            redirectPath: ''
        });
        return;
    }
    
    // 2. Validate Password Length (At least 6 chars)
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

    // 3. Validate Password Complexity (At least 2 types: Upper, Lower, Number)
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

    // 4. Check Token
    if (!token) {
        setAlertState({
            show: true,
            title: 'Invalid Link',
            message: 'Invalid or missing reset token.',
            type: 'error',
            redirectPath: ''
        });
        return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });

      const data = await res.json();
      
      if (res.ok) {
        // Success Dialog -> Redirect to Login
        setAlertState({
            show: true,
            title: 'Password Reset!',
            message: 'Your password has been updated successfully. Please log in.',
            type: 'success',
            redirectPath: '/login'
        });
      } else {
        throw new Error(data.error || "Failed to reset password");
      }
    } catch (error: any) {
        setAlertState({
            show: true,
            title: 'Error',
            message: error.message || "Something went wrong",
            type: 'error',
            redirectPath: ''
        });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-800 font-sans p-4">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-xl border border-slate-200 text-center max-w-sm w-full">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 text-rose-500">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <h2 className="text-2xl font-bold tracking-tight mb-2">Invalid Link</h2>
                <p className="text-slate-500 text-sm mb-8 font-medium leading-relaxed">The password reset link is invalid or has expired.</p>
                <Link href="/login" className="block w-full py-3.5 bg-slate-800 text-white rounded-full font-bold shadow-md hover:bg-slate-900 transition-all text-sm tracking-wide">Return to Login</Link>
            </div>
        </div>
    );
  }

  return (
    // MAIN BACKGROUND: Clean Corporate Slate
    <div className="min-h-screen relative flex items-center justify-center bg-slate-50 font-sans p-4 overflow-hidden">
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-[#FFAFA8]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#ff8a80]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Split Card */}
      <div className="relative z-10 w-full max-w-4xl h-auto md:h-[520px] flex flex-col md:flex-row rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 bg-white">
        
        {/* LEFT SIDE: Brand Visual */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#fff5f4] to-white flex-col items-center justify-center p-12 text-center border-r border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#FFAFA8]/20 to-transparent rounded-bl-full pointer-events-none"></div>
            
            {/* Icon Circle */}
            <div className="w-28 h-28 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm border border-slate-100 relative z-10">
                <svg className="w-12 h-12 text-[#ff8a80]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight uppercase relative z-10">
              Secure<br />Account
            </h2>
            <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed relative z-10 max-w-[220px]">
              Use a mix of letters and numbers to ensure your new password is safe.
            </p>
        </div>

        {/* RIGHT SIDE: Form */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-12 relative overflow-y-auto custom-scrollbar">
            <h2 className="text-3xl font-bold text-slate-900 mb-2 text-center tracking-tight">Reset Password</h2>
            <p className="text-sm text-slate-500 mb-10 text-center px-4 font-medium tracking-wide leading-relaxed">Enter your new credentials below</p>

            <div className="w-full flex flex-col gap-6">
              
              {/* New Password Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest">New Password</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <input 
                        type="password" 
                        placeholder="Min 6 characters" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                    />
                </div>
              </div>

              {/* Confirm Password Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest">Confirm Password</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                    <input 
                        type="password" 
                        placeholder="Repeat new password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                    />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                onClick={handleReset}
                disabled={loading}
                className={`w-full text-white font-bold py-4 rounded-full shadow-md tracking-wide transition-all text-sm mt-2
                    ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] hover:shadow-lg hover:scale-[1.02]'}`}
              >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Updating...
                    </span>
                ) : 'Set New Password'}
              </button>
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

// Wrap in Suspense to prevent build errors with useSearchParams
export default function ResetPassword() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
        </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}