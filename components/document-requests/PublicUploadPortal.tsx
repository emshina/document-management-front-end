'use client';
import { useState, useEffect } from 'react';
import { Upload, FileText, CheckCircle2, ChevronLeft, ChevronRight, User, X, Eye, AlertCircle } from 'lucide-react';
import { apiCall } from '@/lib/api';

interface RequestItem {
  id: string | number;
  document_title_requested: string;
  required: boolean;
  type?: string;
  formId?: string | number;
  form_id?: string | number;
  form?: string | number | { id: string | number };
  is_uploaded?: boolean;
  is_submitted?: boolean; // Added to track if an interactive form has been filled/submitted
  fulfilled_document?: {
    file?: string;
  } | null;
  form_response?: any; // Added to support backend form response check
  file_url?: string;
  status?: string;
}

interface DocumentRequestData {
  id: string | number;
  subject: string;
  message: string;
  recipient_name: string;
  recipient_email: string;
  sender_email?: string;
  completed: boolean;
  items: RequestItem[];
}

interface PublicUploadPortalProps {
  token: string;
}

export default function PublicUploadPortal({ token }: PublicUploadPortalProps) {
  const [requestData, setRequestData] = useState<DocumentRequestData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const [stagedFiles, setStagedFiles] = useState<{ [key: string | number]: File }>({});
  const [stagedPreviews, setStagedPreviews] = useState<{ [key: string | number]: string }>({});

  const [submittingFinal, setSubmittingFinal] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Function to fetch portal data (extracted so it can be called on window focus/return)
  const fetchPortalData = async () => {
    try {
      const data = await apiCall(`/v1/document-requests/public/${token}/`, { requiresAuth: false });
      
      // Check if URL has a form_completed indicator left behind by the form filler page
      const params = new URLSearchParams(window.location.search);
      const completedFormId = params.get('form_completed');

      if (completedFormId && data && data.items) {
        data.items = data.items.map((item: RequestItem) => {
          const resolvedFormId = item?.formId || item?.form_id || (typeof item?.form === 'object' ? item?.form?.id : item?.form);
          if (String(item.id) === String(completedFormId) || String(resolvedFormId) === String(completedFormId)) {
            return {
              ...item,
              is_submitted: true,
              form_response: { submitted: true }
            };
          }
          return item;
        });
      }

      setRequestData(data);
      setIsCompleted(data?.completed || false);
    } catch (error) {
      console.error('Failed to load document request portal:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchPortalData();

      // Clean up the query param from the URL bar cleanly without refreshing the page
      const params = new URLSearchParams(window.location.search);
      if (params.has('form_completed')) {
        params.delete('form_completed');
        const newSearch = params.toString();
        const newPath = window.location.pathname + (newSearch ? `?${newSearch}` : '');
        window.history.replaceState({}, '', newPath);
      }
    }
  }, [token]);

  // Automatically refresh data when user switches back to this tab (e.g. returning from filling out a form)
  useEffect(() => {
    const handleFocus = () => {
      if (token) {
        fetchPortalData();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && requestData) {
      const file = e.target.files[0];
      const currentItem = requestData.items[currentIndex];
      const itemId = currentItem.id;

      if (stagedPreviews[itemId]) {
        URL.revokeObjectURL(stagedPreviews[itemId]);
      }

      const previewUrl = URL.createObjectURL(file);

      setStagedFiles((prev) => ({ ...prev, [itemId]: file }));
      setStagedPreviews((prev) => ({ ...prev, [itemId]: previewUrl }));
    }
  };

  const handleRemoveStagedFile = (itemId: string | number) => {
    if (stagedPreviews[itemId]) {
      URL.revokeObjectURL(stagedPreviews[itemId]);
    }
    setStagedFiles((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
    setStagedPreviews((prev) => {
      const copy = { ...prev };
      delete copy[itemId];
      return copy;
    });
  };

  const handleFinishRequest = async () => {
    if (!requestData) return;

    // Validate ALL required items (both file uploads/forms) before final submission
    for (const item of requestData.items) {
      const resolvedFormId = item?.formId || item?.form_id || (typeof item?.form === 'object' ? item?.form?.id : item?.form);
      
      const isUploadedBool = Boolean(item.is_uploaded || item.fulfilled_document);
      const isFormSubmittedBool = Boolean(item.is_submitted || item.form_response);
      
      const hasUploaded = (isUploadedBool || isFormSubmittedBool) && item.status !== 'rejected';
      const hasStaged = Boolean(stagedFiles[item.id]);

      if (item.required && !hasUploaded && !hasStaged) {
        alert(`Please fulfill the required item: "${item.document_title_requested}"`);
        return;
      }
    }

    setSubmittingFinal(true);
    try {
      // Upload any staged individual files first
      for (const [itemId, fileObj] of Object.entries(stagedFiles)) {
        const formData = new FormData();
        formData.append('file', fileObj);
        formData.append('item_id', String(itemId));

        await apiCall(`/v1/document-requests/public/${token}/upload/`, {
          requiresAuth: false,
          method: 'POST',
          body: formData,
        });
      }

      // Finalize the overall batch request bundle
      await apiCall(`/v1/document-requests/public/${token}/submit/`, {
        requiresAuth: false,
        method: 'POST',
      });

      setIsCompleted(true);
    } catch (error) {
      console.error('Final submission failed:', error);
      alert('Failed to finalize submission. Please try again.');
    } finally {
      setSubmittingFinal(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500 text-sm">
        Loading document portal...
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-red-500 text-sm">
        Invalid or expired request link.
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl border border-gray-200 p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Submission Complete!</h2>
          <p className="text-sm text-gray-600">
            Thank you. Your onboarding documents have been successfully updated and submitted to the admin team.
          </p>
        </div>
      </div>
    );
  }

  const activeItem = requestData.items[currentIndex];
  const activeStagedFile = activeItem ? stagedFiles[activeItem.id] : undefined;
  const activePreviewUrl = activeItem ? (stagedPreviews[activeItem.id] || activeItem.file_url || activeItem.fulfilled_document?.file) : undefined;
  const isRejected = activeItem?.status === 'rejected';
  
  const isUploadedBool = Boolean(activeItem?.is_uploaded || activeItem?.fulfilled_document);
  const isFormSubmittedBool = Boolean(activeItem?.is_submitted || activeItem?.form_response);

  // Safely resolve form identifier
  const resolvedFormId = activeItem?.formId || activeItem?.form_id || (typeof activeItem?.form === 'object' ? activeItem?.form?.id : activeItem?.form);
  const isInteractiveForm = activeItem?.type === 'form' || Boolean(resolvedFormId);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-between p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto w-full mb-4 flex items-center justify-between text-xs text-gray-600">
        <div className="flex items-center gap-1.5 font-medium text-primary">
          <User size={14} /> {requestData.sender_email || 'ict@cdl.africa'}
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-6">
        
        {/* Left Pane */}
        <div className="lg:col-span-2 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <h1 className="text-xl font-bold text-primary">{requestData.subject}</h1>
            <div className="text-sm text-gray-700 space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100 whitespace-pre-line">
              <p>Dear {requestData.recipient_name},</p>
              <p>{requestData.message}</p>
              <p className="pt-2">Regards,<br />Admin Team</p>
            </div>
          </div>

          {/* Active Upload / Form Dropzone Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800">Requested Items:</h3>
              <span className="text-xs text-gray-500">Item {currentIndex + 1} of {requestData.items.length}</span>
            </div>

            <div className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[260px] relative ${
              isRejected ? 'border-red-300 bg-red-50/40' : 'border-primary/40 bg-primary/5'
            }`}>
              <div className="absolute top-4 flex flex-col items-center">
                <span className="text-sm font-semibold text-gray-900">
                  {activeItem?.document_title_requested} {activeItem?.required && <span className="text-red-500">*</span>}
                </span>
                {isRejected && (
                  <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-red-100 text-red-700 text-xs font-semibold rounded-md">
                    <AlertCircle size={12} /> Previously Rejected - Re-action Required
                  </span>
                )}
              </div>

              {isInteractiveForm ? (
                <div className="space-y-3 flex flex-col items-center mt-8 w-full max-w-sm">
                  <div className="p-3 bg-primary/10 text-primary rounded-full">
                    <FileText size={24} />
                  </div>
                  <p className="text-xs text-gray-700 font-medium">
                    {isFormSubmittedBool 
                      ? 'You have successfully filled out this form!' 
                      : 'This is an interactive form requirement. Please fill it out using the link below.'}
                  </p>
                  {/* Updated Link: passes request_token, item_id, and return_url with form_completed query flag */}
                  <a
                    href={`/forms/fill/${resolvedFormId}?request_token=${token}&item_id=${activeItem.id}&return_url=${encodeURIComponent(window.location.pathname + '?form_completed=' + activeItem.id)}`}
                    className="px-4 py-2 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-xs font-semibold transition shadow-sm"
                  >
                    {isFormSubmittedBool ? 'Edit / View Form Response' : 'Open & Fill Out Form'}
                  </a>
                  {isFormSubmittedBool && (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-semibold">
                      <CheckCircle2 size={14} /> Completed
                    </span>
                  )}
                </div>
              ) : (isUploadedBool && !isRejected) || activeStagedFile ? (
                <div className="space-y-3 flex flex-col items-center mt-8 w-full max-w-xs">
                  <div className="p-3 bg-green-100 text-green-600 rounded-full">
                    <CheckCircle2 size={24} />
                  </div>
                  <p className="text-xs text-green-700 font-medium truncate w-full">
                    {activeStagedFile ? activeStagedFile.name : 'Attached & Ready for Submission'}
                  </p>

                  <div className="flex items-center gap-2 w-full justify-center">
                    {activePreviewUrl && (
                      <a
                        href={activePreviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs"
                      >
                        <Eye size={13} /> Preview
                      </a>
                    )}
                    {(activeStagedFile || (isRejected && isUploadedBool)) && (
                      <button
                        onClick={() => handleRemoveStagedFile(activeItem.id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg text-xs font-medium text-red-600 hover:bg-red-100 transition"
                      >
                        <X size={13} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <label className="cursor-pointer flex flex-col items-center space-y-3 mt-8">
                  <div className={`p-3 rounded-full shadow-sm ${isRejected ? 'bg-white text-red-600' : 'bg-white text-primary'}`}>
                    <Upload size={28} />
                  </div>
                  <span className="text-xs text-gray-500">
                    {isRejected ? 'Click to upload a corrected version of this document' : 'Click here or drag file to attach'}
                  </span>
                  <input type="file" className="hidden" onChange={handleFileChange} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar Checklist Pane */}
        <div className="bg-gray-50/50 rounded-xl border border-gray-200 p-4 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-900 border-b border-gray-200 pb-3 mb-3 flex items-center gap-2">
              <FileText size={16} className="text-primary" /> Checklist ({requestData.items.length})
            </h3>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {requestData.items.map((item, idx) => {
                const isStaged = Boolean(stagedFiles[item.id]);
                const isItemRejected = item.status === 'rejected';
                
                const itemUploadedBool = Boolean(item.is_uploaded || item.fulfilled_document);
                const itemFormSubmittedBool = Boolean(item.is_submitted || item.form_response);
                
                const isDone = ((itemUploadedBool || itemFormSubmittedBool) && !isItemRejected) || isStaged;

                return (
                  <div
                    key={item.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                      currentIndex === idx
                        ? 'bg-primary/10 border-primary text-primary shadow-xs'
                        : 'bg-white border-gray-200 hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold flex items-center gap-1.5">
                        <FileText size={12} className={currentIndex === idx ? 'text-primary' : 'text-gray-400'} />
                        {item.document_title_requested}
                      </div>
                      {isItemRejected ? (
                        <span className="text-[10px] text-red-600 font-semibold mt-0.5 block">Rejected</span>
                      ) : item.required ? (
                        <span className="text-[10px] text-primary/80 font-medium mt-0.5 block italic">Required</span>
                      ) : null}
                    </div>
                    {isDone ? (
                      <CheckCircle2 size={14} className="text-green-600 shrink-0" />
                    ) : isItemRejected ? (
                      <AlertCircle size={14} className="text-red-600 shrink-0" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Action Footer Control Bar */}
      <div className="max-w-7xl mx-auto w-full mt-6 flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={handleFinishRequest}
            disabled={submittingFinal}
            className="px-5 py-2.5 bg-primary hover:opacity-90 text-primary-foreground rounded-lg text-xs font-semibold transition shadow-sm disabled:opacity-50"
          >
            {submittingFinal ? 'Uploading & Submitting...' : 'Finish Request'}
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1"
          >
            <ChevronLeft size={14} /> Back
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(requestData.items.length - 1, prev + 1))}
            disabled={currentIndex === requestData.items.length - 1}
            className="px-4 py-2 border border-gray-300 rounded-lg text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 transition flex items-center gap-1"
          >
            Next Item <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}