// app/forgot-password/page.tsx
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setStatus('loading');

    try {
      await apiCall('/v1/accounts/auth/password-reset/', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setStatus('success');
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
      setStatus('idle');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        <div className="mb-6">
          <Link href="/login" className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#ef7632] transition mb-4">
            <ArrowLeft size={14} /> Back to Sign In
          </Link>
          <h1 className="text-2xl font-bold text-[#0d253c] tracking-tight">Forgot Password</h1>
          <p className="text-sm text-gray-500 mt-1">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {status === 'success' ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-[#0d253c]">Check your inbox</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">
              If an account exists for {email}, you will receive a password reset instructions email shortly.
            </p>
            <Link
              href="/login"
              style={{ backgroundColor: '#ef7632' }}
              className="w-full py-3 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition block text-center"
            >
              Return to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input 
                  type="email" 
                  required
                  placeholder="admin@lymton.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status === 'loading'}
              style={{ backgroundColor: '#ef7632' }}
              className="w-full py-3.5 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center"
            >
              {status === 'loading' ? 'Sending Reset Link...' : 'Send Reset Link'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}