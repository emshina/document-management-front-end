'use client';
import { Inbox, ArrowUpDown } from 'lucide-react';

export default function InboxTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-8 text-center text-gray-500 text-sm">
      <Inbox className="mx-auto text-purple-300 mb-2" size={32} />
      <p className="font-semibold text-gray-700">No incoming document requests found.</p>
      <p className="text-xs text-gray-400 mt-1">Incoming requests from external or internal parties will appear here.</p>
    </div>
  );
}