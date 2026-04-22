// ==========================================
// File: page.tsx
// Description: This file contains core code for the NornaBeauti application.
// It handles specific UI components, API routes, or utility functions.
// ==========================================

'use client'
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    // Only redirect if it was a success alert
    if (alertState.type === 'success' && alertState.redirectPath) {
      router.push(alertState.redirectPath);
    }
  };

  // --- LOGIN HANDLER WITH EMAIL VERIFICATION CHECK ---
  const handleLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // --- CRITICAL CHECK: EMAIL VERIFICATION ---
      if (data.user && !data.user.isVerified) { 
          setAlertState({
            show: true,
            title: 'Verification Required',
            message: 'Your email address is not verified yet.\n\nPlease check your inbox for the verification link before logging in.',
            type: 'error',
            redirectPath: '' // Stay on login page
          });
          setLoading(false);
          return; // STOP LOGIN PROCESS HERE
      }

      // --- PROCEED ONLY IF VERIFIED ---
      if (data.user) {
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userEmail', data.user.email);
        if (data.user.role) localStorage.setItem('userRole', data.user.role);
      }

      document.cookie = "user_session=true; path=/; max-age=86400"; 

      // --- DETERMINE REDIRECT PATH ---
      const targetPath = data.user.role === 'ADMIN' ? '/admin/dashboard' : '/shop';

      // --- SHOW SUCCESS DIALOG ---
      setAlertState({
        show: true,
        title: 'Welcome Back',
        message: 'Login Successful',
        type: 'success',
        redirectPath: targetPath
      });

    } catch (error: any) {
      // --- SHOW ERROR DIALOG ---
      setAlertState({
        show: true,
        title: 'Login Failed',
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
      
      {/* Subtle Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#FFAFA8]/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#ff8a80]/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- BACK BUTTON --- */}
      <Link href="/" className="absolute top-6 left-6 z-50">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-white border border-slate-200 rounded-full text-slate-600 font-bold text-sm hover:bg-slate-50 shadow-sm transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          Back
        </button>
      </Link>

      {/* Main Card Container */}
      <div className="relative z-10 w-full max-w-4xl h-auto md:h-[600px] flex flex-col md:flex-row rounded-[2.5rem] shadow-xl overflow-hidden border border-slate-200 bg-white">
        
        {/* LEFT SIDE: Brand Visual Section */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#fff5f4] to-white flex-col items-center justify-center p-12 text-center border-r border-slate-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-[#FFAFA8]/20 to-transparent rounded-bl-full pointer-events-none"></div>
            
            {/* Logo Circle */}
            <div className="w-36 h-36 bg-white rounded-full flex items-center justify-center mb-8 shadow-sm border border-slate-100 p-2 relative z-10">
                 <Image src="/logo.jpeg" alt="Logo" width={130} height={130} className="object-contain rounded-full" />
            </div>
            
            <h2 className="text-3xl font-bold text-slate-800 tracking-tight leading-tight uppercase relative z-10">
              Welcome To<br />Norma Beauti
            </h2>
            <p className="text-slate-500 mt-4 text-sm font-medium leading-relaxed relative z-10 max-w-[240px]">
              Discover premium beauty care tailored for your unique style.
            </p>
        </div>

        {/* RIGHT SIDE: Login Form */}
        <div className="w-full md:w-1/2 bg-white flex flex-col items-center justify-center p-8 md:p-12 relative overflow-y-auto custom-scrollbar">
            
            <h2 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Login</h2>
            <p className="text-sm text-slate-500 mb-10 font-medium tracking-wide">Enter your credentials to continue</p>

            <div className="w-full flex flex-col gap-6">
              
              {/* Email Input */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest">Email Address</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
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
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-slate-500 ml-4 uppercase tracking-widest">Password</label>
                <div className="relative">
                    <svg className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-full pl-12 pr-6 py-3.5 text-slate-800 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FFAFA8] focus:border-[#FFAFA8] transition-all shadow-sm placeholder-slate-400 text-sm"
                    />
                </div>
              </div>

              {/* Login Button */}
              <button 
                onClick={handleLogin}
                disabled={loading}
                className={`w-full text-white font-bold py-4 rounded-full shadow-md tracking-wide transition-all text-sm mt-4
                    ${loading ? 'bg-slate-300 cursor-not-allowed' : 'bg-gradient-to-r from-[#FFAFA8] to-[#ff8a80] hover:shadow-lg hover:scale-[1.02]'}`}
              >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Checking...
                    </span>
                ) : 'Login Account'}
              </button>

              <div className="text-center flex flex-col gap-3 mt-6">
                  <Link href="/forgot-password" title="Recover account password" 
                    className="text-slate-500 text-xs font-bold hover:text-[#ff8a80] transition-colors">
                    Forgot your password?
                  </Link>
                  <p className="text-slate-400 text-xs font-medium">
                    Don't have an account? <Link href="/register" className="font-bold text-[#ff8a80] hover:underline transition-all ml-1">Sign up free</Link>
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
              
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border-4 
                  ${alertState.type === 'success' ? 'bg-emerald-50 border-white text-emerald-500 shadow-emerald-200' : 'bg-rose-50 border-white text-rose-500 shadow-rose-200'}`}>
                {alertState.type === 'success' ? (
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
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