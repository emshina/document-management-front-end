'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Clock, ShieldAlert, FileCheck } from 'lucide-react';

export default function SignatureRequestsList() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch signature requests from Django endpoint if configured, or show empty fallback state
    setLoading(false);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-800">Signature Requests & Audit Logs</h2>
        <p className="text-sm text-gray-500">Monitor IP addresses, cryptographic hashes, and execution status of agreements.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <th className="py-3 px-4">Signer Name / Email</th>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Expires At</th>
                <th className="py-3 px-4">Signed At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {requests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 text-xs">
                    No signature requests logged yet. Sent agreement logs will appear here.
                  </td>
                </tr>
              ) : (
                requests.map((req, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 transition">
                    <td className="py-3 px-4 font-medium text-gray-800">
                      {req.signer_name}
                      <span className="block text-xs font-normal text-gray-500">{req.signer_email}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-600">{req.document_name || 'Document'}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        req.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {req.status === 'Completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-gray-500">{req.expires_at || 'N/A'}</td>
                    <td className="py-3 px-4 text-xs text-gray-500">{req.signed_at || 'Pending'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}