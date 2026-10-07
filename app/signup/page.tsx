// app/signup/page.tsx

'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiCall } from '@/lib/api';
import { ArrowLeft, ArrowRight, Building, CheckCircle2, Mail, Phone, Lock, Layers, Users, HardDrive, FileText, Check } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
  max_users: number;
  max_storage_gb: number;
  max_documents: number;
  description?: string;
  features?: Record<string, any>;
}

export default function SignupPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Company Details
  const [companyName, setCompanyName] = useState('');
  const [companyEmail, setCompanyEmail] = useState('');

  // Step 2: Plans
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<number | null>(null);
  const [loadingPlans, setLoadingPlans] = useState(false);

  // Step 3: Admin User Details
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch plans from the correct versioned Django endpoint
  useEffect(() => {
    async function fetchPlans() {
      setLoadingPlans(true);
      try {
        const res = await apiCall('/v1/tenants/plans/');
        const planList = Array.isArray(res) ? res : res.results || [];
        setPlans(planList);
        if (planList.length > 0) {
          setSelectedPlanId(planList[0].id);
        }
      } catch (err: any) {
        console.error('Failed to load plans', err);
        setError(err.message || 'Failed to load subscription plans.');
      } finally {
        setLoadingPlans(false);
      }
    }
    fetchPlans();
  }, []);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 1) {
      if (!companyName.trim()) {
        setError('Please enter a company name.');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!selectedPlanId) {
        setError('A subscription plan is required and cannot be empty.');
        return;
      }
      setStep(3);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Create Company Tenant (Fixed with /v1/ prefix)
      // 1. Create Company Tenant via the public registration endpoint
      const tenantRes = await apiCall('/v1/tenants/register/', {
        method: 'POST',
        body: JSON.stringify({
          name: companyName,
          email: companyEmail || adminEmail,
          plan_id: selectedPlanId,
          is_active: true,
        }),
      });

      const tenantId = tenantRes.id;

      // 2. Create Admin User linked to the new Tenant (Fixed with /v1/ prefix)
      await apiCall('/v1/accounts/users/', {
        method: 'POST',
        body: JSON.stringify({
          email: adminEmail,
          password,
          first_name: firstName,
          last_name: lastName,
          phone,
          tenant: tenantId,
          is_active: true,
          is_staff: true,
        }),
      });

      // 3. Redirect to login
      router.push('/login?registered=true');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please review your entries.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
      {/* Left Column: Branding Showcase */}
      <div className="hidden lg:flex bg-[#0d253c] text-white p-12 lg:p-16 flex-col justify-between relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-[#ef7632]/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-300 hover:text-white transition text-sm">
            <ArrowLeft size={16} /> Back to Home
          </Link>
        </div>

        <div className="space-y-6 relative z-10 my-auto max-w-lg">
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight leading-tight">
            Enterprise Multi-Tenant Provisioning
          </h1>
          <p className="text-gray-300 text-lg leading-relaxed">
            Register your company, pick a scalable plan, and configure your primary system administrator workspace in minutes.
          </p>
          <div className="space-y-3 pt-4 border-t border-gray-800">
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <CheckCircle2 className="text-[#ef7632]" size={18} />
              <span>1. Corporate Information Setup</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <CheckCircle2 className="text-[#ef7632]" size={18} />
              <span>2. Detailed Plan Tier Breakdown</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-gray-200">
              <CheckCircle2 className="text-[#ef7632]" size={18} />
              <span>3. Full-Permission Administrative User</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Lymton Technologies. All rights reserved.
        </div>
      </div>

      {/* Right Column: Dynamic Form Wizard */}
      <div className="flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-gray-50/60 overflow-y-auto">
        <div className="w-full max-w-xl bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-gray-100 my-auto">
          
          {/* Stepper Progress Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs font-bold text-gray-400 mb-2">
              <span className={step >= 1 ? 'text-[#ef7632]' : ''}>1. Company</span>
              <span>/</span>
              <span className={step >= 2 ? 'text-[#ef7632]' : ''}>2. Plans</span>
              <span>/</span>
              <span className={step >= 3 ? 'text-[#ef7632]' : ''}>3. Admin</span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-[#ef7632] h-full transition-all duration-300"
                style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
              ></div>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0d253c] tracking-tight">
              {step === 1 && 'Company Details'}
              {step === 2 && 'Select Subscription Plan'}
              {step === 3 && 'Create Administrator Account'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {step === 1 && 'Enter your organization name and email.'}
              {step === 2 && 'Review and select the tier that fits your operational scale.'}
              {step === 3 && 'Assign full administrative permissions for your initial account.'}
            </p>
          </div>

          {error && (
            <div className="mb-4 text-xs text-red-600 bg-red-50 p-3.5 rounded-xl border border-red-100">
              {error}
            </div>
          )}

          {/* STEP 1: Company Profile */}
          {step === 1 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Company Name</label>
                <div className="relative">
                  <Building className="absolute left-3.5 top-3 text-gray-400" size={16} />
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Lymton Holdings"
                    value={companyName} 
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Company Email <span className="text-gray-400 font-normal">(Optional)</span></label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 text-gray-400" size={16} />
                  <input 
                    type="email" 
                    placeholder="corporate@lymton.com"
                    value={companyEmail} 
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                  />
                </div>
              </div>

              <button 
                type="submit" 
                style={{ backgroundColor: '#ef7632' }}
                className="w-full py-3.5 text-white text-sm font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition mt-4 flex items-center justify-center gap-2"
              >
                Next: Choose Plan <ArrowRight size={16} />
              </button>
            </form>
          )}

          {/* STEP 2: Plans Selection with Clean Presentation */}
          {step === 2 && (
            <form onSubmit={handleNextStep} className="space-y-4">
              {loadingPlans ? (
                <div className="py-12 text-center text-xs text-gray-500">Loading subscription plans...</div>
              ) : plans.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-500 bg-gray-50 rounded-xl border">
                  No plans configured in backend. Please add plans in your Django admin.
                </div>
              ) : (
                <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#ef7632] bg-[#ef7632]/5 ring-2 ring-[#ef7632]/30 shadow-md'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-[#ef7632] text-white' : 'bg-gray-100 text-gray-600'}`}>
                              <Layers size={18} />
                            </div>
                            <div>
                              <h3 className="font-bold text-base text-[#0d253c] capitalize">{plan.name}</h3>
                              <p className="text-[11px] text-gray-500">
                                {plan.description || 'Optimized for scaling operations and team productivity'}
                              </p>
                            </div>
                          </div>
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'border-[#ef7632] bg-[#ef7632] text-white' : 'border-gray-300'
                          }`}>
                            {isSelected && <Check size={14} strokeWidth={3} />}
                          </div>
                        </div>

                        {/* Plan Metrics Grid with Proper Pluralization */}
                        <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100 text-xs">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Users size={14} className="text-[#ef7632]" />
                            <span><strong>{plan.max_users}</strong> {plan.max_users === 1 ? 'User' : 'Users'}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <HardDrive size={14} className="text-[#ef7632]" />
                            <span><strong>{plan.max_storage_gb} GB</strong> Storage</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <FileText size={14} className="text-[#ef7632]" />
                            <span><strong>{plan.max_documents.toLocaleString()}</strong> Docs</span>
                          </div>
                        </div>

                        {/* Optional Features description if configured */}
                        {plan.features && Object.keys(plan.features).length > 0 && (
                          <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                            {Object.entries(plan.features).map(([key, val]) => (
                              <span key={key} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-medium">
                                {key}: {String(val)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-1/3 py-3 text-gray-600 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  style={{ backgroundColor: '#ef7632' }}
                  className="w-2/3 py-3 text-white text-xs font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition flex items-center justify-center gap-2"
                >
                  Next: Admin User <ArrowRight size={16} />
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Admin User Account */}
          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">First Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Paul"
                    value={firstName} 
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Last Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Muchina"
                    value={lastName} 
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Admin Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  <input 
                    type="email" 
                    required
                    placeholder="admin@lymton.com"
                    value={adminEmail} 
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  <input 
                    type="text" 
                    required
                    placeholder="0712345678"
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1 uppercase">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 text-gray-400" size={14} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs border border-gray-200 rounded-xl outline-none focus:border-[#ef7632] text-gray-900" 
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setStep(2)}
                  className="w-1/3 py-3 text-gray-600 text-xs font-bold border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button 
                  type="submit" 
                  disabled={loading}
                  style={{ backgroundColor: '#ef7632' }}
                  className="w-2/3 py-3 text-white text-xs font-bold tracking-wide rounded-xl shadow-lg shadow-[#ef7632]/25 hover:opacity-95 transition disabled:opacity-50"
                >
                  {loading ? 'Creating Workspace...' : 'Complete & Launch'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-gray-100 flex items-center justify-between text-xs">
            <span className="text-gray-500">Already have an account?</span>
            <Link href="/login" className="text-[#ef7632] font-bold hover:underline">
              Sign In
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}