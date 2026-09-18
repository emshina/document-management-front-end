'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, Clock, CheckCircle2, AlertCircle, FileText, Bell } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';
import { apiCall } from '@/lib/api';

export default function SignatureRequestsList({ onOpenWizard, onViewDetails, onEdit }: { onOpenWizard: () => void; onViewDetails: (id: string) => void; onEdit: (id: string) => void }) {
  const [envelopes, setEnvelopes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [remindingId, setRemindingId] = useState<string | null>(null);
  
  const { tenant, primaryColor } = useTenant();

  const fetchEnvelopes = async () => {
    setLoading(true);
    try {
      let endpoint = '/v1/esignature/envelopes/';
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (params.toString()) endpoint += `?${params.toString()}`;

      const data = await apiCall(endpoint, {
        method: 'GET',
        requiresAuth: true,
      });

      const listData = Array.isArray(data) ? data : (data.results || []);
      setEnvelopes(listData);
    } catch (err: any) {
      console.error("Failed to fetch signature envelopes:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnvelopes();
  }, [statusFilter, searchQuery, tenant]);

  const handleSendReminder = async (id: string) => {
    setRemindingId(id);
    try {
      const res = await apiCall(`/v1/esignature/envelopes/${id}/send-reminder/`, {
        method: 'POST',
        requiresAuth: true,
      });
      alert(res.status || 'Reminder sent successfully!');
    } catch (err: any) {
      alert(err.message || 'Failed to send reminder.');
    } finally {
      setRemindingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold"><CheckCircle2 size={12} /> Completed</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full text-xs font-semibold"><Clock size={12} /> Pending</span>;
      case 'Draft':
        return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-semibold"><FileText size={12} /> Draft</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold"><AlertCircle size={12} /> {status}</span>;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search envelopes or documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <button
          onClick={onOpenWizard}
          style={{ backgroundColor: primaryColor }}
          className="w-full sm:w-auto flex items-center justify-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition shadow-sm"
        >
          <Plus size={16} />
          New Signature Request
        </button>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wider">
              <th className="py-3 px-6">Title / Document</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Recipients</th>
              <th className="py-3 px-6">Created At</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">Loading signature requests...</td>
              </tr>
            ) : envelopes.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-gray-400">
                  <FileText className="mx-auto mb-2 text-gray-300" size={32} />
                  No signature requests found. Click "New Signature Request" to start one.
                </td>
              </tr>
            ) : (
              envelopes.map((env: any) => (
                <tr key={env.id} className="hover:bg-gray-50/50 transition">
                  <td className="py-4 px-6 font-medium text-gray-900">
                    <div>{env.title}</div>
                    <div className="text-xs text-gray-400 font-normal">{env.document_title || 'Attached PDF'}</div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(env.status)}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-600">
                    {env.recipients?.length ? `${env.recipients.length} recipient(s)` : 'None'}
                  </td>
                  <td className="py-4 px-6 text-xs text-gray-500">
                    {new Date(env.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {/* Show Send Reminder button only for Pending status */}
                      {env.status === 'Pending' && (
                        <button 
                          onClick={() => handleSendReminder(env.id)}
                          disabled={remindingId === env.id}
                          className="flex items-center gap-1 text-amber-700 hover:text-amber-900 font-medium text-xs bg-amber-50 px-3 py-1.5 rounded-md transition disabled:opacity-50"
                        >
                          <Bell size={12} />
                          {remindingId === env.id ? 'Sending...' : 'Remind'}
                        </button>
                      )}

                      {/* Show Edit button only if Draft or Pending */}
                      {['Draft', 'Pending'].includes(env.status) && (
                        <button 
                          onClick={() => onEdit(env.id)}
                          className="text-gray-700 hover:text-gray-900 font-medium text-xs bg-gray-100 px-3 py-1.5 rounded-md transition"
                        >
                          Edit
                        </button>
                      )}

                      <button 
                        onClick={() => onViewDetails(env.id)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-xs bg-blue-50 px-3 py-1.5 rounded-md transition"
                      >
                        View Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}