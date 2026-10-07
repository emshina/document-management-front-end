'use client';

import { useState, useEffect, useMemo } from 'react';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { AlertTriangle, Calendar, UserCheck, UserX, RefreshCw, Menu, Trash2, Search, Filter, Building2 } from 'lucide-react';

interface Employee {
  id: string;
  staff_no: string;
  first_name: string;
  last_name: string;
  email: string;
  contract_type: string;
  contract_expiry: string;
  status: string;
  date_exited?: string;
  department_name?: string;
}

interface TenantData {
  name: string;
  effective_primary_color?: string;
}

export default function ContractsManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysThreshold, setDaysThreshold] = useState(30);
  const [activeTab, setActiveTab] = useState<'expiring' | 'terminated'>('expiring');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState('ALL');

  // Fetch tenant branding for dynamic company colors & name
  useEffect(() => {
    apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
      .then((data) => {
        if (!data) return;
        const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
        if (tenantObj) {
          setTenant(tenantObj);
        }
      })
      .catch((err) => console.error('Error loading tenant branding:', err));
  }, []);

  const primaryColor = tenant?.effective_primary_color || '#2D1B4E';
  const companyName = tenant?.name || 'Organization';

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      if (activeTab === 'expiring') {
        const data = await apiCall(`/v1/hr/employees/expiring/?days=${daysThreshold}&include_expired=true`, { requiresAuth: true });
        const results = Array.isArray(data) ? data : data.results || [];
        setEmployees(results);
      } else {
        const data = await apiCall(`/v1/hr/employees/?status=Exited`, { requiresAuth: true });
        const results = Array.isArray(data) ? data : data.results || [];
        setEmployees(results);
      }
    } catch (err) {
      console.error('Failed to load contracts data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [daysThreshold, activeTab]);

  const handleRenewContract = async (emp: Employee) => {
    const newExpiry = prompt("Enter new contract expiry date (YYYY-MM-DD):", new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0]);
    if (!newExpiry) return;

    setActionLoading(emp.id);
    try {
      await apiCall(`/v1/hr/employees/${emp.id}/`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({
          contract_expiry: newExpiry,
          contract_start: new Date().toISOString().split('T')[0],
          status: 'Active',
          date_exited: null
        })
      });
      alert('Contract successfully renewed and activated!');
      fetchEmployees();
    } catch (err) {
      console.error('Failed to renew contract:', err);
      alert('Error renewing contract.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleTerminate = async (emp: Employee) => {
    if (!confirm(`Are you sure you want to mark ${emp.first_name} ${emp.last_name} as Exited?`)) return;

    setActionLoading(emp.id);
    try {
      await apiCall(`/v1/hr/employees/${emp.id}/`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({
          status: 'Exited',
          date_exited: new Date().toISOString().split('T')[0]
        })
      });
      alert('Employee contract terminated / marked as exited.');
      fetchEmployees();
    } catch (err) {
      console.error('Failed to update employee status:', err);
      alert('Error updating status.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteEmployee = async (emp: Employee) => {
    if (!confirm(`DANGER: Are you sure you want to permanently delete ${emp.first_name} ${emp.last_name} and all their linked registry folders? This action cannot be undone.`)) return;

    setActionLoading(emp.id);
    try {
      await apiCall(`/v1/hr/employees/${emp.id}/`, {
        method: 'DELETE',
        requiresAuth: true,
      });
      alert('Employee and associated registry folders permanently deleted.');
      fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee:', err);
      alert('Error deleting employee record.');
    } finally {
      setActionLoading(null);
    }
  };

  const isContractExpired = (expiryDateStr?: string) => {
    if (!expiryDateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDateStr);
    return expiry < today;
  };

  // Extract unique departments for filtering
  const availableDepartments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(e => {
      if (e.department_name) depts.add(e.department_name);
    });
    return Array.from(depts);
  }, [employees]);

  // Filtered employees based on search query and department filter
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const fullName = `${emp.first_name || ''} ${emp.last_name || ''}`.toLowerCase();
      const staffNo = (emp.staff_no || '').toLowerCase();
      const email = (emp.email || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = fullName.includes(query) || staffNo.includes(query) || email.includes(query);
      const matchesDept = selectedDept === 'ALL' || emp.department_name === selectedDept;

      return matchesSearch && matchesDept;
    });
  }, [employees, searchQuery, selectedDept]);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpenAllFeatures={() => {}} 
      />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-y-auto">
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200 shrink-0">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-900">Contracts Management</span>
          <div className="w-8" />
        </div>

        <div className="p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Header Banner with Company Name */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 mb-1">
                <Building2 size={13} style={{ color: primaryColor }} />
                <span>{companyName}</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" /> Contract Lifecycle Management
              </h1>
              <p className="text-sm text-gray-500">
                Monitor expiring or expired contracts, manage terminated personnel, and clean up archives.
              </p>
            </div>

            {activeTab === 'expiring' && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Threshold:</label>
                <select 
                  value={daysThreshold} 
                  onChange={(e) => setDaysThreshold(Number(e.target.value))}
                  className="border border-gray-300 rounded-xl px-3 py-2 text-sm text-gray-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value={7} className="text-gray-900 bg-white">Next 7 days</option>
                  <option value={14} className="text-gray-900 bg-white">Next 14 days</option>
                  <option value={30} className="text-gray-900 bg-white">Next 30 days</option>
                  <option value={60} className="text-gray-900 bg-white">Next 60 days</option>
                </select>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 gap-6">
            <button
              onClick={() => setActiveTab('expiring')}
              style={{
                borderColor: activeTab === 'expiring' ? primaryColor : 'transparent',
                color: activeTab === 'expiring' ? primaryColor : undefined
              }}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'expiring' ? '' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar size={16} /> Expiring & Expired Contracts
            </button>
            <button
              onClick={() => setActiveTab('terminated')}
              style={{
                borderColor: activeTab === 'terminated' ? primaryColor : 'transparent',
                color: activeTab === 'terminated' ? primaryColor : undefined
              }}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'terminated' ? '' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserX size={16} /> Terminated / Exited Records
            </button>
          </div>

          {/* Search & Department Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                type="text"
                placeholder="Search by name, staff ID, or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white transition"
              />
            </div>

            {availableDepartments.length > 0 && (
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={16} className="text-gray-400 shrink-0" />
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full sm:w-48 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 transition"
                >
                  <option value="ALL">All Departments</option>
                  {availableDepartments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Data Table Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading contracts data...</div>
            ) : filteredEmployees.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                {employees.length === 0 ? (
                  <>
                    <UserCheck className="mx-auto h-12 w-12 text-emerald-400 mb-2" />
                    <p className="font-semibold text-gray-700">No records found</p>
                    <p className="text-sm text-gray-400">All employee records are clear under this category.</p>
                  </>
                ) : (
                  <>
                    <Search className="mx-auto h-12 w-12 text-gray-300 mb-2" />
                    <p className="font-semibold text-gray-700">No matching contracts found</p>
                    <p className="text-sm text-gray-400">Try adjusting your search query or department filter.</p>
                  </>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      <th className="p-4">Staff No</th>
                      <th className="p-4">Employee Name</th>
                      <th className="p-4">Contract Type</th>
                      <th className="p-4">{activeTab === 'expiring' ? 'Expiry Status & Date' : 'Date Exited'}</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {filteredEmployees.map((emp) => {
                      const expired = activeTab === 'expiring' && isContractExpired(emp.contract_expiry);

                      return (
                        <tr key={emp.id} className="hover:bg-gray-50/50 transition">
                          <td className="p-4 font-medium text-gray-900">{emp.staff_no}</td>
                          <td className="p-4">
                            <div className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                            <div className="text-xs text-gray-400">{emp.email}</div>
                          </td>
                          <td className="p-4">
                            <span 
                              className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                            >
                              {emp.contract_type}
                            </span>
                          </td>
                          <td className="p-4">
                            {activeTab === 'expiring' ? (
                              <div className="space-y-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  expired ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                  {expired ? 'EXPIRED' : 'EXPIRING SOON'}
                                </span>
                                <div className="flex items-center gap-1.5 font-semibold text-xs text-gray-800">
                                  <Calendar size={14} className={expired ? 'text-red-600' : 'text-amber-600'} /> 
                                  {emp.contract_expiry}
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 font-semibold text-gray-700">
                                <Calendar size={14} className="text-gray-400" /> 
                                {emp.date_exited || 'N/A'}
                              </div>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                              emp.status === 'Exited' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {emp.status}
                            </span>
                          </td>
                          <td className="p-4 text-right space-x-2">
                            <button
                              disabled={actionLoading === emp.id}
                              onClick={() => handleRenewContract(emp)}
                              style={{ backgroundColor: primaryColor }}
                              className="inline-flex items-center gap-1 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50 hover:opacity-90"
                            >
                              <RefreshCw size={12} /> {activeTab === 'terminated' ? 'Reactivate / Renew' : 'Renew'}
                            </button>

                            {activeTab === 'expiring' ? (
                              <button
                                disabled={actionLoading === emp.id}
                                onClick={() => handleTerminate(emp)}
                                className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 px-3 py-1.5 rounded-xl text-xs font-medium transition disabled:opacity-50"
                              >
                                <UserX size={12} /> Terminate
                              </button>
                            ) : (
                              <button
                                disabled={actionLoading === emp.id}
                                onClick={() => handleDeleteEmployee(emp)}
                                className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
                              >
                                <Trash2 size={12} /> Delete All
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}