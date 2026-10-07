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
  Menu,
  HardDrive
} from 'lucide-react';

interface SubCompany {
  id: string;
  name: string;
  departments_count?: number;
  employee_count?: number;
  storage_used_gb?: number;
  storage_quota_gb?: number;
}

interface CompanyHomeStats {
  motherCompanyName: string;
  subCompaniesCount: number;
  totalDepartments: number;
  totalEmployees: number;
  expiringContractsCount: number;
  totalStorageUsed: number;
  totalStorageQuota: number;
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
    totalStorageUsed: 0,
    totalStorageQuota: 100,
    subCompanies: [],
    expiringContracts: [],
  });

  useEffect(() => {
    const fetchCompanyData = async () => {
      try {
        setLoading(true);
        
        // 1. Fetch holding-level data first to resolve the current tenant/mother company
        const currentTenantData = await apiCall('/v1/tenants/tenants/current/', { requiresAuth: true }).catch(() => null);
        const tenantObj = Array.isArray(currentTenantData) ? currentTenantData[0] : currentTenantData?.results?.[0] || currentTenantData;
        const currentTenantId = tenantObj?.id;

        // 2. Fetch remaining enterprise data in parallel, passing the tenant ID to departments
        const [tenantNodesData, deptData, empData, expiringContractsData] = await Promise.all([
          apiCall('/v1/tenants/tenants/', { requiresAuth: true }).catch(() => null),
          fetchDepartments(currentTenantId).catch(() => []), // Pass currentTenantId here!
          fetchAllEmployees().catch(() => []),
          fetchExpiringContracts(30, true).catch(() => []) 
        ]);

        const motherName = tenantObj?.name || localStorage.getItem('tenant_name') || 'Holding Group';
        
        // Extract total storage metrics from the root/current tenant response
        const totalStorageUsed = tenantObj?.storage_used_gb || 0;
        const totalStorageQuota = tenantObj?.storage_quota_gb || 100;

        const rawTenants = Array.isArray(tenantNodesData) ? tenantNodesData : tenantNodesData?.results || [];
        const deptsArray: Department[] = Array.isArray(deptData) ? deptData : deptData?.results || [];
        const empsArray: Employee[] = Array.isArray(empData) ? empData : empData?.results || [];

        // Flatten the hierarchy while deduplicating by ID to prevent duplicate keys
        const tenantMap = new Map();
        rawTenants.forEach((t: any) => {
          if (t && t.id) {
            tenantMap.set(t.id, t);
          }
          if (t.sub_tenants && Array.isArray(t.sub_tenants)) {
            t.sub_tenants.forEach((sub: any) => {
              if (sub && sub.id) {
                tenantMap.set(sub.id, sub);
              }
            });
          }
        });

        const tenantsArray: any[] = Array.from(tenantMap.values());
        const effectiveSubComps = tenantsArray;

        // 3. Map through each sub-company and aggregate workforce, departments, and storage
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
            storage_used_gb: t.storage_used_gb || 0,
            storage_quota_gb: t.storage_quota_gb || 100,
          };
        });

        setStats({
          motherCompanyName: motherName,
          subCompaniesCount: processedSubCompanies.length > 0 ? processedSubCompanies.length : 1,
          totalDepartments: deptsArray.length,
          totalEmployees: empsArray.length,
          expiringContractsCount: expiringContractsData.length,
          totalStorageUsed,
          totalStorageQuota,
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

  const storagePercentage = Math.min(Math.round((stats.totalStorageUsed / (stats.totalStorageQuota || 100)) * 100), 100);

  // Helper function to detect if contract expiry date is in the past
  const isContractExpired = (expiryDateStr?: string) => {
    if (!expiryDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    return expiry < today;
  };

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
                Comprehensive breakdown of structural sub-units, departments, workforce distribution, and enterprise storage usage.
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

            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Storage Usage</span>
                <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600">
                  <HardDrive size={20} />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-3xl font-extrabold text-gray-900">
                  {stats.totalStorageUsed} <span className="text-sm font-normal text-gray-500">GB / {stats.totalStorageQuota} GB</span>
                </h3>
                <div className="w-full bg-gray-100 rounded-full h-2 mt-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${storagePercentage}%` }}
                  />
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 text-xs text-gray-500 flex justify-between">
                <span>Hierarchy Total</span>
                <span className="font-semibold text-indigo-600">{storagePercentage}% Used</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-gray-900">Sub-Companies, Departments & Storage</h3>
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
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-800 text-xs font-semibold">
                          {comp.employee_count || 0} Employees
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold">
                          {comp.storage_used_gb || 0} GB
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
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={18} className="text-rose-500" />
                    <h3 className="text-base font-bold text-gray-900">Contract Alerts</h3>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold">
                    {stats.expiringContracts.length}
                  </span>
                </div>

                {stats.expiringContracts.length > 0 ? (
                  <div className="space-y-3">
                    {stats.expiringContracts.slice(0, 4).map((contract) => {
                      const fullName = `${contract.first_name || ''} ${contract.middle_name || ''} ${contract.last_name || ''}`.replace(/\s+/g, ' ').trim();
                      const expired = isContractExpired(contract.contract_expiry);

                      return (
                        <div 
                          key={contract.id} 
                          className={`p-3 rounded-xl border text-xs space-y-1 ${
                            expired 
                              ? 'bg-red-50/70 border-red-200' 
                              : 'bg-amber-50/60 border-amber-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <p className="font-semibold text-gray-900">{fullName || contract.email || 'Staff Member'}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              expired ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                            }`}>
                              {expired ? 'EXPIRED' : 'EXPIRING SOON'}
                            </span>
                          </div>
                          <p className="text-gray-500">{contract.department_name || 'General'} • {contract.position_title || contract.contract_type || 'Contract'}</p>
                          <p className={`font-medium pt-0.5 ${expired ? 'text-red-700' : 'text-amber-700'}`}>
                            {expired ? 'Expired on: ' : 'Expires on: '} {contract.contract_expiry}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-xs text-gray-500">No expiring or expired contracts found within this scope.</p>
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