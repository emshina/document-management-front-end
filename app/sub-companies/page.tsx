'use client';
import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import SubCompanyStructure from '@/components/SubCompanyStructure';
import { apiCall } from '@/lib/api';
import { Menu } from 'lucide-react';

export default function SubCompaniesPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [themeColor, setThemeColor] = useState('#2D1B4E');

  useEffect(() => {
    apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
      .then((data) => {
        if (!data) return;
        const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
        if (tenantObj?.effective_primary_color) {
          setThemeColor(tenantObj.effective_primary_color);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpenAllFeatures={() => {}} 
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            <Menu size={20} />
          </button>
          <span className="text-xs font-bold text-gray-800">Sub-Companies Structure</span>
          <div className="w-8" />
        </header>

        <SubCompanyStructure themeColor={themeColor} />
      </div>
    </div>
  );
}