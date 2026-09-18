// C:\Users\allan.muyesu\Desktop\my-app\components\UploadLinkModal.tsx
'use client';
import { useState } from 'react';
import { X, Copy, Check, Link as LinkIcon, Loader2 } from 'lucide-react';
import { apiCall } from '@/lib/api';

interface UploadLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItem: any;
  themeColor: string;
}

export default function UploadLinkModal({ isOpen, onClose, selectedItem, themeColor }: UploadLinkModalProps) {
  const [title, setTitle] = useState(selectedItem?.name ? `${selectedItem.name} Upload` : 'Upload Portal');
  const [expiresAt, setExpiresAt] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const tenantId = selectedItem?.tenant || (typeof window !== 'undefined' ? localStorage.getItem('current_tenant_id') : null);
      const payload: any = {
        title,
        folder: selectedItem?.id,
        is_active: true,
      };
      if (tenantId) payload.tenant = tenantId;
      if (expiresAt) payload.expires_at = expiresAt;

      const res = await apiCall('/v1/documents/upload-links/', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(payload),
      });

      setCreatedLink(res);
    } catch (err: any) {
      alert(err.message || 'Failed to create upload link.');
    } finally {
      setLoading(false);
    }
  };

  const fullUploadUrl = createdLink?.token 
    ? `${window.location.origin}/upload/${createdLink.token}`
    : '';

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUploadUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center gap-2">
            <LinkIcon size={18} style={{ color: themeColor }} />
            <h3 className="text-sm font-bold text-gray-800">Create Upload Link</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition">
            <X size={18} />
          </button>
        </div>

        {!createdLink ? (
          <form onSubmit={handleCreate} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Portal Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-1"
                style={{ borderColor: themeColor }}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Expiration Date (Optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full text-xs border border-gray-300 rounded-lg px-3 py-2 outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg shadow transition flex items-center gap-1.5 disabled:opacity-50"
                style={{ backgroundColor: themeColor }}
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                Generate Link
              </button>
            </div>
          </form>
        ) : (
          <div className="p-6 space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800 flex items-center gap-2">
              <Check size={16} className="text-green-600 shrink-0" />
              <span>Upload link generated successfully!</span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Portal URL</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullUploadUrl}
                  className="w-full text-xs bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 outline-none text-gray-700 select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3 py-2 text-xs font-semibold text-white rounded-lg transition flex items-center gap-1 shrink-0"
                  style={{ backgroundColor: themeColor }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-white rounded-lg transition"
                style={{ backgroundColor: themeColor }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}