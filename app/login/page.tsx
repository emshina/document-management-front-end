// app/login/page.tsx

'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const data = await apiCall('/api/token/', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (data.access) {
        localStorage.setItem('access_token', data.access);
      }
      if (data.refresh) {
        localStorage.setItem('refresh_token', data.refresh);
      }

      const userData = data.user || data;
      
      let tenantId = '';
      let tenantName = 'CDL Holding Group Limited';

      if (userData) {
        const fullName = userData.full_name || userData.email || email;
        tenantName = userData.tenant_name || tenantName;
        
        tenantId = userData.tenant_id || userData.tenant || '';
        
        if (typeof tenantId === 'object' && tenantId !== null) {
          tenantId = tenantId.id || tenantId.pk || '';
        }

        if (typeof tenantId === 'string' && (tenantId.includes('(') || tenantId.includes(' '))) {
          tenantId = ''; 
        }

        const permissionsList = userData.permissions || userData.user_permissions || userData.role?.permissions || [];

        localStorage.setItem('user_full_name', fullName);
        localStorage.setItem('user_permissions', JSON.stringify(permissionsList));
      } else {
        try {
          const userProfile = await apiCall('/v1/accounts/users/me/', {
            method: 'GET',
            requiresAuth: true,
          });

          if (userProfile) {
            localStorage.setItem('user_full_name', userProfile.full_name || userProfile.email || email);
            tenantName = userProfile.tenant_name || tenantName;
            
            tenantId = userProfile.tenant_id || userProfile.tenant || '';
            if (typeof tenantId === 'object' && tenantId !== null) {
              tenantId = tenantId.id || tenantId.pk || '';
            }
            if (typeof tenantId === 'string' && (tenantId.includes('(') || tenantId.includes(' '))) {
              tenantId = '';
            }
            
            const backendPerms = userProfile.permissions || userProfile.role?.permissions || userProfile.user_permissions || [];
            localStorage.setItem('user_permissions', JSON.stringify(backendPerms));
          }
        } catch (profileErr) {
          console.warn('Could not fetch profile permissions fallback:', profileErr);
        }
      }

      // ✅ FIXED: Smart Tenant Resolution instead of blindly picking tenantList[0] (which picked snakevalley)
      if (!tenantId || tenantId === 'null' || tenantId === 'undefined') {
        try {
          const tenantsData = await apiCall('/v1/tenants/', {
            method: 'GET',
            requiresAuth: true,
          });
          const tenantList = Array.isArray(tenantsData) ? tenantsData : (tenantsData?.results || []);
          
          // Look for Muthowa Ent or primary tenant first, rather than picking index 0 randomly
          const correctTenant = tenantList.find((t: any) => 
            t.name?.toLowerCase().includes('muthowa') || t.is_primary
          ) || tenantList[0];

          if (correctTenant) {
            tenantId = correctTenant.id;
            tenantName = correctTenant.name || tenantName;
          }
        } catch (tenantErr) {
          console.warn('Could not auto-fetch tenants list post-login:', tenantErr);
        }
      }

      // Save resolved tenant values safely
      if (tenantId && tenantId !== 'null' && tenantId !== 'undefined') {
        localStorage.setItem('tenant_id', String(tenantId));
        localStorage.setItem('active_company_id', String(tenantId));
        localStorage.setItem('tenant_name', tenantName);
      } else {
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('active_company_id');
      }

      if (!localStorage.getItem('user_permissions')) {
        localStorage.setItem('user_permissions', JSON.stringify([]));
      }

      router.push('/company-home');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password');
    }
  };

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap');
        
        .font-cormorant {
          font-family: 'Cormorant Garamond', serif;
        }
      `}</style>

      <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white font-cormorant">
        
        {/* Left Column: Brand Showcase */}
        <div className="hidden lg:flex bg-[#0d253c] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ef7632]/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-[#ef7632]/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative z-10">
            <Link href="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition text-sm font-medium tracking-wide">
              <ArrowLeft size={16} /> Back to Home
            </Link>
          </div>

          <div className="space-y-6 relative z-10 my-auto max-w-lg">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Lymton Technologies Logo" 
                className="w-14 h-14 object-contain rounded-2xl bg-white p-1.5 shadow-lg"
              />
              <div>
                <span className="text-2xl font-bold tracking-tight block leading-none font-sans">
                  LYMTON
                </span>
                <span className="text-[11px] font-bold tracking-widest text-[#ef7632] uppercase block mt-1 font-sans">
                  TECHNOLOGIES
                </span>
              </div>
            </div>

            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
              Agility, Reliability & Performance in Enterprise Document Systems
            </h1>

            <p className="text-gray-300 text-lg leading-relaxed font-sans">
              Securely access your electronic document vault, monitor contract lifecycles, and streamline your workforce compliance with ultimate confidence.
            </p>

            <div className="space-y-3 pt-4 border-t border-gray-800/80 font-sans">
              <div className="flex items-center gap-3 text-sm text-gray-200">
                <CheckCircle2 className="text-[#ef7632]" size={18} />
                <span>Centralized Electronic Document Vault</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-200">
                <CheckCircle2 className="text-[#ef7632]" size={18} />
                <span>Automated Expiry & Compliance Alerts</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-200">
                <CheckCircle2 className="text-[#ef7632]" size={18} />
                <span>Multi-Tenant Enterprise Security</span>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-gray-400 font-sans">
            &copy; {new Date().getFullYear()} Lymton Technologies. All rights reserved.
          </div>
        </div>

        {/* Right Column: Login Container */}
        <div className="flex items-center justify-center p-6 sm:p-12 lg:p-16 bg-gray-50/50">
          <div className="w-full max-w-md bg-white p-8 sm:p-12 rounded-3xl shadow-xl border border-gray-100">
            
            <div className="lg:hidden flex items-center justify-between mb-8">
              <Link href="/" className="inline-flex items-center gap-1.5 text-gray-500 hover:text-gray-800 text-xs font-semibold">
                <ArrowLeft size={14} /> Home
              </Link>
              <div className="flex items-center gap-2">
                <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg bg-white shadow-xs" />
                <span className="text-xs font-bold text-[#0d253c] font-sans">LYMTON</span>
              </div>
            </div>

            <div className="mb-8 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[#0d253c] tracking-tight">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500 mt-1 font-sans">
                Please enter your credentials to access your account.
              </p>
            </div>

            {error && (
              <div className="mb-4 text-xs text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100 font-sans">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5 font-sans">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wider uppercase">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="name@company.com"
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] focus:ring-1 focus:ring-[#ef7632] text-gray-900 transition bg-white" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5 tracking-wider uppercase">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] focus:ring-1 focus:ring-[#ef7632] text-gray-900 transition bg-white" 
                />
              </div>

              <button 
                type="submit" 
                style={{ backgroundColor: '#ef7632' }}
                className="w-full py-3.5 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition mt-2"
              >
                Sign In to Dashboard
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between text-xs font-sans">
              <span className="text-gray-500">Don&apos;t have an account?</span>
              <Link href="/signup" className="text-[#ef7632] font-bold hover:underline">
                Register Company
              </Link>
            </div>

          </div>
        </div>

      </div>
    </>
  );
}