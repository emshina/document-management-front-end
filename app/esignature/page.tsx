'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FormTemplateList from '../../components/esignature/FormTemplateList';
import SignatureRequestsList from '../../components/esignature/SignatureRequestsList';

import { FileText, PenTool, Plus } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

export default function ESignatureDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'requests'>('templates');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const { primaryColor } = useTenant();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Global Sidebar Component */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        onOpenAllFeatures={() => alert("All Features Modal Triggered")} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Reused Header Component */}
        <Header onToggleSidebar={() => setSidebarOpen(true)} />

        {/* Page Header Bar */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs shrink-0">
          <div>
            <h1 className="text-xl font-bold text-gray-800">eSignature & Form Builder</h1>
            <p className="text-xs text-gray-500">Manage reusable templates, field mapping, and execution logs.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBuilderOpen(true)}
              style={{ backgroundColor: primaryColor }}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition shadow-sm"
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-8 shrink-0">
          <button
            onClick={() => setActiveTab('templates')}
            style={activeTab === 'templates' ? { borderColor: primaryColor, color: primaryColor } : undefined}
            className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'templates'
                ? ''
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} />
            Form Templates & Layouts
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            style={activeTab === 'requests' ? { borderColor: primaryColor, color: primaryColor } : undefined}
            className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? ''
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <PenTool size={16} />
            Signature Requests & Submissions
          </button>
        </div>

        {/* Dashboard Dynamic Body */}
        <main className="flex-1 overflow-y-auto p-6 bg-gray-100">
          {activeTab === 'templates' ? (
            <FormTemplateList 
              isBuilderOpen={isBuilderOpen} 
              onOpenBuilder={() => setIsBuilderOpen(true)}
              onCloseBuilder={() => setIsBuilderOpen(false)} 
            />
          ) : (
            <SignatureRequestsList />
          )}
        </main>
      </div>
    </div>
  );
}