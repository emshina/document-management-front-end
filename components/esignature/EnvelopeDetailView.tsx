'use client';

import { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle2, Clock, FileText, AlertCircle, Globe, Download, Eye } from 'lucide-react';
import { apiCall } from '@/lib/api';
import { useTenant } from '@/hooks/useTenant';

interface EnvelopeDetailViewProps {
  envelopeId: string;
  onBack: () => void;
}

export default function EnvelopeDetailView({ envelopeId, onBack }: EnvelopeDetailViewProps) {
  const { primaryColor } = useTenant();
  const [envelope, setEnvelope] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!envelopeId) return;

    const fetchEnvelopeDetail = async () => {
      try {
        setLoading(true);
        const data = await apiCall(`/v1/esignature/envelopes/${envelopeId}/`, {
          method: 'GET',
          requiresAuth: true,
        });
        setEnvelope(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load envelope details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEnvelopeDetail();
  }, [envelopeId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><CheckCircle2 size={16} /> Completed</span>;
      case 'Pending':
        return <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold"><Clock size={16} /> Pending</span>;
      case 'Draft':
        return <span className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-sm font-semibold"><FileText size={16} /> Draft</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold"><AlertCircle size={16} /> {status}</span>;
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-gray-500 text-sm">Loading envelope details...</div>;
  }

  if (error || !envelope) {
    return (
      <div className="p-12 text-center bg-white rounded-xl shadow-xs border border-gray-200">
        <p className="text-red-600 mb-4 text-sm">{error || 'Envelope not found.'}</p>
        <button onClick={onBack} className="text-blue-600 underline text-sm font-medium">Go Back</button>
      </div>
    );
  }

  // Check all possible keys your backend might use for the file/document URL
  const documentLink = envelope.document_file_url || envelope.document_url || envelope.file_url;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <button 
        onClick={onBack} 
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition"
      >
        <ArrowLeft size={16} /> Back to Requests
      </button>

      {/* Summary Card with Document Action Buttons */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-gray-900">{envelope.title}</h1>
          <p className="text-sm text-gray-500">Owned by {envelope.owner_name || 'Organization'}</p>
          <p className="text-xs text-gray-400">{envelope.description || 'No description given'}</p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 pt-2">
            <span>Submitted on {new Date(envelope.created_at).toLocaleString()}</span>
            {envelope.completed_at && <span>Completed on {new Date(envelope.completed_at).toLocaleString()}</span>}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4 w-full md:w-auto justify-between">
          <div>
            <div className="text-xs text-gray-400 uppercase font-semibold mb-1">Status</div>
            {getStatusBadge(envelope.status)}
          </div>

          {/* Document Preview & Download Buttons */}
          {documentLink ? (
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              <a
                href={documentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-blue-100 transition shadow-xs"
              >
                <Eye size={14} /> Preview Document
              </a>
              <a
                href={documentLink}
                download
                className="flex items-center gap-1.5 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-xs font-semibold hover:bg-gray-200 transition shadow-xs"
              >
                <Download size={14} /> Download
              </a>
            </div>
          ) : (
            <span className="text-xs text-gray-400 italic">Document link unavailable</span>
          )}
        </div>
      </div>

      {/* Recipient Status Section with Corrected Progress Trackers */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 font-semibold text-gray-800 text-sm">
          Recipient status & live progress
        </div>

        <div className="divide-y divide-gray-200">
          {envelope.recipients?.map((recipient: any, index: number) => {
            const isEmailed = Boolean(recipient.mailed_at || recipient.sent || recipient.emailed || recipient.status === 'Mailed' || recipient.status === 'Viewed' || recipient.status === 'Signed');
            const isViewed = Boolean(recipient.viewed_at || recipient.viewed || recipient.status === 'Viewed' || recipient.status === 'Signed');
            const isSigned = Boolean(recipient.signed_at || recipient.signed || recipient.status === 'Signed');

            const recipientName = recipient.signer_name || recipient.name || recipient.user?.name || recipient.user?.username || 'Unnamed Recipient';
            const recipientEmail = recipient.signer_email || recipient.email || recipient.user_email || recipient.user?.email || recipient.recipient_email || recipient.contact_email || 'No email provided';

            return (
              <div key={recipient.id || index} className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span 
                      className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold"
                      style={{ backgroundColor: primaryColor || '#3b82f6' }}
                    >
                      {index + 1}
                    </span>
                    <span className="font-semibold text-gray-900 text-sm">{recipientName}</span>
                  </div>
                  <p className="text-xs text-gray-500 pl-8">{recipientEmail}</p>
                  {(recipient.viewed_at || recipient.last_action_date) && (
                    <p className="text-xs text-gray-400 pl-8 flex items-center gap-1">
                      <Globe size={12} /> Accessed from IP {recipient.ip_address || 'N/A'} at {new Date(recipient.viewed_at || recipient.last_action_date).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Accurate Progress Tracker with dynamic fill widths */}
                <div className="w-full lg:w-72 flex items-center justify-between relative px-4">
                  <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-gray-200 z-0"></div>
                  
                  {/* Dynamic progress bar width calculation */}
                  <div 
                    className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 z-0 transition-all duration-500 bg-green-600"
                    style={{
                      right: isSigned ? '24px' : isViewed ? 'calc(50% + 12px)' : isEmailed ? 'calc(100% - 48px)' : '100%'
                    }}
                  ></div>
                  
                  {/* Step 1: Mailed */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isEmailed ? 'bg-green-600' : 'bg-gray-300'} border-2 border-white shadow-xs`}>
                      {isEmailed ? '✓' : ''}
                    </div>
                    <span className="text-[11px] text-gray-700 mt-1 font-medium">Mailed</span>
                  </div>

                  {/* Step 2: Viewed */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isViewed ? 'bg-green-600' : 'bg-gray-300'} border-2 border-white shadow-xs`}>
                      {isViewed ? '✓' : ''}
                    </div>
                    <span className="text-[11px] text-gray-700 mt-1 font-medium">Viewed</span>
                  </div>

                  {/* Step 3: Signed */}
                  <div className="relative z-10 flex flex-col items-center">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isSigned ? 'bg-green-600' : 'bg-gray-300'} border-2 border-white shadow-xs`}>
                      {isSigned ? '✓' : ''}
                    </div>
                    <span className="text-[11px] text-gray-700 mt-1 font-medium">Signed</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}