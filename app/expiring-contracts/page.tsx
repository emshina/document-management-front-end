'use client';

import { useState, useEffect } from 'react';
import { apiCall } from '@/lib/api';
import Sidebar from '@/components/Sidebar';
import { AlertTriangle, Calendar, UserCheck, UserX, RefreshCw, Menu, Trash2, ShieldAlert } from 'lucide-react';

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
}

export default function ContractsManagementPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [daysThreshold, setDaysThreshold] = useState(7);
  const [activeTab, setActiveTab] = useState<'expiring' | 'terminated'>('expiring');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

const fetchEmployees = async () => {
    setLoading(true);
    try {
      if (activeTab === 'expiring') {
        const data = await apiCall(`/v1/hr/employees/expiring/?days=${daysThreshold}`, { requiresAuth: true });
        const results = Array.isArray(data) ? data : data.results || [];
        setEmployees(results);
      } else {
        // Fetch strictly Exited employees for the current tenant
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

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar Component */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpenAllFeatures={() => {}} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100"
          >
            <Menu size={24} />
          </button>
          <span className="font-bold text-gray-900">Contracts Management</span>
          <div className="w-8" />
        </div>

        <div className="p-8 max-w-6xl w-full mx-auto space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="text-amber-500" /> Contract Lifecycle Management
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Monitor expiring contracts, manage terminated personnel, and clean up archives.
              </p>
            </div>

            {activeTab === 'expiring' && (
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-600">Threshold:</label>
                <select 
                  value={daysThreshold} 
                  onChange={(e) => setDaysThreshold(Number(e.target.value))}
                  className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                >
                  <option value={7}>Next 7 days</option>
                  <option value={14}>Next 14 days</option>
                  <option value={30}>Next 30 days</option>
                  <option value={60}>Next 60 days</option>
                </select>
              </div>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-gray-200 gap-6">
            <button
              onClick={() => setActiveTab('expiring')}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'expiring'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar size={16} /> Expiring Contracts
            </button>
            <button
              onClick={() => setActiveTab('terminated')}
              className={`pb-3 text-sm font-semibold transition border-b-2 flex items-center gap-2 ${
                activeTab === 'terminated'
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserX size={16} /> Terminated / Exited Records
            </button>
          </div>

          {/* Data Table Container */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {loading ? (
              <div className="p-12 text-center text-gray-400">Loading contracts data...</div>
            ) : employees.length === 0 ? (
              <div className="p-12 text-center text-gray-500">
                {activeTab === 'expiring' ? (
                  <>
                    <UserCheck className="mx-auto h-12 w-12 text-emerald-400 mb-2" />
                    <p className="font-semibold text-gray-700">No expiring contracts found</p>
                    <p className="text-sm text-gray-400">All active employee contracts are secure for the next {daysThreshold} days.</p>
                  </>
                ) : (
                  <>
                    <UserCheck className="mx-auto h-12 w-12 text-purple-400 mb-2" />
                    <p className="font-semibold text-gray-700">No terminated records found</p>
                    <p className="text-sm text-gray-400">There are currently no exited employee profiles in the archive.</p>
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
                      <th className="p-4">{activeTab === 'expiring' ? 'Expiry Date' : 'Date Exited'}</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                    {employees.map((emp) => (
                      <tr key={emp.id} className="hover:bg-gray-50/50 transition">
                        <td className="p-4 font-medium text-gray-900">{emp.staff_no}</td>
                        <td className="p-4">
                          <div className="font-medium text-gray-900">{emp.first_name} {emp.last_name}</div>
                          <div className="text-xs text-gray-400">{emp.email}</div>
                        </td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700">
                            {emp.contract_type}
                          </span>
                        </td>
                        <td className="p-4 font-semibold flex items-center gap-1.5 pt-5">
                          <Calendar size={14} className={activeTab === 'expiring' ? 'text-amber-600' : 'text-gray-400'} /> 
                          {activeTab === 'expiring' ? emp.contract_expiry : (emp.date_exited || 'N/A')}
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
                            className="inline-flex items-center gap-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-xl text-xs font-medium transition shadow-sm disabled:opacity-50"
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
                    ))}
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