'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { apiCall } from '@/lib/api';
import { fetchExpiringContracts, ExpiringEmployee } from '@/lib/expiringContracts';
import { fetchAllEmployees, Employee } from '@/lib/employees';
import { fetchDepartments, Department } from '@/lib/departments';
import { 
  Building2, 
  Layers, 
  Users, 
  AlertTriangle, 
  Briefcase, 
  ArrowUpRight, 
  ShieldAlert,
  Loader2,
  Menu
} from 'lucide-react';

interface SubCompany {
  id: string;
  name: string;
  departments_count?: number;
  employee_count?: number;
}

interface CompanyHomeStats {
  motherCompanyName: string;
  subCompaniesCount: number;
  totalDepartments: number;
  totalEmployees: number;
  expiringContractsCount: number;
  subCompanies: SubCompany[];
  expiringContracts: ExpiringEmployee[];
}

export default function CompanyHomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [allFeaturesOpen, setAllFeaturesOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [stats, setStats] = useState<CompanyHomeStats>({
    motherCompanyName: 'Loading...',
    subCompaniesCount: 0,
    totalDepartments: 0,
    totalEmployees: 0,
    expiringContractsCount: 0,
    subCompanies: [],
    expiringContracts: [],
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch holding-level data using the default active mother company context
        const [currentTenantData, tenantNodesData, deptData, empData, expiringContractsData] = await Promise.all([
          apiCall('/v1/tenants/tenants/current/', { requiresAuth: true }).catch(() => null),
          apiCall('/v1/tenants/tenants/', { requiresAuth: true }).catch(() => null),
          fetchDepartments().catch(() => []),
          fetchAllEmployees().catch(() => []),
          fetchExpiringContracts(30).catch(() => [])
        ]);

        const tenantObj = Array.isArray(currentTenantData) ? currentTenantData[0] : currentTenantData?.results?.[0] || currentTenantData;
        const motherName = tenantObj?.name || localStorage.getItem('tenant_name') || 'Holding Group';

        const tenantsArray = Array.isArray(tenantNodesData) ? tenantNodesData : tenantNodesData?.results || [];
        const deptsArray: Department[] = Array.isArray(deptData) ? deptData : deptData?.results || [];
        const empsArray: Employee[] = Array.isArray(empData) ? empData : empData?.results || [];

        const subTenants = tenantsArray.filter((t: any) => t.type === 'sub_company' || (t.parent && t.parent !== t.id));
        const effectiveSubComps = subTenants.length > 0 ? subTenants : tenantsArray;

        // 2. Map through each sub-company and match them using their tenant ID
        const processedSubCompanies: SubCompany[] = effectiveSubComps.map((t: any) => {
          const tenantIdStr = String(t.id);

          const subEmps = empsArray.filter((e: any) => {
            const eTenant = String(e.tenant_id ?? e.tenant?.id ?? e.tenant ?? '');
            return eTenant === tenantIdStr;
          });

          const subDepts = deptsArray.filter((d: any) => {
            const dTenant = String(d.tenant_id ?? d.tenant?.id ?? d.tenant ?? '');
            return dTenant === tenantIdStr;
          });

          return {
            id: t.id || Math.random().toString(),
            name: t.name || 'Sub Company',
            employee_count: subEmps.length,
            departments_count: subDepts.length,
          };
        });

        setStats({
          motherCompanyName: motherName,
          subCompaniesCount: processedSubCompanies.length > 0 ? processedSubCompanies.length : 1,
          totalDepartments: deptsArray.length,
          totalEmployees: empsArray.length,
          expiringContractsCount: expiringContractsData.length,
          subCompanies: processedSubCompanies,
          expiringContracts: expiringContractsData,
        });

      } catch (err: any) {
        console.error('Error fetching company home metrics:', err);
        setError('Failed to fetch real-time enterprise metrics.');
      } finally {
        setLoading(false);
      }
    };

    fetchCompanyData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm font-medium text-gray-500">Loading company structure...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onOpenAllFeatures={() => setAllFeaturesOpen(true)} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 bg-white border-b border-gray-100 shadow-sm md:hidden">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="font-bold text-gray-900 text-sm">Company Home</span>
          <div className="w-8" />
        </header>

        <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-semibold mb-2">
                <Briefcase size={12} /> Mother & Sub-Company Overview
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{stats.motherCompanyName}</h1>
              <p className="text-sm text-gray-500 mt-1">
                Comprehensive breakdown of structural sub-units, departments, workforce distribution, and contract timelines.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/expiring-contracts"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition shadow-sm shadow-purple-200"
              >
                <Users size={16} /> Manage Contracts
              </a>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Structure</span>
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <Building2 size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-gray-900">{stats.subCompaniesCount}</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">Sub-Companies</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500 flex justify-between">
                <span>Holding Hierarchy</span>
                <span className="font-semibold text-blue-600">Active</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Divisions</span>
                <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
                  <Layers size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-gray-900">{stats.totalDepartments}</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">Total Departments</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500 flex justify-between">
                <span>Across all units</span>
                <span className="font-semibold text-purple-600">Synced</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Workforce</span>
                <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
                  <Users size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-gray-900">{stats.totalEmployees}</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">Total Employees</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500 flex justify-between">
                <span>Global Headcount</span>
                <span className="font-semibold text-emerald-600">Onboarded</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Action Required</span>
                <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600">
                  <AlertTriangle size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-rose-600">{stats.expiringContractsCount}</h3>
                <p className="text-sm font-medium text-gray-600 mt-1">Contracts Expiring (1 Month)</p>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs flex justify-between">
                <span className="text-gray-500">Review status</span>
                <a href="/expiring-contracts" className="font-semibold text-rose-600 hover:underline inline-flex items-center gap-1">
                  View <ArrowUpRight size={12} />
                </a>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Sub-Companies & Department Distribution</h3>
                <span className="text-xs text-gray-500 font-medium">{stats.subCompanies.length} Units</span>
              </div>

              <div className="divide-y divide-gray-100">
                {stats.subCompanies.length > 0 ? (
                  stats.subCompanies.map((comp) => (
                    <div key={comp.id} className="py-4 flex items-center justify-between first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center font-bold text-sm">
                          {comp.name ? comp.name.charAt(0).toUpperCase() : 'C'}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{comp.name}</h4>
                          <p className="text-xs text-gray-500">
                            {comp.departments_count || 0} Departments registered
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-3 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
                          {comp.employee_count || 0} Employees
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="py-6 text-xs text-gray-500 text-center">No sub-companies listed under this hierarchy.</p>
                )}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert size={18} className="text-rose-500" />
                  <h3 className="text-base font-bold text-gray-900">Expiring Contracts</h3>
                </div>

                {stats.expiringContracts.length > 0 ? (
                  <div className="space-y-3">
                    {stats.expiringContracts.slice(0, 4).map((contract) => {
                      const fullName = `${contract.first_name || ''} ${contract.middle_name || ''} ${contract.last_name || ''}`.replace(/\s+/g, ' ').trim();
                      return (
                        <div key={contract.id} className="p-3 rounded-xl bg-rose-50/60 border border-rose-100 text-xs space-y-1">
                          <p className="font-semibold text-gray-900">{fullName || contract.email || 'Staff Member'}</p>
                          <p className="text-gray-500">{contract.department_name || 'General'} • {contract.position_title || contract.contract_type || 'Contract'}</p>
                          <p className="text-rose-600 font-medium pt-0.5">Expires: {contract.contract_expiry}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-xs text-gray-500">No contracts expiring within the next 30 days. All terms are current.</p>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-50">
                <a 
                  href="/expiring-contracts" 
                  className="w-full py-2.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl transition flex items-center justify-center gap-1.5"
                >
                  View All Contract Alerts <ArrowUpRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}