'use client';
import { useState, useEffect } from 'react';
import { X, Folder, Heart, Lock, Trash2, Sliders, FolderTree, FileCode, Mail, FileText, PenTool, Workflow, FileSpreadsheet, Shield, Users, Users2, Link2, Settings, UserCog, Search, Globe, Wrench, BarChart3 } from 'lucide-react';
import { apiCall } from '@/lib/api';

interface AllFeaturesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AllFeaturesModal({ isOpen, onClose }: AllFeaturesModalProps) {
  const [primaryColor, setPrimaryColor] = useState('#2D1B4E');

  // Fetch tenant effective primary color for brand consistency
  useEffect(() => {
    if (!isOpen) return;
    apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
      .then((data) => {
        if (!data) return;
        const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
        if (tenantObj?.effective_primary_color) {
          setPrimaryColor(tenantObj.effective_primary_color);
        }
      })
      .catch((err) => console.error('Error loading brand color for modal:', err));
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-4xl max-h-[90vh] rounded-xl shadow-2xl overflow-y-auto relative animate-in fade-in zoom-in duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-base font-bold text-gray-800">All Features</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={20} />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-8 bg-gray-50/50">
          
          {/* Documents Column */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Documents</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Folder size={16} /> Documents</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Heart size={16} /> My Favorites</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Lock size={16} /> Checked Out</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Trash2 size={16} /> Recycle Bin</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Sliders size={16} /> File Processing Queue</li>
            </ul>
          </div>

          {/* Work Column */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Work</h3>
            <ul className="space-y-3 text-sm text-gray-700">
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><FolderTree size={16} /> Folder Templates</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><FileCode size={16} /> Metadata</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Mail size={16} /> Email Imports</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><FileText size={16} /> Document Requests</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><PenTool size={16} /> eSignature</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Workflow size={16} /> Workflow</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><FileSpreadsheet size={16} /> Forms</li>
              <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Shield size={16} /> Governance</li>
            </ul>
          </div>

          {/* People & Account Column */}
          <div className="space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">People</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Users size={16} /> Users</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Users2 size={16} /> Groups</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Link2 size={16} /> Public Access Links</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Account</h3>
              <ul className="space-y-3 text-sm text-gray-700">
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Settings size={16} /> Audit Logs</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><UserCog size={16} /> Account Settings</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Settings size={16} /> My Settings</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Shield size={16} /> Security Policies</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Search size={16} /> Search</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Globe size={16} /> Salesforce Integration</li>
                <li style={{ '--hover-color': primaryColor } as React.CSSProperties} className="flex items-center gap-3 hover:text-[var(--hover-color)] cursor-pointer transition"><Wrench size={16} /> Utilities</li>
              </ul>
            </div>
          </div>

        </div>

        {/* Modal Footer Banner */}
        <div className="bg-gray-100 px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-600 text-center sm:text-left">
            <span className="font-bold">There&apos;s more to Revver!</span>
            <p className="text-gray-500">Talk to your account&apos;s admin to activate these features.</p>
          </div>
          <button 
            style={{ color: primaryColor }}
            className="flex items-center gap-2 text-xs font-semibold hover:underline transition"
          >
            <BarChart3 size={14} /> Revver Reports
          </button>
        </div>

      </div>
    </div>
  );
}