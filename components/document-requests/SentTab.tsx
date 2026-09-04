'use client';
import { useState, useEffect } from 'react';
import { Send, ChevronLeft, Upload, FileText, CheckCircle2, Clock, Eye, Trash2, XCircle, Code, ShieldAlert, Loader2 } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { useTenant } from '@/hooks/useTenant';

interface SentItemDocument {
  id: string | number;
  document_title_requested: string;
  required: boolean;
  type?: string;
  is_uploaded?: boolean;
  file_url?: string;
  uploaded_at?: string;
  status?: string;
  raw?: any;
}

interface SentItem {
  id: string | number;
  subject: string;
  to: string;
  recipient_name?: string;
  createdOn: string;
  expires: string;
  completed: boolean;
  message?: string;
  items?: SentItemDocument[];
  raw?: any;
}

export default function SentTab() {
  const [requests, setRequests] = useState<SentItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SentItem | null>(null);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [forceUploaded, setForceUploaded] = useState<{ [key: string | number]: boolean }>({});
  
  const { primaryColor } = useTenant();

  const parseRequestList = (list: any[]): SentItem[] => {
    return list.map((item: any) => {
      const rawItems = item.items || [];
      const mappedItems = Array.isArray(rawItems) ? rawItems.map((d: any) => {
        const hasFulfilledDoc = Boolean(d.fulfilled_document);
        const isUploadedFlag = hasFulfilledDoc || d.ocr_status === 'Processed';

        return {
          id: d.id,
          document_title_requested: d.document_title_requested || 'Untitled Document',
          required: d.is_required ?? false,
          type: 'file',
          is_uploaded: isUploadedFlag,
          file_url: d.fulfilled_document ? `/v1/documents/${d.fulfilled_document}/download/` : null,
          uploaded_at: null,
          status: d.status ? d.status.toLowerCase() : (d.ocr_status ? d.ocr_status.toLowerCase() : (hasFulfilledDoc ? 'uploaded' : 'pending')),
          raw: d
        };
      }) : [];

      return {
        id: item.id,
        subject: item.subject || 'Untitled Request',
        to: item.recipient_email || 'N/A',
        recipient_name: item.recipient_name || 'Recipient',
        createdOn: item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent',
        expires: item.expires_at ? new Date(item.expires_at).toLocaleDateString() : 'No Expiry',
        completed: item.status === 'Fulfilled' || item.completed === true,
        message: item.message || '',
        items: mappedItems,
        raw: item
      };
    });
  };

  const fetchSentRequests = async () => {
    try {
      const data = await apiCall('/v1/document-requests/requests/', { requiresAuth: true });
      const list = Array.isArray(data) ? data : (data?.results || []);
      setRequests(parseRequestList(list));
    } catch (error) {
      console.error('Failed to fetch sent document requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSentRequests();
  }, []);

  const handleSelectRequest = async (item: SentItem) => {
    setSelectedRequest(item);
    setSelectedDocIndex(0);
    setIsDetailLoading(true);

    try {
      const detailedData = await apiCall(`/v1/document-requests/requests/${item.id}/`, { requiresAuth: true });
      const parsedList = parseRequestList([detailedData]);
      if (parsedList.length > 0) {
        setSelectedRequest(parsedList[0]);
      }
    } catch (error) {
      console.error('Failed to fetch request details:', error);
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleDocumentAction = async (itemId: string | number, newStatus: 'approved' | 'rejected') => {
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      await apiCall(`/v1/document-requests/requests/${selectedRequest.id}/items/${itemId}/status/`, {
        requiresAuth: true,
        method: 'PATCH',
        body: JSON.stringify({ 
          status: newStatus,
          resend_email: newStatus === 'rejected' 
        }), 
      });

      if (newStatus === 'rejected') {
        alert('Document rejected successfully. A notification email has been triggered for the candidate to re-upload.');
      }

      handleSelectRequest(selectedRequest);
    } catch (error) {
      console.error(`Failed to update status to ${newStatus}:`, error);
      alert(`Failed to update document status. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDocumentFile = async (itemId: string | number) => {
    if (!confirm('Are you sure you want to delete this uploaded file?')) return;
    setActionLoading(true);
    try {
      await apiCall(`/v1/document-requests/requests/${selectedRequest!.id}/items/${itemId}/file/`, {
        requiresAuth: true,
        method: 'DELETE',
      });
      handleSelectRequest(selectedRequest!);
    } catch (error) {
      console.error('Failed to delete document file:', error);
      alert('Failed to delete the uploaded file. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleViewFile = async (fileUrl: string) => {
    try {
      setActionLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      const cleanBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const requestUrl = `${cleanBase.replace(/\/+$/, '')}${fileUrl.startsWith('/') ? fileUrl : `/${fileUrl}`}`;

      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load file: ${response.statusText}`);
      }

      const rawBlob = await response.blob();
      const blob = new Blob([rawBlob], { type: 'application/pdf' });
      const blobUrl = window.URL.createObjectURL(blob);
      
      window.open(blobUrl, '_blank');
    } catch (error) {
      console.error('Failed to securely load file view:', error);
      alert('Could not open file preview. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  if (selectedRequest) {
    const activeDoc = selectedRequest.items?.[selectedDocIndex];
    const isEffectivelyUploaded = activeDoc?.is_uploaded || (activeDoc ? forceUploaded[activeDoc.id] : false);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => {
              setSelectedRequest(null);
              setSelectedDocIndex(0);
              setShowDebug(false);
            }}
            style={{ color: primaryColor }}
            className="flex items-center gap-1.5 text-sm font-medium hover:underline cursor-pointer"
          >
            <ChevronLeft size={16} /> Back to Sent List
          </button>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition cursor-pointer"
            >
              <Code size={12} /> {showDebug ? 'Hide Raw JSON' : 'Inspect Raw Item'}
            </button>
            <span className="text-xs text-gray-500 font-mono">Request ID: #{selectedRequest.id}</span>
          </div>
        </div>

        {showDebug && (
          <div className="bg-gray-900 text-green-400 p-4 rounded-xl text-xs font-mono overflow-x-auto space-y-2 shadow-inner">
            <div className="flex justify-between items-center text-gray-400 font-semibold mb-1">
              <span>Detailed Request Raw Payload:</span>
            </div>
            <pre>{JSON.stringify(selectedRequest.raw, null, 2)}</pre>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
            <div>
              <div 
                style={{ color: primaryColor }}
                className="text-xs font-semibold uppercase tracking-wider mb-1"
              >
                Recipient:
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-800 font-medium">
                <Send size={14} style={{ color: primaryColor }} />
                {selectedRequest.to} ({selectedRequest.recipient_name})
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <h2 className="text-lg font-bold text-gray-900 mb-3">{selectedRequest.subject}</h2>
              <div className="text-sm text-gray-600 space-y-3 whitespace-pre-line bg-gray-50 p-4 rounded-lg border border-gray-100">
                <p>{selectedRequest.message || 'Please review the attached document requirements and upload the requested files accordingly.'}</p>
              </div>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-800">Document Review & Management:</h3>
                <div className="flex items-center gap-2">
                  {activeDoc && (
                    <button
                      onClick={() => setForceUploaded(prev => ({ ...prev, [activeDoc.id]: !prev[activeDoc.id] }))}
                      className="text-[10px] px-2 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded font-medium hover:bg-amber-100 transition flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldAlert size={10} /> {isEffectivelyUploaded ? 'Disable Override' : 'Force Uploaded State'}
                    </button>
                  )}
                  {activeDoc?.status && (
                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-semibold uppercase tracking-wide ${
                      activeDoc.status === 'approved' 
                        ? 'bg-green-100 text-green-700' 
                        : activeDoc.status === 'rejected' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-purple-100 text-purple-700'
                    }`}>
                      {activeDoc.status}
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-gray-50/50 border border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-center min-h-[240px]">
                {isDetailLoading ? (
                  <div className="flex flex-col items-center gap-2" style={{ color: primaryColor }}>
                    <Loader2 size={24} className="animate-spin" />
                    <span className="text-xs font-medium">Loading uploaded documents...</span>
                  </div>
                ) : isEffectivelyUploaded ? (
                  <div className="space-y-4 w-full max-w-sm">
                    <div className="p-3 bg-green-100 text-green-600 rounded-full shadow-sm mx-auto w-fit">
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        {activeDoc?.document_title_requested}
                      </h4>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Fulfilled Document ID: <span className="font-mono text-gray-700">{activeDoc?.raw?.fulfilled_document || 'Linked'}</span>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                      {activeDoc?.file_url && (
                        <button 
                          onClick={() => handleViewFile(activeDoc.file_url!)}
                          disabled={actionLoading}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-50 transition shadow-xs cursor-pointer disabled:opacity-50"
                        >
                          <Eye size={14} /> {actionLoading ? 'Loading...' : 'View File'}
                        </button>
                      )}

                      {activeDoc && (
                        <>
                          <button
                            onClick={() => handleDocumentAction(activeDoc.id, 'approved')}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-xs font-semibold rounded-lg hover:bg-green-700 transition disabled:opacity-50 shadow-xs cursor-pointer"
                          >
                            <CheckCircle2 size={14} /> Approve
                          </button>

                          <button
                            onClick={() => handleDocumentAction(activeDoc.id, 'rejected')}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 transition disabled:opacity-50 shadow-xs cursor-pointer"
                          >
                            <XCircle size={14} /> Reject
                          </button>

                          <button
                            onClick={() => handleDeleteDocumentFile(activeDoc.id)}
                            disabled={actionLoading}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-lg hover:bg-red-100 transition disabled:opacity-50 cursor-pointer"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div 
                      style={{ color: primaryColor }}
                      className="p-3 bg-white rounded-full shadow-sm mx-auto w-fit"
                    >
                      <Upload size={24} />
                    </div>
                    <h4 
                      style={{ color: primaryColor }}
                      className="text-sm font-semibold"
                    >
                      {activeDoc ? activeDoc.document_title_requested : 'No Document Selected'}
                    </h4>
                    <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
                      <Clock size={12} /> Waiting for candidate file upload submission
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex flex-col h-fit">
            <h3 
              style={{ color: primaryColor }}
              className="font-semibold text-sm border-b border-gray-100 pb-3 mb-3 flex items-center gap-2"
            >
              <FileText size={16} /> Checklist ({selectedRequest.items?.length || 0})
            </h3>
            
            <div className="space-y-2 max-h-[450px] overflow-y-auto pr-1">
              {isDetailLoading ? (
                <div className="py-8 text-center text-xs text-gray-400">Loading checklist...</div>
              ) : selectedRequest.items && selectedRequest.items.length > 0 ? (
                selectedRequest.items.map((doc, idx) => {
                  const itemUploaded = doc.is_uploaded || forceUploaded[doc.id];
                  const isSelected = selectedDocIndex === idx;
                  return (
                    <div 
                      key={doc.id || idx}
                      onClick={() => setSelectedDocIndex(idx)}
                      style={
                        isSelected 
                          ? { backgroundColor: `${primaryColor}10`, borderColor: primaryColor } 
                          : {}
                      }
                      className={`p-3 rounded-lg border cursor-pointer transition flex items-center justify-between ${
                        isSelected 
                          ? 'text-gray-900 shadow-xs' 
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div>
                        <div className="text-xs font-semibold flex items-center gap-1.5">
                          <Upload 
                            size={12} 
                            style={isSelected ? { color: primaryColor } : undefined}
                            className={isSelected ? '' : 'text-gray-400'} 
                          />
                          {doc.document_title_requested}
                        </div>
                        {doc.required && (
                          <span 
                            style={{ color: primaryColor }}
                            className="text-[10px] font-medium mt-0.5 block italic opacity-85"
                          >
                            Required
                          </span>
                        )}
                      </div>
                      {itemUploaded && (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                          doc.status === 'approved' 
                            ? 'bg-green-100 text-green-700' 
                            : doc.status === 'rejected' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {doc.status || 'uploaded'}
                        </span>
                      )}
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-gray-500 text-center py-6">No specific files listed for this request.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-600 bg-gray-50/70">
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">To</th>
              <th className="py-3 px-4">Created On</th>
              <th className="py-3 px-4">Expires</th>
              <th className="py-3 px-4 text-center">Completed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">Loading sent requests...</td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400 text-xs">No sent document requests found.</td>
              </tr>
            ) : (
              requests.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => handleSelectRequest(item)}
                  className="hover:bg-gray-50 transition cursor-pointer"
                >
                  <td className="py-3.5 px-4 flex items-center gap-2.5 font-medium text-gray-900">
                    <span 
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                      className="p-1.5 rounded-md shrink-0"
                    >
                      <Send size={14} />
                    </span>
                    <span className="truncate max-w-xs sm:max-w-md">{item.subject}</span>
                  </td>
                  <td className="py-3.5 px-4 text-gray-600 truncate max-w-[150px]">{item.to} ({item.recipient_name})</td>
                  <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{item.createdOn}</td>
                  <td className="py-3.5 px-4 text-gray-500 whitespace-nowrap">{item.expires}</td>
                  <td className="py-3.5 px-4 text-center">
                    <input 
                      type="checkbox" 
                      disabled 
                      checked={item.completed} 
                      style={{ accentColor: primaryColor }}
                      className="rounded cursor-default" 
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}