'use client'
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
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* --- BACK BUTTON --- */}
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-6 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-[#4A1D46] font-bold text-sm hover:bg-white/70 shadow-lg transition"
        >
          <span>←</span> Back
        </button>
      </div>

      {/* Main Split Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-4xl h-[500px] flex rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 backdrop-blur-xl bg-white/30">
        
        {/* LEFT SIDE: Dark Gradient */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#4A1D46]/90 to-[#2E1029]/90 flex-col items-center justify-center p-10 text-center relative backdrop-blur-md">
            
            {/* Icon Circle */}
            <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(216,131,183,0.3)] border border-white/20">
                 <span className="text-6xl">🔒</span>
            </div>
            
            <h2 className="text-2xl font-serif font-bold text-white tracking-widest leading-snug uppercase drop-shadow-md">
              Forgot<br />Password?
            </h2>
            <p className="text-[#D883B7] mt-3 text-xs tracking-wide font-medium italic">
              Don't worry, we'll help you reset it.
            </p>
        </div>

        {/* RIGHT SIDE: Light Glass Form */}
        <div className="w-full md:w-1/2 bg-white/60 backdrop-blur-2xl flex flex-col items-center justify-center p-12 relative">
            <h2 className="text-3xl font-serif font-bold text-[#4A1D46] mb-2 text-center">Reset Password</h2>
            <p className="text-xs text-[#7B2C62] mb-8 text-center px-4 opacity-80">
              Enter the email address associated with your account.
            </p>

            <div className="w-full flex flex-col gap-5">
              
              {/* Email Input */}
              <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>

              {/* Reset Button */}
              <button 
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg transition-all mt-2 text-md tracking-wider border border-white/20"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>

              <div className="text-center mt-4">
                  <Link href="/login" className="text-xs font-bold text-[#4A1D46] hover:text-[#9B5DE5] transition flex items-center justify-center gap-1">
                    <span>←</span> Back to Login
                  </Link>
              </div>
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