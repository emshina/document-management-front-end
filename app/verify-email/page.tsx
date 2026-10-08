// app/verify-email/page.tsx
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email address...');

  useEffect(() => {
    async function verifyAccount() {
      if (!uid || !token) {
        setStatus('error');
        setMessage('Missing verification parameters (uid or token).');
        return;
      }

      try {
        // Call your Django backend verify-email endpoint
        const res = await apiCall('/v1/accounts/auth/verify-email/', {
          method: 'POST',
          body: JSON.stringify({ uid, token }),
        });

        setStatus('success');
        setMessage(res.message || 'Email verified successfully!');
      } catch (err: any) {
        setStatus('error');
        setMessage(err.message || 'Invalid or expired verification link.');
      }
    }

    verifyAccount();
  }, [uid, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center">
        
        {status === 'loading' && (
          <div className="py-8 flex flex-col items-center">
            <Loader2 className="animate-spin text-[#ef7632] mb-4" size={48} />
            <h2 className="text-xl font-bold text-[#0d253c]">Verifying Account</h2>
            <p className="text-sm text-gray-500 mt-2">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-2xl font-bold text-[#0d253c]">Email Verified!</h2>
            <p className="text-sm text-gray-500 mt-2 mb-6">{message}</p>
            <Link
              href="/login?verified=true"
              style={{ backgroundColor: '#ef7632' }}
              className="w-full py-3 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              Proceed to Sign In <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="py-6 flex flex-col items-center">
            <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mb-4">
              <XCircle size={36} />
            </div>
            <h2 className="text-2xl font-bold text-[#0d253c]">Verification Failed</h2>
            <p className="text-sm text-red-600 mt-2 mb-6">{message}</p>
            <Link
              href="/login"
              className="w-full py-3 bg-gray-100 text-gray-700 text-sm font-bold tracking-wide rounded-xl hover:bg-gray-200 transition"
            >
              Back to Sign In
            </Link>
          </div>
        )}

      </div>
    </div>
  );
}

// Wrapped in Suspense because of useSearchParams hook in Next.js
export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}