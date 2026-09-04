'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import TemplatesListTab from '@/components/folder-templates/TemplatesListTab';
import { useTenant } from '@/hooks/useTenant';

export default function FolderTemplatesPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'blueprints' | 'settings'>('blueprints');
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
            📂 Folder Templates Management
          </h1>
          <div className="flex items-center justify-between sm:justify-end gap-4">
            <div className="text-sm text-gray-700">
              <span className="font-semibold text-gray-900">Reusable</span> Hierarchical Blueprints <span style={{ color: primaryColor }}>?</span>
            </div>
          </div>
        </div>

        {/* Top Tabs */}
        <div className="bg-white px-4 sm:px-8 border-b border-gray-200 flex gap-6 sm:gap-8 text-sm font-medium overflow-x-auto shrink-0">
          {[
            { id: 'blueprints', label: 'Template Blueprints' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={activeTab === tab.id ? { borderColor: primaryColor, color: primaryColor } : undefined}
              className={`py-3 border-b-2 transition whitespace-nowrap ${
                activeTab === tab.id 
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
          {activeTab === 'blueprints' && <TemplatesListTab />}
        </div>

      </div>
    </div>
  );
}