// app/reset-password/page.tsx
'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { Lock, CheckCircle2, ArrowRight } from 'lucide-react';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const uid = searchParams.get('uid');
  const token = searchParams.get('token');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!uid || !token) {
      setError('Invalid or missing password reset credentials.');
      return;
    }

    setLoading(true);

    try {
      await apiCall('/v1/accounts/auth/password-reset-confirm/', {
        method: 'POST',
        body: JSON.stringify({ uid, token, new_password: newPassword }),
      });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
        
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0d253c] tracking-tight">Set New Password</h1>
          <p className="text-sm text-gray-500 mt-1">Please enter your secure new password below.</p>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <div className="py-6 text-center">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-bold text-[#0d253c]">Password Reset Complete!</h3>
            <p className="text-sm text-gray-500 mt-2 mb-6">Your password has been successfully updated.</p>
            <Link
              href="/login?reset=true"
              style={{ backgroundColor: '#ef7632' }}
              className="w-full py-3 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition flex items-center justify-center gap-2"
            >
              Sign In Now <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">New Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 text-gray-400" size={16} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ backgroundColor: '#ef7632' }}
              className="w-full py-3.5 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? 'Updating Password...' : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}