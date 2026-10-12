'use client';

import { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !password) return;

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await apiCall('/v1/accounts/auth/accept-invitation/', {
        method: 'POST',
        body: JSON.stringify({
          token,
          password,
          first_name: firstName,
          last_name: lastName,
        }),
      });

      setSuccessMessage('Account set up successfully! Redirecting to login...');
      setTimeout(() => router.push('/login'), 2000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to accept invitation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-black text-black">Set Up Your Account</h1>
          <p className="text-xs text-black font-medium mt-1">Please enter your details and choose a secure password to join the team.</p>
        </div>

        {successMessage && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold rounded-xl">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold rounded-xl">
            <AlertCircle size={16} className="shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-black mb-1">First Name</label>
              <input 
                type="text" 
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black font-medium bg-white focus:ring-2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-black mb-1">Last Name</label>
              <input 
                type="text" 
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black font-medium bg-white focus:ring-2"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-black mb-1">New Password</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-xl text-xs text-black font-medium bg-white focus:ring-2"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Complete Account Setup'}
          </button>
        </form>
      </div>
    </div>
  );
}