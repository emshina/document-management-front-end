'use client';
import { UserCheck, ArrowUpDown } from 'lucide-react';

export default function AccountRequestsTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-8 text-center text-gray-500 text-sm">
      <UserCheck className="mx-auto text-purple-300 mb-2" size={32} />
      <p className="font-semibold text-gray-700">No account requests pending.</p>
      <p className="text-xs text-gray-400 mt-1">Requests related to account onboarding or verification will appear here.</p>
    </div>
  );
}