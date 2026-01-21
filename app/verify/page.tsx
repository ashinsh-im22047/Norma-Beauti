'use client'
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';

function VerifyContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const router = useRouter();
  const [status, setStatus] = useState('Verifying your email...');

  useEffect(() => {
    if (!token) {
      setStatus('Invalid Link');
      return;
    }

    // Call the API to verify the token in the database
    const verifyUser = async () => {
      try {
        const res = await fetch('/api/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token }),
        });

       if (res.ok) {
          // 1. Get the data (which now includes the email)
          const data = await res.json(); 
          
          setStatus('✅ Verified! Redirecting to setup profile...');
          
          // 2. Pass that email to the URL
          setTimeout(() => router.push(`/create-profile?email=${data.email}`), 2000);
          
        } else {
          setStatus('❌ Verification failed.');
        }
      } catch (error) {
        setStatus('Something went wrong.');
      }
    };

    verifyUser();
  }, [token, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-10 rounded-xl shadow-2xl text-center">
        <h1 className="text-3xl font-bold mb-4 text-[#1a4a5a]">Email Verification</h1>
        <p className="text-xl font-medium text-gray-700">{status}</p>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyContent />
    </Suspense>
  );
}