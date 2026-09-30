'use client';

import { useState } from 'react';
import { apiCall } from '@/lib/api';
import { Building2, UserPlus, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';

export default function CompanyRegisterPage() {
  const [step, setStep] = useState<'company' | 'users' | 'success'>('company');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Company Form State
  const [companyData, setCompanyData] = useState({
    name: '',
    short_code: '',
    email: '',
    industry: '',
  });

  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null);

  // User Form State
  const [userData, setUserData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    password: '',
    is_staff: false,
  });

  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  const handleRegisterCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Public registration request (requiresAuth: false)
      const response = await apiCall('/v1/tenants/tenants/', {
        requiresAuth: false,
        method: 'POST',
        body: JSON.stringify({
          ...companyData,
          is_active: true,
        }),
      });

      const tenantId = response?.id;
      if (!tenantId) {
        throw new Error('Company registration failed to return a valid tenant ID.');
      }

      setCreatedTenantId(tenantId);
      setStep('users');
    } catch (err: any) {
      console.error('Company registration error:', err);
      setError(err?.message || 'Failed to register the company. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Create user using UserViewSet endpoint, bound to the created tenant ID
      const response = await apiCall('/v1/accounts/users/', {
        requiresAuth: true,
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          tenant: createdTenantId,
          is_active: true,
        }),
      });

      setRegisteredUsers([...registeredUsers, response]);
      // Reset user form for adding another user
      setUserData({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        password: '',
        is_staff: false,
      });
    } catch (err: any) {
      console.error('User creation error:', err);
      setError(err?.message || 'Failed to create user. Ensure email/phone are unique.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-lg shadow-purple-200">
            {step === 'company' ? <Building2 size={24} /> : <UserPlus size={24} />}
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {step === 'company' && 'Register Company Account'}
          {step === 'users' && 'Add Users to Company'}
          {step === 'success' && 'Registration Complete'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {step === 'company' && 'Set up your organization workspace hierarchy.'}
          {step === 'users' && `Adding staff members for ${companyData.name}`}
          {step === 'success' && 'All company details and administrative users have been saved.'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-sm border border-gray-100 sm:rounded-2xl sm:px-10">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {error}
            </div>
          )}

          {/* STEP 1: COMPANY REGISTRATION FORM */}
          {step === 'company' && (
            <form onSubmit={handleRegisterCompany} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Company Name</label>
                <input
                  type="text"
                  required
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="e.g., Acme Holdings Ltd"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Short Code</label>
                  <input
                    type="text"
                    required
                    value={companyData.short_code}
                    onChange={(e) => setCompanyData({ ...companyData, short_code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., ACM"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Industry</label>
                  <input
                    type="text"
                    value={companyData.industry}
                    onChange={(e) => setCompanyData({ ...companyData, industry: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Technology"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Corporate Email</label>
                <input
                  type="email"
                  required
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="admin@company.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-purple-200 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue to Add Users <ArrowRight size={16} /></>}
              </button>
            </form>
          )}

          {/* STEP 2: USER CREATION FORM */}
          {step === 'users' && (
            <div className="space-y-6">
              {registeredUsers.length > 0 && (
                <div className="bg-gray-50 p-4 rounded-xl space-y-2 border border-gray-100">
                  <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">Registered Users ({registeredUsers.length})</p>
                  <ul className="space-y-1">
                    {registeredUsers.map((u, idx) => (
                      <li key={idx} className="text-xs text-gray-600 flex items-center justify-between">
                        <span>{u.first_name} {u.last_name} ({u.email})</span>
                        <CheckCircle2 size={14} className="text-emerald-600" />
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <form onSubmit={handleCreateUser} className="space-y-4 pt-2 border-t border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">Add User Profile</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">First Name</label>
                    <input
                      type="text"
                      required
                      value={userData.first_name}
                      onChange={(e) => setUserData({ ...userData, first_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Last Name</label>
                    <input
                      type="text"
                      required
                      value={userData.last_name}
                      onChange={(e) => setUserData({ ...userData, last_name: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={userData.email}
                    onChange={(e) => setUserData({ ...userData, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Phone Number</label>
                    <input
                      type="text"
                      required
                      value={userData.phone}
                      onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-600 mb-1">Initial Password</label>
                    <input
                      type="password"
                      required
                      value={userData.password}
                      onChange={(e) => setUserData({ ...userData, password: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="is_staff"
                    checked={userData.is_staff}
                    onChange={(e) => setUserData({ ...userData, is_staff: e.target.checked })}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500 w-4 h-4"
                  />
                  <label htmlFor="is_staff" className="text-xs font-medium text-gray-700">Grant Administrative Privileges (Staff Status)</label>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus size={14} /> Add Another User</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('success')}
                    className="flex-1 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-xl transition shadow-md shadow-purple-200 flex items-center justify-center gap-1.5"
                  >
                    Finish Setup <CheckCircle2 size={14} />
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* STEP 3: SUCCESS VIEW */}
          {step === 'success' && (
            <div className="text-center space-y-6 py-4">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-gray-900">Setup Successfully Completed!</h3>
                <p className="text-xs text-gray-500">
                  Company tenant registration and user assignments have been committed to the system.
                </p>
              </div>
              <a
                href="/company-home"
                className="w-full inline-flex items-center justify-center py-3 px-4 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-sm rounded-xl transition shadow-md shadow-purple-200"
              >
                Go to Company Dashboard
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}