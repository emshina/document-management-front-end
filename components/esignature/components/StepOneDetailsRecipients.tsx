import React, { useState, useEffect } from 'react';
import { Upload, Trash2, Plus, GripVertical, AlertCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { Recipient } from '../constants/esignatureConstants';

interface StepOneProps {
  primaryColor: string;
  documentName: string;
  setDocumentName: (name: string) => void;
  uploadedFiles: File[];
  handleFilesUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFileAtIndex: (index: number) => void;
  isMerging: boolean;
  sendInOrder: boolean;
  setSendInOrder: (val: boolean) => void;
  recipients: Recipient[];
  setRecipients: React.Dispatch<React.SetStateAction<Recipient[]>>;
  addRecipient: () => void;
  removeRecipient: (index: number) => void;
  getRecipientColor: (id: string) => any;
  onValidateReady?: (validator: () => boolean) => void;
}

export function StepOneDetailsRecipients({
  primaryColor,
  documentName,
  setDocumentName,
  uploadedFiles,
  handleFilesUpload,
  removeFileAtIndex,
  isMerging,
  sendInOrder,
  setSendInOrder,
  recipients,
  setRecipients,
  addRecipient,
  removeRecipient,
  getRecipientColor,
  onValidateReady,
}: StepOneProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 👉 Function to move recipient up or down and re-index signing_order automatically
  const moveRecipient = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= recipients.length) return;

    const updated = [...recipients];
    const [movedItem] = updated.splice(index, 1);
    updated.splice(targetIndex, 0, movedItem);

    // Re-index signing_order dynamically based on new position
    const reindexed = updated.map((rec, idx) => ({
      ...rec,
      signing_order: idx + 1,
    }));

    setRecipients(reindexed);
  };

  // Comprehensive validation check for documents and recipient emails
  const validateStep = (): boolean => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      setErrorMessage('Please attach at least one document or file to proceed.');
      return false;
    }

    if (!recipients || recipients.length === 0) {
      setErrorMessage('Please configure at least one recipient.');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (let i = 0; i < recipients.length; i++) {
      const email = recipients[i].signer_email ? recipients[i].signer_email.trim() : '';
      
      if (!email) {
        setErrorMessage(`Recipient #${i + 1} is missing an email address.`);
        return false;
      }
      
      if (!emailRegex.test(email)) {
        setErrorMessage(`Recipient #${i + 1} has an invalid email format (${email}).`);
        return false;
      }
    }

    setErrorMessage(null);
    return true;
  };

  useEffect(() => {
    if (onValidateReady) {
      onValidateReady(validateStep);
    }
  }, [uploadedFiles, recipients]);

  return (
    <div className="space-y-6 bg-white p-6 rounded-xl border border-gray-200 shadow-xs">
      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg animate-fadeIn">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 flex flex-col items-center justify-center relative hover:bg-gray-100 transition">
          <input
            type="file"
            multiple
            accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
            onChange={(e) => {
              setErrorMessage(null);
              handleFilesUpload(e);
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <Upload className="text-gray-400 mb-2" size={36} />
          <p className="text-xs font-semibold text-gray-700 mb-1">
            {uploadedFiles.length > 0 ? `${uploadedFiles.length} file(s) attached` : 'Drag documents here'}
          </p>
          <span className="text-xs text-gray-400 mb-3">or</span>
          <span style={{ backgroundColor: primaryColor }} className="px-3 py-1.5 text-white text-xs font-medium rounded-md shadow-xs">
            {isMerging ? 'Processing...' : 'Browse Files'}
          </span>
        </div>

        <div className="md:col-span-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">
              Document / Envelope Title
            </label>
            <input
              type="text"
              value={documentName}
              onChange={(e) => setDocumentName(e.target.value)}
              placeholder="e.g. Employee Onboarding Agreement"
              className="w-full px-3 py-2 text-sm text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
            />
          </div>

          {uploadedFiles.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs font-medium text-gray-500">Attached files:</span>
              <div className="space-y-1 max-h-24 overflow-y-auto">
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-50 px-2.5 py-1 rounded border border-gray-200 text-xs">
                    <span className="truncate text-gray-700">{file.name}</span>
                    <button type="button" onClick={() => removeFileAtIndex(idx)} className="text-gray-400 hover:text-red-600">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={sendInOrder}
                onChange={(e) => setSendInOrder(e.target.checked)}
                className="sr-only peer"
              />
              <div
                style={{ backgroundColor: sendInOrder ? primaryColor : undefined }}
                className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"
              />
            </label>
            <span className="text-xs font-semibold text-gray-800">Send in sequential order</span>
          </div>
        </div>
      </div>

      <hr className="border-gray-200" />

      <div className="space-y-4">
        <h3 className="text-sm font-bold text-gray-800">Configure Recipients</h3>

        <div className="space-y-3">
          {recipients.map((recipient, index) => {
            const color = getRecipientColor(recipient.id);
            return (
              <div key={recipient.id} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between sm:justify-start gap-2">
                  <div className="text-gray-400 flex flex-col gap-0.5">
                    {/* 👉 Reordering Controls */}
                    <button 
                      type="button" 
                      disabled={index === 0} 
                      onClick={() => moveRecipient(index, 'up')}
                      className="hover:text-blue-600 disabled:opacity-20 transition"
                      title="Move Up"
                    >
                      <ArrowUp size={12} />
                    </button>
                    <button 
                      type="button" 
                      disabled={index === recipients.length - 1} 
                      onClick={() => moveRecipient(index, 'down')}
                      className="hover:text-blue-600 disabled:opacity-20 transition"
                      title="Move Down"
                    >
                      <ArrowDown size={12} />
                    </button>
                  </div>

                  <span style={{ backgroundColor: color.badge, color: '#ffffff' }} className="w-6 h-6 flex items-center justify-center rounded text-xs font-bold">
                    {recipient.signing_order}
                  </span>
                </div>

                <input
                  type="email"
                  placeholder="Email address"
                  value={recipient.signer_email}
                  onChange={(e) => {
                    setErrorMessage(null);
                    const updated = [...recipients];
                    updated[index].signer_email = e.target.value;
                    setRecipients(updated);
                  }}
                  className="flex-1 px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none"
                />

                <input
                  type="text"
                  placeholder="Full Name"
                  value={recipient.signer_name}
                  onChange={(e) => {
                    const updated = [...recipients];
                    updated[index].signer_name = e.target.value;
                    setRecipients(updated);
                  }}
                  className="w-full sm:w-48 px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none"
                />

                <select
                  value={recipient.action_type}
                  onChange={(e) => {
                    const updated = [...recipients];
                    updated[index].action_type = e.target.value;
                    setRecipients(updated);
                  }}
                  className="w-full sm:w-44 px-3 py-1.5 text-sm text-gray-900 bg-white border border-gray-300 rounded-md focus:outline-none"
                >
                  <option value="needs_to_sign">Needs to sign</option>
                  <option value="in_person_signer">In-person signer</option>
                  <option value="signs_with_witness">Signs with witness</option>
                  <option value="manages_recipients">Manages recipients</option>
                  <option value="approver">Approver</option>
                </select>

                <button
                  type="button"
                  onClick={() => removeRecipient(index)}
                  disabled={recipients.length <= 1}
                  className="self-end sm:self-center p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-30 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addRecipient}
          style={{ color: primaryColor }}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-emerald-50 border border-emerald-200 rounded-md hover:bg-emerald-100 transition"
        >
          <Plus size={14} /> Add recipient
        </button>
      </div>
    </div>
  );
}