'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

import FormTemplateList from '../../components/esignature/FormTemplateList';
import SignatureRequestsList from '../../components/esignature/SignatureRequestsList';

import { Menu, FileText, PenTool, Plus } from 'lucide-react';

export default function ESignatureDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'templates' | 'requests'>('templates');
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);

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
        {/* Top Navbar Header */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="md:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            <div>
              <h1 className="text-xl font-bold text-gray-800">eSignature & Form Builder</h1>
              <p className="text-xs text-gray-500">Manage reusable templates, field mapping, and execution logs.</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsBuilderOpen(true)}
              className="flex items-center gap-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
            >
              <Plus size={16} />
              Create Template
            </button>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <div className="bg-white border-b border-gray-200 px-6 flex gap-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'templates'
                ? 'border-[#7C3AED] text-[#7C3AED]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText size={16} />
            Form Templates & Layouts
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-3 text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'requests'
                ? 'border-[#7C3AED] text-[#7C3AED]'
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