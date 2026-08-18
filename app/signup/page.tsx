'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [tenant, setTenant] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await apiCall('/accounts/users/', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          tenant,
          is_active: true,
          is_staff: false,
          mfa_enabled: false,
        }),
      });

      router.push('/login');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-8">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Create Account</h2>
        {error && <p className="mb-4 text-xs text-red-600 bg-red-50 p-2 rounded">{error}</p>}
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">First Name</label>
              <input 
                type="text" 
                required
                value={firstName} 
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-600" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Last Name</label>
              <input 
                type="text" 
                required
                value={lastName} 
                onChange={(e) => setLastName(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-600" 
              />
            </div>
          </div>
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
            <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
            <input 
              type="text" 
              required
              value={phone} 
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-600" 
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Tenant UUID</label>
            <input 
              type="text" 
              required
              placeholder="3fa85f64-5717-4562-b3fc-2c963f66afa6"
              value={tenant} 
              onChange={(e) => setTenant(e.target.value)}
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
            Sign Up
          </button>
        </form>
        <p className="mt-4 text-xs text-center text-gray-500">
          Already have an account? <Link href="/login" className="text-purple-600 font-semibold hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}