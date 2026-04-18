'use client'
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  
  // Status states: 'loading' | 'success' | 'error'
  const [verifyStatus, setVerifyStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    if (!token) {
      setVerifyStatus('error');
      setMessage('The verification link is invalid or missing.');
      return;
    }

    const verifyUser = async () => {
      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

        if (res.ok) {
          const data = await res.json(); 
          setVerifyStatus('success');
          setMessage('Email verified successfully! Redirecting you to complete your profile...');
          
          // Smooth transition to profile setup
          setTimeout(() => router.push(`/create-profile?email=${data.email}`), 2500);
        } else {
          setVerifyStatus('error');
          setMessage('Verification failed. The link may have expired.');
        }
      } catch (error) {
        setVerifyStatus('error');
        setMessage('A system error occurred. Please try again later.');
      }
    };

    verifyUser();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 font-sans p-4">
      <div className="bg-white p-10 md:p-12 rounded-[2.5rem] shadow-xl border border-slate-100 text-center max-w-md w-full animate-fade-in">
        
        {/* ICON LOGIC */}
        <div className="mb-8 flex justify-center">
            {verifyStatus === 'loading' && (
                <div className="w-20 h-20 rounded-full border-4 border-slate-100 border-t-[#FFAFA8] animate-spin"></div>
            )}
            
            {verifyStatus === 'success' && (
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center border-4 border-white shadow-md text-emerald-500">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            )}

            {verifyStatus === 'error' && (
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center border-4 border-white shadow-md text-rose-500">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
            )}
        </div>

        <h1 className="text-3xl font-bold mb-3 text-slate-900 tracking-tight">
            Email Verification
        </h1>
        
        <p className={`text-sm font-medium leading-relaxed px-2 ${
            verifyStatus === 'error' ? 'text-rose-500' : 'text-slate-500'
        }`}>
            {message}
        </p>

        {verifyStatus === 'error' && (
            <button 
                onClick={() => router.push('/login')}
                className="mt-8 w-full py-3.5 bg-slate-800 text-white rounded-full font-bold shadow-md hover:bg-slate-900 transition-all text-sm tracking-wide"
            >
                Back to Login
            </button>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFAFA8]"></div>
        </div>
    }>
      <VerifyContent />
    </Suspense>
  );
}