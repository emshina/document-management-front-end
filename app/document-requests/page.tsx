'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import InboxTab from '@/components/document-requests/InboxTab';
import SentTab from '@/components/document-requests/SentTab';
import AccountRequestsTab from '@/components/document-requests/AccountRequestsTab';
import TemplatesTab from '@/components/document-requests/TemplatesTab';
import NewRequestView from '@/components/document-requests/NewRequestView';
import { Search, SlidersHorizontal, Plus, Bell, HelpCircle, History, Upload } from 'lucide-react';

export default function DocumentRequestsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'inbox' | 'sent' | 'account-requests' | 'templates'>('sent');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} onOpenAllFeatures={() => {}} />

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-4 w-full max-w-md">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden text-gray-600 hover:text-gray-900">
              <SlidersHorizontal size={20} />
            </button>
            <div className="relative w-full">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search requests..." 
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-gray-50 border border-gray-200 rounded-lg outline-none focus:border-purple-600 transition"
              />
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900"><Upload size={18} /></button>
            <button className="text-gray-600 hover:text-gray-900"><History size={18} /></button>
            <button className="text-gray-600 hover:text-gray-900"><Bell size={18} /></button>
            <button className="text-gray-600 hover:text-gray-900"><HelpCircle size={18} /></button>
            <div className="flex items-center gap-2 bg-[#2D1B4E] text-white px-3 py-1.5 rounded-full text-xs font-semibold">
              <span className="w-5 h-5 bg-[#7C3AED] rounded-full flex items-center justify-center">C</span>
              CDL Holding Group Limited
            </div>
          </div>
        </header>

        {/* Page Header & Counter */}
        <div className="px-4 sm:px-8 py-5 bg-white border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            📁 Document Requests
          </h1>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">129/150</span> Open Document Requests <span className="text-[#7C3AED]">?</span>
            </div>
            <button 
              onClick={() => setIsCreatingNew(!isCreatingNew)}
              className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-purple-700 transition shadow-sm"
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
              className={`py-3 border-b-2 transition whitespace-nowrap ${
                !isCreatingNew && activeTab === tab.id 
                  ? 'border-[#7C3AED] text-[#7C3AED] font-semibold' 
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