'use client';
import { useState, useEffect } from 'react';
import { X, Play, Loader2, FolderTree } from 'lucide-react';
import { apiCall } from '@/lib/api';

interface FolderTemplate {
  id: string;
  name: string;
  description: string;
}

interface FolderTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;       // Cabinet ID or Folder ID
  targetType: string;     // 'cabinet' or 'folder'
  themeColor: string;
}

export default function FolderTemplateModal({ isOpen, onClose, targetId, targetType, themeColor }: FolderTemplateModalProps) {
  const [templates, setTemplates] = useState<FolderTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/v1/documents/folder-templates/', { requiresAuth: true });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setTemplates(list);
      if (list.length > 0) setSelectedTemplateId(list[0].id);
    } catch (err) {
      console.error('Failed to load templates:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplateId) return;

    try {
      setSubmitting(true);
      const payload: Record<string, any> = {};
      if (targetType === 'cabinet') {
        payload.cabinet_id = targetId;
      } else {
        payload.parent_folder_id = targetId;
      }

      await apiCall(`/v1/documents/folder-templates/${selectedTemplateId}/apply/`, {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(payload),
      });

      alert('Folder template applied and populated successfully!');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Failed to apply template.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FolderTree size={20} style={{ color: themeColor }} />
            <h3 className="text-lg font-bold text-gray-900">Apply Folder Template</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Select a predefined template blueprint to instantly populate sub-folders into this {targetType}.
        </p>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-xs text-gray-400 gap-2">
            <Loader2 size={16} className="animate-spin" style={{ color: themeColor }} /> Loading templates...
          </div>
        ) : templates.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">No folder templates available.</p>
        ) : (
          <form onSubmit={handleApply} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Select Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none"
                style={{ borderColor: themeColor }}
              >
                {templates.map((tmpl) => (
                  <option key={tmpl.id} value={tmpl.id}>
                    {tmpl.name} {tmpl.description ? `- ${tmpl.description}` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm"
                style={{ backgroundColor: themeColor }}
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : <Play size={14} />} 
                {submitting ? 'Applying...' : 'Apply Template'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}