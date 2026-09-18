'use client';

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiCall } from '@/lib/api';

import { StepOneDetailsRecipients } from './components/StepOneDetailsRecipients';
import { useTenant } from '@/hooks/useTenant';

interface EnvelopeEditViewProps {
  envelopeId: string;
  onBack: () => void;
}

export default function EnvelopeEditView({ envelopeId, onBack }: EnvelopeEditViewProps) {
  const { primaryColor } = useTenant();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states mapping to StepOneDetailsRecipients props
  const [documentName, setDocumentName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sendInOrder, setSendInOrder] = useState(false);
  const [recipients, setRecipients] = useState<any[]>([]);

  const validatorRef = useRef<(() => boolean) | null>(null);

  useEffect(() => {
    if (!envelopeId) return;

    const fetchEnvelope = async () => {
      try {
        setLoading(true);
        const data = await apiCall(`/v1/esignature/envelopes/${envelopeId}/`, {
          method: 'GET',
          requiresAuth: true,
        });

        setDocumentName(data.title || data.documentName || '');
        setSendInOrder(data.send_in_order || data.sendInOrder || false);
        
        // Map recipients to your standard constant structure
        const mappedRecipients = (data.recipients || []).map((r: any, idx: number) => ({
          id: r.id || String(idx + 1),
          signer_name: r.signer_name || r.name || '',
          signer_email: r.signer_email || r.email || '',
          action_type: r.action_type || 'needs_to_sign',
          signing_order: r.signing_order || idx + 1,
        }));
        setRecipients(mappedRecipients);

        // 👉 FIX: Always assign a placeholder file representation so the step validator passes right away on load
        setUploadedFiles([
          { name: data.document_name || data.file_name || 'Existing-Document.pdf' } as File
        ]);
      } catch (err: any) {
        setError(err.message || 'Failed to load envelope details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnvelope();
  }, [envelopeId]);

  // Handlers matching StepOneProps
  const handleFilesUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFileAtIndex = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const addRecipient = () => {
    setRecipients(prev => [
      ...prev,
      {
        id: String(Date.now()),
        signer_name: '',
        signer_email: '',
        action_type: 'needs_to_sign',
        signing_order: prev.length + 1,
      }
    ]);
  };

  const removeRecipient = (index: number) => {
    setRecipients(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((r, idx) => ({ ...r, signing_order: idx + 1 }));
    });
  };

  const getRecipientColor = (id: string) => {
    // Basic color palette selector for recipient badges
    return { badge: '#3b82f6' };
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (validatorRef.current && !validatorRef.current()) {
      return; // Stop if validation fails inside the component
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiCall(`/v1/esignature/envelopes/${envelopeId}/update-details/`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({
          title: documentName,
          send_in_order: sendInOrder,
          recipients: recipients.map(r => ({
            id: r.id.length > 10 ? undefined : r.id, // handle new vs existing IDs
            signer_name: r.signer_name,
            signer_email: r.signer_email,
            action_type: r.action_type,
            signing_order: r.signing_order
          }))
        }),
      });

      setSuccess('Envelope updated successfully!');
      setTimeout(() => {
        onBack();
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Failed to update envelope.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 text-sm">Loading envelope configuration...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Requests
        </button>
        <h1 className="text-base font-bold text-gray-800">Edit Signature Request</h1>
      </div>

      {error && (
        <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg flex items-center gap-2 border border-red-200">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-50 text-green-700 text-xs rounded-lg flex items-center gap-2 border border-green-200">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Render your exact StepOne UI component */}
        <StepOneDetailsRecipients
          primaryColor={primaryColor}
          documentName={documentName}
          setDocumentName={setDocumentName}
          uploadedFiles={uploadedFiles}
          handleFilesUpload={handleFilesUpload}
          removeFileAtIndex={removeFileAtIndex}
          isMerging={false}
          sendInOrder={sendInOrder}
          setSendInOrder={setSendInOrder}
          recipients={recipients}
          setRecipients={setRecipients}
          addRecipient={addRecipient}
          removeRecipient={removeRecipient}
          getRecipientColor={getRecipientColor}
          onValidateReady={(validator) => {
            validatorRef.current = validator;
          }}
        />

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onBack}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            style={{ backgroundColor: primaryColor }}
            className="flex items-center gap-2 text-white px-5 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition disabled:opacity-50 shadow-sm"
          >
            <Save size={16} />
            {saving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}