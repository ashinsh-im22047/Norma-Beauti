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
      // We do NOT log them in. We do NOT send them to profile.
      // We send them back to LOGIN with a message to check email.
      setAlertState({
        show: true,
        title: 'Verification Required',
        message: `Registration successful!\n\nA verification email has been sent to ${email}.\n\nPlease check your inbox and click the link to verify your account. You cannot log in until verified.`,
        type: 'success',
        redirectPath: '/login' // Send back to login, DO NOT allow access.
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
    // MAIN BACKGROUND: Elegant Pink-Purple Gradient
    <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[#FFF0F5] via-[#F3E5F5] to-[#E6E6FA] font-sans">
      
      {/* Decorative Background Glows */}
      <div className="absolute top-20 left-0 w-96 h-96 bg-[#D883B7]/20 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#9B5DE5]/20 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Back Button */}
      <div className="absolute top-6 left-6 z-50">
        <button 
          onClick={() => router.back()} 
          className="flex items-center gap-2 px-6 py-2 bg-white/40 backdrop-blur-md border border-white/60 rounded-full text-[#4A1D46] font-bold text-sm hover:bg-white/70 shadow-lg transition"
        >
          <span>←</span> Back
        </button>
      </div>

      {/* Main Split Card (Glassmorphism) */}
      <div className="relative z-10 w-full max-w-4xl h-[600px] flex rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/40 backdrop-blur-xl bg-white/30">
        
        {/* LEFT SIDE: Dark Gradient */}
        <div className="hidden md:flex w-1/2 bg-gradient-to-br from-[#4A1D46]/90 to-[#2E1029]/90 flex-col items-center justify-center p-10 text-center relative backdrop-blur-md">
            <div className="w-36 h-36 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(216,131,183,0.3)] border border-white/20 relative z-20 overflow-hidden">
                 <Image src="/logo.jpeg" alt="Logo" width={140} height={140} className="object-cover opacity-90" />
            </div>
            <h2 className="text-3xl font-serif font-bold text-white tracking-widest leading-snug uppercase drop-shadow-md">
              Join<br />Norma Beauti
            </h2>
            <p className="text-[#D883B7] mt-3 text-sm tracking-wide font-medium italic">
              Begin your journey to elegance.
            </p>
        </div>

        {/* RIGHT SIDE: Light Glass Form */}
        <div className="w-full md:w-1/2 bg-white/60 backdrop-blur-2xl flex flex-col items-center justify-center p-12 relative">
            <h2 className="text-3xl font-serif font-bold text-[#4A1D46] mb-6 text-center">Create Account</h2>

            <div className="w-full flex flex-col gap-4">
              <div className="relative">
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>
              <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Password (min 6 chars)" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>
              <div className="relative">
                  <input 
                    type="password" 
                    placeholder="Confirm Password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-white/50 text-[#2E1029] placeholder-[#7B2C62]/50 px-6 py-4 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D883B7] text-sm shadow-inner border border-white/50 transition-all"
                  />
              </div>

              <button 
                onClick={handleRegister}
                disabled={loading}
                className="w-full bg-gradient-to-r from-[#D883B7] to-[#9B5DE5] hover:opacity-90 text-white font-bold py-4 rounded-2xl shadow-lg transition-all mt-4 text-md tracking-wider border border-white/20"
              >
                {loading ? 'Creating...' : 'Sign Up'}
              </button>

              <div className="text-center mt-4">
                 <p className="text-[#4A1D46] text-xs">
                   Already have an account? <Link href="/login" className="font-bold text-[#D883B7] hover:underline hover:text-[#9B5DE5] transition">Log in</Link>
                 </p>
              </div>
            </div>
        </div>
      </div>

      {/* --- CUSTOM ELEGANT DIALOG BOX --- */}
      {alertState.show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
           <div className="bg-white/90 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl max-w-sm w-full text-center border border-white/60 animate-fade-in-up">
              
              <div className="w-16 h-16 bg-[#FCE4EC] rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner border border-[#F8BBD0]">
                {alertState.type === 'success' ? '✉️' : '⚠️'}
              </div>

              <h3 className={`text-2xl font-serif font-bold mb-2 ${
                  alertState.type === 'error' ? 'text-[#880E4F]' : 'text-[#4A1D46]'
              }`}>
                {alertState.title}
              </h3>
              
              <p className="text-[#7B2C62] mb-8 font-medium whitespace-pre-line text-sm leading-relaxed">
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