'use client';
import { useState, useEffect } from 'react';
import { Plus, Send, Upload, X } from 'lucide-react';
import { apiCall } from '../../lib/api';
import { useTenant } from '@/hooks/useTenant';

interface TemplateDocument {
  id: string;
  name: string;
  required: boolean;
  rename: boolean;
  allowMultiple: boolean;
}

interface RequestTemplate {
  id: string;
  subject: string;
  destination: string;
  toEmail: string;
  message: string;
  createdOn: string;
  expires: string;
  documents: TemplateDocument[];
}

export default function TemplatesAndRequestsModule() {
  const [currentView, setCurrentView] = useState<'list' | 'create-template' | 'view-template' | 'create-request'>('list');
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<RequestTemplate | null>(null);

  // --- New Template Form States ---
  const [subject, setSubject] = useState('');
  const [toEmail, setToEmail] = useState('');
  const [destination, setDestination] = useState('CDL Holding Group / General Vault');
  const [message, setMessage] = useState('');
  const [timeframeEnabled, setTimeframeEnabled] = useState(false);
  const [days, setDays] = useState('3');
  const [documents, setDocuments] = useState<TemplateDocument[]>([
    { id: '1', name: '', required: true, rename: false, allowMultiple: false }
  ]);

  // --- Request Form States ---
  const [requestSubject, setRequestSubject] = useState('');
  const [requestToEmail, setRequestToEmail] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestDocuments, setRequestDocuments] = useState<TemplateDocument[]>([]);

  const { primaryColor } = useTenant();

  // Fetch templates from Django database and normalize keys (template_name <-> subject)
  useEffect(() => {
    apiCall('/v1/document-requests/templates/', { requiresAuth: true })
      .then(data => {
        const templateArray = Array.isArray(data) ? data : (data?.results || []);
        const normalized = templateArray.map((t: any) => ({
          id: t.id,
          subject: t.subject || t.template_name || '',
          destination: t.destination || '',
          toEmail: t.toEmail || t.to_email || '',
          message: t.message || '',
          createdOn: t.createdOn || t.created_on || new Date().toISOString().split('T')[0],
          expires: t.expires || 'No expiry',
          documents: (t.documents || t.items || []).map((d: any) => ({
            id: d.id || Math.random().toString(),
            name: d.name || d.document_name || '',
            required: d.required ?? true,
            rename: d.rename ?? false,
            allowMultiple: d.allowMultiple ?? d.allow_multiple ?? false
          }))
        }));
        setTemplates(normalized);
      })
      .catch(err => {
        console.warn('Could not load templates from database:', err.message);
        setTemplates([]);
      });
  }, []);

  const handleAddDocumentRow = () => {
    setDocuments([
      ...documents,
      { id: Date.now().toString(), name: '', required: false, rename: false, allowMultiple: false }
    ]);
  };

  const handleRemoveDocumentRow = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const setIsCreatingDefaults = () => {
    setSubject('');
    setToEmail('');
    setMessage('');
    setDocuments([{ id: '1', name: '', required: true, rename: false, allowMultiple: false }]);
  };

  const handleUseTemplate = (template: RequestTemplate) => {
    setRequestSubject(template.subject);
    setRequestToEmail(template.toEmail);
    setRequestMessage(template.message);
    setRequestDocuments(template.documents || []);
    setCurrentView('create-request');
  };

  const handleSendRequest = async () => {
    if (!requestSubject.trim()) {
      alert('Please enter a request subject.');
      return;
    }

    const payload = {
      subject: requestSubject,
      recipient_email: requestToEmail,
      message: requestMessage,
      items: requestDocuments.map(doc => ({
        document_title_requested: doc.name,
        is_required: doc.required
      }))
    };

    try {
      await apiCall('/v1/document-requests/requests/', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(payload)
      });
      alert('Document request sent successfully!');
      setCurrentView('list');
    } catch (error: any) {
      console.error('Failed to send request:', error);
      alert(`Failed to send request: ${error.message}`);
    }
  };

  // Save Template to Django database with correct backend field names
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      alert('Please enter a template subject.');
      return;
    }

    const payload = {
      template_name: subject,
      destination,
      to_email: toEmail,
      message,
      expires: timeframeEnabled ? `${days} days` : 'No expiry',
      items: documents.map(doc => ({
        document_title_requested: doc.name,
        required: doc.required,
        rename: doc.rename,
        allow_multiple: doc.allowMultiple
      }))
    };

    try {
      const savedTemplate = await apiCall('/v1/document-requests/templates/', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(payload)
      });

      const formattedSaved: RequestTemplate = {
        id: savedTemplate.id,
        subject: savedTemplate.subject || savedTemplate.template_name,
        destination: savedTemplate.destination,
        toEmail: savedTemplate.toEmail || savedTemplate.to_email,
        message: savedTemplate.message,
        createdOn: savedTemplate.createdOn || savedTemplate.created_on || new Date().toISOString().split('T')[0],
        expires: savedTemplate.expires,
        documents: (savedTemplate.documents || savedTemplate.items || []).map((d: any) => ({
          id: d.id,
          name: d.name || d.document_title_requested,
          required: d.required,
          rename: d.rename,
          allowMultiple: d.allowMultiple ?? d.allow_multiple
        }))
      };

      setTemplates([formattedSaved, ...templates]);
      alert(`Template "${subject}" has been successfully saved to your Django database!`);
      setIsCreatingDefaults();
      setCurrentView('list');
    } catch (error: any) {
      console.error('Full API Error Response:', error);
      alert(`Failed to save template: ${error.message}`);
    }
  };

  // ================= 1. CREATE TEMPLATE VIEW =================
  if (currentView === 'create-template') {
    return (
      <div className="w-full pb-16">
        <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-200 pb-4">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Create New Request Template</h2>
              <p className="text-xs text-gray-500 mt-0.5">Build a reusable template stored in your Django backend database.</p>
            </div>
            <button 
              onClick={() => setCurrentView('list')}
              className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSaveTemplate} className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="text-sm font-medium text-gray-700 w-44 shrink-0">Template Subject:</label>
              <input 
                type="text" 
                placeholder="e.g. Quarterly Compliance Submission"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                className="w-full sm:max-w-xl px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-current"
                required
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
              <label className="text-sm font-medium text-gray-700 w-44 shrink-0">Default Recipient (To):</label>
              <input 
                type="email" 
                placeholder="recipient@company.com"
                value={toEmail}
                onChange={(e) => setToEmail(e.target.value)}
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                className="w-full sm:max-w-xl px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-current"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
              <label className="text-sm font-medium text-gray-700 w-44 shrink-0 pt-1">Default Message:</label>
              <textarea 
                rows={4}
                placeholder="Type the standard message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                className="w-full sm:max-w-xl px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-current resize-none"
              />
            </div>

            {/* Documents Section */}
            <div className="pt-6 border-t border-gray-200">
              <h3 style={{ color: primaryColor }} className="font-semibold text-sm mb-4">Documents To Request in Template</h3>
              <div className="space-y-4">
                {documents.map((doc, index) => (
                  <div key={doc.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <input 
                          type="text" 
                          placeholder="Document Name (e.g. Tax Form)" 
                          value={doc.name}
                          onChange={(e) => {
                            const updated = [...documents];
                            updated[index].name = e.target.value;
                            setDocuments(updated);
                          }}
                          style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
                          className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-current"
                          required
                        />
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={doc.required}
                            onChange={(e) => {
                              const updated = [...documents];
                              updated[index].required = e.target.checked;
                              setDocuments(updated);
                            }}
                            style={{ accentColor: primaryColor }}
                            className="rounded"
                          /> Required
                        </label>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveDocumentRow(doc.id)}
                      className="text-gray-400 hover:text-red-500 transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
              <button 
                type="button" 
                onClick={handleAddDocumentRow}
                style={{ backgroundColor: primaryColor }}
                className="mt-4 px-4 py-2 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition cursor-pointer"
              >
                + Add Another Document
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
              <button 
                type="button"
                onClick={() => setCurrentView('list')}
                className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="submit"
                style={{ backgroundColor: primaryColor }}
                className="px-6 py-2 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition cursor-pointer"
              >
                Save Template
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ================= 2. VIEW TEMPLATE DETAILS VIEW =================
  if (currentView === 'view-template' && selectedTemplate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
          <button 
            onClick={() => setCurrentView('list')}
            style={{ color: primaryColor }}
            className="text-sm font-semibold hover:underline cursor-pointer"
          >
            ← Back to Templates List
          </button>
          <button 
            onClick={() => handleUseTemplate(selectedTemplate)}
            style={{ backgroundColor: primaryColor }}
            className="px-4 py-2 text-white text-xs font-semibold rounded-lg hover:opacity-90 shadow-sm transition cursor-pointer"
          >
            Use This Template
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-gray-900">{selectedTemplate.subject}</h2>
            <p className="text-xs text-gray-500">Destination: <strong className="text-gray-700">{selectedTemplate.destination}</strong></p>
            <div className="p-5 bg-gray-50 border border-gray-200 rounded-xl whitespace-pre-line text-sm text-gray-700">
              {selectedTemplate.message}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-fit">
            <div 
              style={{ color: primaryColor, backgroundColor: `${primaryColor}10` }}
              className="p-4 border-b border-gray-200 font-semibold text-sm"
            >
              Requested Documents ({selectedTemplate.documents?.length || 0})
            </div>
            <div className="divide-y divide-gray-100">
              {selectedTemplate.documents?.map((doc, idx) => (
                <div key={idx} className="p-3.5 text-sm font-medium text-gray-900 flex items-center gap-2">
                  <Upload size={14} style={{ color: primaryColor }} />
                  <span>{doc.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ================= 3. CREATE REQUEST USING TEMPLATE (AUTO-POPULATED) =================
  if (currentView === 'create-request') {
    return (
      <div className="bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-gray-200 pb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">New Document Request (Auto-Filled)</h2>
            <p className="text-xs text-gray-500">Fields and files below were auto-populated from your template database.</p>
          </div>
          <button onClick={() => setCurrentView('list')} className="text-gray-400 hover:text-gray-600 cursor-pointer"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Subject</label>
            <input 
              type="text" 
              value={requestSubject} 
              onChange={(e) => setRequestSubject(e.target.value)}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              className="w-full sm:max-w-xl px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-current" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Recipient Email</label>
            <input 
              type="email" 
              value={requestToEmail} 
              onChange={(e) => setRequestToEmail(e.target.value)}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              className="w-full sm:max-w-xl px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-current" 
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Message</label>
            <textarea 
              rows={3} 
              value={requestMessage} 
              onChange={(e) => setRequestMessage(e.target.value)}
              style={{ '--tw-ring-color': primaryColor } as React.CSSProperties}
              className="w-full sm:max-w-xl px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-current resize-none" 
            />
          </div>

          <div className="pt-4 border-t border-gray-200">
            <h3 style={{ color: primaryColor }} className="text-sm font-semibold mb-3">Auto-Loaded Files to be Uploaded:</h3>
            <div className="space-y-2 max-w-xl">
              {requestDocuments.map((doc, i) => (
                <div 
                  key={i} 
                  style={{ backgroundColor: `${primaryColor}08`, borderColor: `${primaryColor}30` }}
                  className="p-3 border rounded-lg flex items-center justify-between text-sm"
                >
                  <span className="font-medium text-gray-800">{doc.name}</span>
                  <span 
                    style={{ color: primaryColor, backgroundColor: `${primaryColor}15` }}
                    className="text-xs font-semibold px-2 py-0.5 rounded"
                  >
                    Required
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={() => setCurrentView('list')} className="px-4 py-2 border rounded-lg text-sm cursor-pointer hover:bg-gray-50">Cancel</button>
            <button 
              onClick={handleSendRequest} 
              style={{ backgroundColor: primaryColor }}
              className="px-5 py-2 text-white rounded-lg text-sm font-semibold hover:opacity-90 transition cursor-pointer"
            >
              Send Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ================= 4. DEFAULT TEMPLATES LIST VIEW =================
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button 
          onClick={() => { setIsCreatingDefaults(); setCurrentView('create-template'); }}
          style={{ backgroundColor: primaryColor }}
          className="px-4 py-2 text-white text-sm font-semibold rounded-lg flex items-center gap-2 hover:opacity-90 shadow-sm transition cursor-pointer"
        >
          <Plus size={16} /> New Request Template
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-200 text-xs font-semibold text-gray-600 bg-gray-50/70">
              <th className="py-3 px-4">Subject</th>
              <th className="py-3 px-4">To Email</th>
              <th className="py-3 px-4">Created On</th>
              <th className="py-3 px-4">Expires</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
            {(!Array.isArray(templates) || templates.length === 0) ? (
              <tr>
                <td colSpan={4} className="py-6 text-center text-gray-400 italic">No templates found in database. Create your first one above.</td>
              </tr>
            ) : (
              templates.map((item) => (
                <tr 
                  key={item.id} 
                  onClick={() => { setSelectedTemplate(item); setCurrentView('view-template'); }}
                  style={{ '--hover-bg': `${primaryColor}08` } as React.CSSProperties}
                  className="hover:bg-[var(--hover-bg)] transition cursor-pointer"
                >
                  <td className="py-3.5 px-4 font-medium text-gray-900 flex items-center gap-2">
                    <span 
                      style={{ backgroundColor: `${primaryColor}15`, color: primaryColor }}
                      className="p-1.5 rounded-md"
                    >
                      <Send size={14} />
                    </span>
                    {item.subject}
                  </td>
                  <td className="py-3.5 px-4 text-gray-600">{item.toEmail}</td>
                  <td className="py-3.5 px-4 text-gray-500">{item.createdOn}</td>
                  <td className="py-3.5 px-4 text-gray-500">{item.expires}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}