'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      // 1. Authenticate and obtain tokens
      const data = await apiCall('/token/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);

      // 2. Extract or fetch user profile metadata for the Header display
      // If your /token/ endpoint directly returns user/tenant info, use it:
      if (data.user) {
        localStorage.setItem('user_full_name', data.user.full_name || data.user.email || email);
        localStorage.setItem('tenant_name', data.user.tenant_name || 'My Organization');
      } else {
        // Fallback: If tokens are returned alone, save basic info derived from email/input
        localStorage.setItem('user_full_name', email);
        localStorage.setItem('tenant_name', 'CDL Holding Group Limited');
      }

      router.push('/documents');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Log in to Revver</h2>
        {error && <p className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
            <input 
              type="email" 
              required
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-600" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Password</label>
            <input 
              type="password" 
              required
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-600" 
            />
          </div>
          <button type="submit" className="w-full py-2.5 bg-[#7C3AED] text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition">
            Log In
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-gray-500">
          Don&apos;t have an account? <Link href="/signup" className="text-purple-600 font-semibold hover:underline">Sign up</Link>
        </p>
      </div>
    </div>
  );
}