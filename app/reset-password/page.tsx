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
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#FFF0F5] to-[#E6E6FA] text-[#4A1D46] font-bold">
            <div className="bg-white/40 p-10 rounded-3xl backdrop-blur-md shadow-xl border border-white/50 text-center">
                <p className="mb-4">Invalid or expired reset link.</p>
                <Link href="/login" className="px-6 py-2 bg-[#4A1D46] text-white rounded-full text-sm">Return to Login</Link>
            </div>
        </div>
    );
  }

  return (
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Main Split Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-4xl h-[500px] flex rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 backdrop-blur-xl bg-white/30">
        
        {/* LEFT SIDE: Dark Gradient */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#4A1D46]/90 to-[#2E1029]/90 flex-col items-center justify-center p-10 text-center relative backdrop-blur-md">
            
            {/* Icon Circle */}
            <div className="w-32 h-32 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(216,131,183,0.3)] border border-white/20">
                 <span className="text-6xl">🔑</span>
            </div>
            
            <h2 className="text-2xl font-serif font-bold text-white tracking-widest leading-snug uppercase drop-shadow-md">
              Secure<br />Account
            </h2>
            <p className="text-[#D883B7] mt-3 text-xs tracking-wide font-medium italic">
              Use a mix of letters and numbers for safety.
            </p>
        </div>

        {/* RIGHT SIDE: Light Glass Form */}
        <div className="w-full md:w-1/2 bg-white/60 backdrop-blur-2xl flex flex-col items-center justify-center p-12 relative">
            <h2 className="text-3xl font-serif font-bold text-[#4A1D46] mb-8 text-center">Reset Password</h2>

            <div className="w-full flex flex-col gap-5">
              
              {/* New Password Input */}
              <div className="relative">
                  <input 
                    type="password" 
                    placeholder="New Password (min 6 chars)" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>

              {/* Confirm Password Input */}
              <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Confirm New Password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>

              {/* Submit Button */}
              <button 
                onClick={handleReset}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg transition-all mt-2 text-md tracking-wider border border-white/20"
              >
                {loading ? 'Updating...' : 'Set New Password'}
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
              
              <p className="text-[#7B2C62] mb-8 font-medium whitespace-pre-line">
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

// Wrap in Suspense to prevent build errors with useSearchParams
export default function ResetPassword() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}