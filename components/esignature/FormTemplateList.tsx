'use client';

import { useState, useEffect } from 'react';
import { FileText, Plus, User, Edit3, Clock, Layers } from 'lucide-react';
import { apiCall } from '@/lib/api';
import FormTemplateBuilder from './FormTemplateBuilder';

interface FormTemplateListProps {
  isBuilderOpen: boolean;
  onOpenBuilder: () => void;
  onCloseBuilder: () => void;
}

export default function FormTemplateList({ isBuilderOpen, onOpenBuilder, onCloseBuilder }: FormTemplateListProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/v1/esignature/form-templates/', {
        requiresAuth: true,
      });
      setTemplates(data.results || data);
    } catch (error: any) {
      console.error('Failed to load form templates:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenForCreate = () => {
    setEditingTemplate(null);
    onOpenBuilder();
  };

  const handleOpenForEdit = (tpl: any) => {
    setEditingTemplate(tpl);
    onOpenBuilder();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Form Templates & Layout Builder</h2>
          <p className="text-sm text-gray-500 mt-0.5">Manage reusable contract templates, upload documents, and position fields.</p>
        </div>
        <button
          onClick={handleOpenForCreate}
          className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
        >
          <Plus size={18} />
          Create New Template
        </button>
      </div>

      {loading ? (
        <div className="text-center py-16 text-gray-400 font-medium">Loading templates...</div>
      ) : templates.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border-2 border-dashed border-gray-200 shadow-xs">
          <FileText size={48} className="mx-auto text-gray-300 mb-3" />
          <h3 className="text-base font-bold text-gray-800">No Form Templates Found</h3>
          <p className="text-sm text-gray-500 mt-1 mb-6">Create your first interactive document template layout.</p>
          <button
            onClick={handleOpenForCreate}
            className="bg-[#7C3AED] text-white px-5 py-2.5 rounded-xl text-sm font-medium inline-flex items-center gap-2 shadow-sm"
          >
            <Plus size={16} /> Get Started
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((tpl) => (
            <div key={tpl.id} className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-xs hover:shadow-md transition flex flex-col justify-between group">
              <div>
                <div className="flex justify-between items-start gap-3 mb-2">
                  <h3 className="font-bold text-gray-900 text-base group-hover:text-[#7C3AED] transition line-clamp-1">{tpl.title}</h3>
                  <span className="px-2.5 py-1 text-xs rounded-full font-semibold bg-purple-50 text-purple-700 shrink-0 flex items-center gap-1">
                    <Layers size={12} />
                    {tpl.fields?.length || 0} Fields
                  </span>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 min-h-[32px] mb-4">
                  {tpl.description || 'No description provided for this template.'}
                </p>

                <div className="space-y-1.5 py-3 border-t border-gray-100 text-[11px] text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <User size={13} className="text-gray-400" />
                    <span className="truncate">Created by: <strong className="text-gray-700">{tpl.created_by_email || 'Admin User'}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={13} className="text-gray-400" />
                    <span>Created: <strong className="text-gray-700">{tpl.created_at ? new Date(tpl.created_at).toLocaleDateString() : 'N/A'}</strong></span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenForEdit(tpl)}
                  className="w-full bg-purple-50 hover:bg-purple-100 text-[#7C3AED] font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition"
                >
                  <Edit3 size={14} />
                  Open & Edit Layout
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Extracted Interactive Form Template Builder Component */}
      <FormTemplateBuilder
        isOpen={isBuilderOpen}
        onClose={onCloseBuilder}
        onSaveSuccess={fetchTemplates}
        editingTemplate={editingTemplate}
        apiCall={apiCall}
      />
    </div>
  );
}