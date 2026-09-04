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

  // Called after the template has been successfully applied
  // so the parent can immediately refresh its contents.
  onSuccess?: () => void | Promise<void>;
}

export default function FolderTemplateModal({
  isOpen,
  onClose,
  targetId,
  targetType,
  themeColor,
  onSuccess,
}: FolderTemplateModalProps) {
  const [templates, setTemplates] = useState<FolderTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);

  /**
   * Load available folder templates whenever the modal opens.
   */
  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);

      const data = await apiCall(
        '/v1/documents/folder-templates/',
        {
          requiresAuth: true,
        }
      );

      const list: FolderTemplate[] = Array.isArray(data)
        ? data
        : data?.results || [];

      setTemplates(list);

      // Automatically select the first template.
      if (list.length > 0) {
        setSelectedTemplateId(list[0].id);
      } else {
        setSelectedTemplateId('');
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
      setTemplates([]);
      setSelectedTemplateId('');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Apply the selected template to the current cabinet/folder.
   *
   * Important:
   * The API call must finish first.
   * Once it succeeds, onSuccess() tells DocumentContentArea
   * to immediately reload the current folder contents.
   */
  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTemplateId) {
      alert('Please select a folder template.');
      return;
    }

    if (!targetId) {
      alert('No target folder or cabinet was selected.');
      return;
    }

    try {
      setSubmitting(true);

      const payload: Record<string, string> = {};

      if (targetType === 'cabinet') {
        payload.cabinet_id = targetId;
      } else {
        payload.parent_folder_id = targetId;
      }

      console.log('Applying folder template:', {
        templateId: selectedTemplateId,
        targetId,
        targetType,
        payload,
      });

      /**
       * Wait for Django to finish creating all folder instances.
       */
      await apiCall(
        `/v1/documents/folder-templates/${selectedTemplateId}/apply/`,
        {
          method: 'POST',
          requiresAuth: true,
          body: JSON.stringify(payload),
        }
      );

      console.log('Folder template applied successfully.');

      /**
       * VERY IMPORTANT:
       *
       * Tell DocumentContentArea to refresh immediately.
       *
       * Because the API request above has already completed,
       * the newly created folder instances should now be available
       * when loadContents() runs.
       */
      await onSuccess?.();

      /**
       * Close the modal only after the parent has refreshed.
       */
      onClose();

      alert('Folder template applied and populated successfully!');
    } catch (err: any) {
      console.error('Failed to apply folder template:', err);

      alert(
        err?.message ||
        'Failed to apply folder template. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <FolderTree
              size={20}
              style={{ color: themeColor }}
            />

            <h3 className="text-lg font-bold text-gray-900">
              Apply Folder Template
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 mb-4">
          Select a predefined template blueprint to instantly populate
          sub-folders into this {targetType}.
        </p>

        {/* Loading Templates */}
        {loading ? (
          <div className="flex items-center justify-center py-10 text-xs text-gray-400 gap-2">
            <Loader2
              size={16}
              className="animate-spin"
              style={{ color: themeColor }}
            />

            Loading templates...
          </div>

        ) : templates.length === 0 ? (

          /* No Templates */
          <div className="py-8 text-center">
            <FolderTree
              size={32}
              className="mx-auto mb-3 text-gray-300"
            />

            <p className="text-xs text-gray-400">
              No folder templates available.
            </p>
          </div>

        ) : (

          /* Template Form */
          <form
            onSubmit={handleApply}
            className="space-y-4"
          >

            {/* Template Selection */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">
                Select Template
              </label>

              <select
                value={selectedTemplateId}
                onChange={(e) =>
                  setSelectedTemplateId(e.target.value)
                }
                disabled={submitting}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none disabled:bg-gray-50 disabled:cursor-not-allowed"
                style={{
                  borderColor: themeColor,
                }}
              >
                {templates.map((tmpl) => (
                  <option
                    key={tmpl.id}
                    value={tmpl.id}
                  >
                    {tmpl.name}
                    {tmpl.description
                      ? ` - ${tmpl.description}`
                      : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2 pt-2">

              {/* Cancel */}
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>

              {/* Apply */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  loading ||
                  !selectedTemplateId
                }
                className="px-4 py-2 text-white rounded-lg text-sm font-medium flex items-center gap-1.5 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: themeColor,
                }}
              >
                {submitting ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Play size={14} />
                )}

                {submitting
                  ? 'Applying...'
                  : 'Apply Template'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}