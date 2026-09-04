'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import InboxTab from '@/components/document-requests/InboxTab';
import SentTab from '@/components/document-requests/SentTab';
import AccountRequestsTab from '@/components/document-requests/AccountRequestsTab';
import TemplatesTab from '@/components/document-requests/TemplatesTab';
import NewRequestView from '@/components/document-requests/NewRequestView';
import { Plus } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

export default function DocumentRequestsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'account-requests' | 'templates'>('sent');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const { primaryColor } = useTenant();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenAllFeatures={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Reused Header Component */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Page Header & Counter */}
        <div className="px-4 sm:px-8 py-5 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📁 Document Requests
          </h1>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">129/150</span> Open Document Requests <span style={{ color: primaryColor }}>?</span>
            </div>
            <button 
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              style={{ backgroundColor: primaryColor }}
              className="px-4 py-2 text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} /> {isCreatingNew ? 'Back to List' : 'New Request'}
            </button>
          </div>
        </div>

        {/* Top Tabs (Always Visible) */}
        <div className="bg-white px-4 sm:px-8 border-b border-gray-200 flex gap-6 sm:gap-8 text-sm font-medium overflow-x-auto shrink-0">
          {[
            { id: 'inbox', label: 'Inbox' },
            { id: 'sent', label: 'Sent' },
            { id: 'account-requests', label: 'Account Requests' },
            { id: 'templates', label: 'Templates' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsCreatingNew(false); // Switch back to listing tab view when clicked
              }}
              style={!isCreatingNew && activeTab === tab.id ? { borderColor: primaryColor, color: primaryColor } : undefined}
              className={`py-3 border-b-2 transition whitespace-nowrap ${
                !isCreatingNew && activeTab === tab.id 
                  ? 'font-semibold' 
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8">
          {isCreatingNew ? (
            <NewRequestView onCancel={() => setIsCreatingNew(false)} />
          ) : (
            <>
              {activeTab === 'inbox' && <InboxTab />}
              {activeTab === 'sent' && <SentTab />}
              {activeTab === 'account-requests' && <AccountRequestsTab />}
              {activeTab === 'templates' && <TemplatesTab />}
            </>
          )}
        </div>

      </div>
    </div>
  );
}