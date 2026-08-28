
'use client';
import { useState, useEffect } from 'react';
import FolderTree from '@/components/FolderTree';
import { Plus, X, Folder, ArrowUp, ArrowDown, Upload, Calendar, FileText } from 'lucide-react';
import { apiCall } from '../../lib/api';

interface RequestDocumentItem {
  id: string;
  type: 'file' | 'form';
  name: string;
  required: boolean;
  rename: boolean;
  allowMultiple: boolean;
  formId?: string | number;
}

interface TemplateItem {
  id: string | number;
  name: string;
  subject: string;
  destination?: any;
  message: string;
  documents: RequestDocumentItem[];
}

interface FormItem {
  id: string | number;
  title: string;
}

interface NewRequestViewProps {
  onCancel: () => void;
}

export default function NewRequestView({ onCancel }: NewRequestViewProps) {
  const [template, setTemplate] = useState('');
  const [templatesList, setTemplatesList] = useState<TemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(true);

  // Forms List State for Selection
  const [formsList, setFormsList] = useState<FormItem[]>([]);
  const [isLoadingForms, setIsLoadingForms] = useState(false);

  // Form Templates List State for Selection
  const [formTemplatesList, setFormTemplatesList] = useState<FormItem[]>([]);
  const [isLoadingFormTemplates, setIsLoadingFormTemplates] = useState(false);

  // Form Selector Modal State
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [newFormTitle, setNewFormTitle] = useState('');

  const [selectedDestination, setSelectedDestination] = useState<any>(null);
  const [isDestinationModalOpen, setIsDestinationModalOpen] = useState(false);
  const [createNewFolder, setCreateNewFolder] = useState(false);
  const [generateLink, setGenerateLink] = useState(false);
  const [toEmail, setToEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  
  // Timeframe states
  const [timeframeEnabled, setTimeframeEnabled] = useState(false);
  const [targetDate, setTargetDate] = useState('2026-08-31');
  const [years, setYears] = useState('0');
  const [months, setMonths] = useState('0');
  const [days, setDays] = useState('3');

  const [notifyCompletion, setNotifyCompletion] = useState(true);
  const [grantInstantSignIn, setGrantInstantSignIn] = useState(false);

  // Multiple Documents State List
  const [documents, setDocuments] = useState<RequestDocumentItem[]>([
    { id: '1', type: 'file', name: '', required: false, rename: false, allowMultiple: false },
  ]);

  // Helper: Update calendar date from relative inputs (Years, Months, Days)
  const updateDateFromRelative = (yStr: string, mStr: string, dStr: string) => {
    const y = parseInt(yStr) || 0;
    const m = parseInt(mStr) || 0;
    const d = parseInt(dStr) || 0;

    const baseDate = new Date();
    baseDate.setFullYear(baseDate.getFullYear() + y);
    baseDate.setMonth(baseDate.getMonth() + m);
    baseDate.setDate(baseDate.getDate() + d);

    const year = baseDate.getFullYear();
    const month = String(baseDate.getMonth() + 1).padStart(2, '0');
    const day = String(baseDate.getDate()).padStart(2, '0');

    setTargetDate(`${year}-${month}-${day}`);
  };

  // Helper: Update relative inputs (Years, Months, Days) from calendar date selection
  const updateRelativeFromDate = (dateStr: string) => {
    if (!dateStr) return;
    const target = new Date(dateStr);
    const now = new Date();

    if (isNaN(target.getTime())) return;

    let y = target.getFullYear() - now.getFullYear();
    let m = target.getMonth() - now.getMonth();
    let d = target.getDate() - now.getDate();

    if (d < 0) {
      m -= 1;
      const prevMonth = new Date(target.getFullYear(), target.getMonth(), 0);
      d += prevMonth.getDate();
    }
    if (m < 0) {
      y -= 1;
      m += 12;
    }

    setYears(String(Math.max(0, y)));
    setMonths(String(Math.max(0, m)));
    setDays(String(Math.max(0, d)));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTargetDate(val);
    updateRelativeFromDate(val);
  };

  const handleYearsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYears(val);
    updateDateFromRelative(val, months, days);
  };

  const handleMonthsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setMonths(val);
    updateDateFromRelative(years, val, days);
  };

  const handleDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDays(val);
    updateDateFromRelative(years, months, val);
  };

  // Fetch templates and form templates on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoadingTemplates(true);
        setIsLoadingForms(true);
        setIsLoadingFormTemplates(true);

        // Fetch Request Templates
        const templatesData = await apiCall('/v1/document-requests/templates/', { requiresAuth: true });
        const templateArray = Array.isArray(templatesData) ? templatesData : (templatesData?.results || []);
        const normalizedTemplates = templateArray.map((t: any) => ({
          id: t.id,
          name: t.template_name || t.subject || 'Untitled Template',
          subject: t.subject || t.template_name || '',
          destination: t.destination_folder || t.destination_cabinet || t.destination || null,
          message: t.message || '',
          documents: (t.documents || t.items || []).map((d: any) => ({
            id: d.id ? String(d.id) : Math.random().toString(),
            type: d.type || 'file',
            name: d.name || d.document_title_requested || '',
            required: d.required ?? d.is_required ?? false,
            rename: d.rename ?? d.allow_rename ?? false,
            allowMultiple: d.allowMultiple ?? d.allow_multiple ?? false,
            formId: d.formId || d.form_id || null
          }))
        }));
        setTemplatesList(normalizedTemplates);

        // Fetch Form Templates using the correct esignature prefix path
        try {
          const formTemplatesData = await apiCall('/v1/esignature/form-templates/', { requiresAuth: true });
          const formTemplatesArray = Array.isArray(formTemplatesData) ? formTemplatesData : (formTemplatesData?.results || []);
          setFormTemplatesList(formTemplatesArray.map((ft: any) => ({ id: ft.id, title: ft.title || ft.name || 'Untitled Form Template' })));
        } catch (err) {
          console.warn('Could not fetch form templates list, fallback to empty:', err);
        }

      } catch (error) {
        console.error('Failed to load initial data:', error);
      } finally {
        setIsLoadingTemplates(false);
        setIsLoadingForms(false);
        setIsLoadingFormTemplates(false);
      }
    };

    fetchData();
  }, []);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setTemplate(selectedId);

    const foundTemplate = templatesList.find((t) => String(t.id) === selectedId);

    if (foundTemplate) {
      setSubject(foundTemplate.subject || '');
      setMessage(foundTemplate.message || '');
      if (foundTemplate.destination) {
        setSelectedDestination(foundTemplate.destination);
      }
      setDocuments(
        foundTemplate.documents && foundTemplate.documents.length > 0
          ? foundTemplate.documents
          : [{ id: Date.now().toString(), type: 'file', name: '', required: false, rename: false, allowMultiple: false }]
      );
    } else {
      setSubject('');
      setMessage('');
      setDocuments([{ id: Date.now().toString(), type: 'file', name: '', required: false, rename: false, allowMultiple: false }]);
    }
  };

  const addDocumentRow = (type: 'file' | 'form') => {
    setDocuments([
      ...documents,
      { id: Date.now().toString(), type, name: '', required: false, rename: false, allowMultiple: false }
    ]);
  };

  const removeDocumentRow = (id: string) => {
    setDocuments(documents.filter(doc => doc.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newDocs = [...documents];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newDocs.length) return;
    const temp = newDocs[index];
    newDocs[index] = newDocs[targetIndex];
    newDocs[targetIndex] = temp;
    setDocuments(newDocs);
  };

  const handleSelectFormTemplate = (formTemplate: FormItem) => {
    setDocuments(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'form',
        name: formTemplate.title,
        required: false,
        rename: false,
        allowMultiple: false,
        formId: formTemplate.id
      }
    ]);
    setIsFormModalOpen(false);
  };

  const handleCreateAndSelectNewForm = async () => {
    if (!newFormTitle.trim()) {
      alert('Please enter a title for the new form.');
      return;
    }

    try {
      const createdForm = await apiCall('/v1/esignature/form-templates/', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify({ title: newFormTitle })
      });

      const newFormItem: FormItem = {
        id: createdForm.id || Date.now(),
        title: createdForm.title || newFormTitle
      };

      setFormTemplatesList([newFormItem, ...formTemplatesList]);

      setDocuments(prev => [
        ...prev,
        {
          id: Date.now().toString(),
          type: 'form',
          name: newFormItem.title,
          required: false,
          rename: false,
          allowMultiple: false,
          formId: newFormItem.id
        }
      ]);

      setIsFormModalOpen(false);
      setNewFormTitle('');
    } catch (error: any) {
      console.error('Failed to create form template:', error);
      alert(`Could not create form template: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!subject.trim()) {
      alert('Please enter a subject name to save as a template.');
      return;
    }

    const payload = {
      template_name: subject,
      subject: subject,
      destination_cabinet: selectedDestination?.is_cabinet || selectedDestination?.type === 'cabinet' ? selectedDestination.id : null,
      destination_folder: !(selectedDestination?.is_cabinet || selectedDestination?.type === 'cabinet') ? selectedDestination?.id : null,
      default_recipient_email: toEmail,
      message,
      default_expiry_days: timeframeEnabled ? parseInt(days || '0', 10) + (parseInt(months || '0', 10) * 30) : 0,
      notify_on_completion: notifyCompletion,
      grant_instant_signin: grantInstantSignIn,
      items: documents.map(doc => ({
        type: doc.type,
        document_title_requested: doc.name,
        is_required: doc.required,
        allow_rename: doc.rename,
        allow_multiple: doc.allowMultiple,
        form_id: doc.formId || null
      }))
    };

    try {
      const saved = await apiCall('/v1/document-requests/templates/', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(payload)
      });
      alert(`Template "${subject}" saved successfully to your database!`);
      
      const newTemplateItem: TemplateItem = {
        id: saved.id || Date.now(),
        name: saved.template_name || subject,
        subject: subject,
        message: message,
        destination: selectedDestination,
        documents: documents
      };
      setTemplatesList([newTemplateItem, ...templatesList]);
      setTemplate(String(newTemplateItem.id));
    } catch (error: any) {
      console.error('Save template error:', error);
      alert(`Failed to save template: ${error.message || 'Unknown error'}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDestination) {
      alert('Please select a destination folder first.');
      return;
    }
    if (!toEmail.trim()) {
      alert('Please provide a recipient email address.');
      return;
    }

    const isCabinet = selectedDestination?.is_cabinet || selectedDestination?.type === 'cabinet';
    
    const payload = {
      recipient_name: recipientName || toEmail.split('@')[0],
      recipient_email: toEmail,
      subject,
      message,
      destination_cabinet: isCabinet ? selectedDestination.id : null,
      destination_folder: !isCabinet ? selectedDestination.id : null,
      notify_on_completion: notifyCompletion,
      grant_instant_signin: grantInstantSignIn,
      expires_at: timeframeEnabled ? new Date(targetDate).toISOString() : null,
      items: documents.map(doc => ({
        type: doc.type,
        document_title_requested: doc.name,
        is_required: doc.required,
        allow_multiple: doc.allowMultiple,
        form_id: doc.formId || null
      }))
    };

    try {
      await apiCall('/v1/document-requests/requests/', {
        method: 'POST',
        requiresAuth: true,
        body: JSON.stringify(payload)
      });
      alert(`Successfully sent request with ${documents.length} document items under destination: ${selectedDestination.name}`);
      onCancel();
    } catch (error: any) {
      console.error('Submit request error:', error);
      alert(`Failed to send request: ${error.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="w-full pb-16">
      <form onSubmit={handleSubmit} className="space-y-5 bg-white p-6 sm:p-8 rounded-xl border border-gray-200 shadow-sm">
        
        {/* Request Template */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <label className="text-sm font-medium text-gray-700 w-40 shrink-0">Request Template</label>
          <div className="w-full sm:max-w-md">
            <select 
              value={template} 
              onChange={handleTemplateChange}
              disabled={isLoadingTemplates}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white outline-none focus:border-[#7C3AED]"
            >
              <option value="">{isLoadingTemplates ? 'Loading templates...' : 'Select a template'}</option>
              {templatesList.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Destination Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <label className="text-sm font-medium text-gray-700 w-40 shrink-0">Destination:</label>
          <div className="flex items-center gap-3">
            <button 
              type="button" 
              onClick={() => setIsDestinationModalOpen(true)}
              className="px-4 py-1.5 bg-[#7C3AED] text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              Select
            </button>
            <span className="text-xs text-gray-600 truncate">
              {selectedDestination ? `Selected: ${selectedDestination.name}` : 'No destination selected'}
            </span>
          </div>
        </div>

        {/* Checkbox Options */}
        <div className="space-y-2 sm:pl-[184px]">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={createNewFolder} 
              onChange={(e) => setCreateNewFolder(e.target.checked)}
              className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
            />
            Create new folder in this location <span className="text-[#7C3AED]">?</span>
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={generateLink} 
              onChange={(e) => setGenerateLink(e.target.checked)}
              className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
            />
            Generate link for request <span className="text-[#7C3AED]">?</span>
          </label>
        </div>

        {/* Recipient Name */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <label className="text-sm font-medium text-gray-700 w-40 shrink-0">Recipient Name:</label>
          <div className="w-full sm:max-w-xl">
            <input 
              type="text" 
              placeholder="Recipient full name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#7C3AED]"
              required
            />
          </div>
        </div>

        {/* To Email */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <label className="text-sm font-medium text-gray-700 w-40 shrink-0">To:</label>
          <div className="w-full sm:max-w-xl">
            <input 
              type="email" 
              placeholder="Recipient email address"
              value={toEmail}
              onChange={(e) => setToEmail(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#7C3AED]"
              required
            />
          </div>
        </div>

        {/* Subject */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
          <label className="text-sm font-medium text-gray-700 w-40 shrink-0">Subject:</label>
          <div className="w-full sm:max-w-xl">
            <input 
              type="text" 
              placeholder="Request subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#7C3AED]"
              required
            />
          </div>
        </div>

        {/* Attachments */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
          <label className="text-sm font-medium text-gray-700 w-40 shrink-0 pt-1">Attachments:</label>
          <div>
            <button 
              type="button" 
              onClick={() => addDocumentRow('file')}
              className="w-8 h-8 bg-[#7C3AED] text-white rounded-full flex items-center justify-center hover:bg-purple-700 shadow transition"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Message */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6">
          <label className="text-sm font-medium text-gray-700 w-40 shrink-0 pt-1">Message:</label>
          <div className="w-full sm:max-w-xl">
            <textarea 
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#7C3AED] resize-none"
            />
          </div>
        </div>

        {/* Timeframe Section */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input 
                type="checkbox" 
                checked={timeframeEnabled} 
                onChange={(e) => setTimeframeEnabled(e.target.checked)}
                className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
              />
              Timeframe
            </label>
          </div>

          {timeframeEnabled && (
            <div className="sm:pl-6 space-y-3 p-4 bg-gray-50 border border-gray-200 rounded-xl max-w-xl">
              <div className="relative max-w-xs">
                <input 
                  type="date" 
                  value={targetDate} 
                  onChange={handleDateChange}
                  className="w-full px-3 py-1.5 pl-9 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-[#7C3AED]"
                />
                <Calendar size={16} className="absolute left-3 top-2.5 text-gray-400" />
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-xs text-xs text-gray-600">
                <div>
                  <span className="block mb-1 font-medium">Year(s)</span>
                  <input 
                    type="number" 
                    min="0"
                    value={years} 
                    onChange={handleYearsChange}
                    className="w-full px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <span className="block mb-1 font-medium">Month(s)</span>
                  <input 
                    type="number" 
                    min="0"
                    value={months} 
                    onChange={handleMonthsChange}
                    className="w-full px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#7C3AED]"
                  />
                </div>
                <div>
                  <span className="block mb-1 font-medium">Day(s)</span>
                  <input 
                    type="number" 
                    min="0"
                    value={days} 
                    onChange={handleDaysChange}
                    className="w-full px-3 py-1 bg-white border border-gray-300 rounded-lg text-sm outline-none focus:border-[#7C3AED]"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Checkboxes */}
        <div className="space-y-2 pt-1">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={notifyCompletion} 
              onChange={(e) => setNotifyCompletion(e.target.checked)}
              className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
            />
            Notify on Completion
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input 
              type="checkbox" 
              checked={grantInstantSignIn} 
              onChange={(e) => setGrantInstantSignIn(e.target.checked)}
              className="rounded text-[#7C3AED] focus:ring-[#7C3AED]"
            />
            Grant Instant Sign-in
          </label>
        </div>

        {/* Multiple Documents To Request Section */}
        <div className="pt-6 border-t border-gray-200">
          <h3 className="text-[#7C3AED] font-semibold text-sm mb-4">Documents & Forms To Request</h3>
          
          <div className="space-y-4">
            {documents.map((doc, index) => (
              <div key={doc.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div className="flex items-center gap-3">
                  <div className="flex flex-col text-gray-400">
                    <button type="button" onClick={() => moveItem(index, 'up')} className="hover:text-gray-700"><ArrowUp size={14} /></button>
                    <button type="button" onClick={() => moveItem(index, 'down')} className="hover:text-gray-700"><ArrowDown size={14} /></button>
                  </div>
                  <div className="p-2 bg-white border border-gray-200 rounded-lg text-[#7C3AED]">
                    {doc.type === 'form' ? <FileText size={18} /> : <Upload size={18} />}
                  </div>
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    {doc.type === 'form' ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input 
                          type="text" 
                          placeholder="Selected form..." 
                          value={doc.name}
                          readOnly
                          className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg outline-none text-gray-700 font-medium"
                          required
                        />
                      </div>
                    ) : (
                      <input 
                        type="text" 
                        placeholder="Name (e.g. 2017 w-2)" 
                        value={doc.name}
                        onChange={(e) => {
                          const updated = [...documents];
                          updated[index].name = e.target.value;
                          setDocuments(updated);
                        }}
                        className="flex-1 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg outline-none focus:border-[#7C3AED]"
                        required
                      />
                    )}

                    <div className="flex items-center gap-4 text-xs text-gray-700">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={doc.required}
                          onChange={(e) => {
                            const updated = [...documents];
                            updated[index].required = e.target.checked;
                            setDocuments(updated);
                          }}
                          className="rounded text-[#7C3AED]"
                        /> Required
                      </label>
                      {doc.type === 'file' && (
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={doc.rename}
                            onChange={(e) => {
                              const updated = [...documents];
                              updated[index].rename = e.target.checked;
                              setDocuments(updated);
                            }}
                            className="rounded text-[#7C3AED]"
                          /> Rename
                        </label>
                      )}
                    </div>
                  </div>

                  {doc.type === 'file' && (
                    <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer pt-1">
                      <input 
                        type="checkbox" 
                        checked={doc.allowMultiple}
                        onChange={(e) => {
                          const updated = [...documents];
                          updated[index].allowMultiple = e.target.checked;
                          setDocuments(updated);
                        }}
                        className="rounded text-[#7C3AED]"
                      /> Allow Multiple File Uploads?
                    </label>
                  )}
                </div>

                <button 
                  type="button" 
                  onClick={() => removeDocumentRow(doc.id)}
                  className="text-gray-400 hover:text-red-500 transition self-center sm:self-auto"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button 
              type="button" 
              onClick={() => addDocumentRow('file')}
              className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              Request File
            </button>
            <button 
              type="button" 
              onClick={() => setIsFormModalOpen(true)}
              className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              Request Form
            </button>
          </div>
        </div>

        {/* Bottom Save & Cancel Actions */}
        <div className="pt-6 border-t border-gray-200 flex items-center justify-between">
          <button 
            type="button"
            onClick={onCancel}
            className="px-5 py-2 border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={handleSaveAsTemplate}
              className="px-5 py-2 bg-[#7C3AED] text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              Save As New Template
            </button>
            <button 
              type="submit"
              className="px-6 py-2 bg-[#7C3AED] text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition shadow-sm"
            >
              Send Request
            </button>
          </div>
        </div>

      </form>

      {/* Form Selector & Creator Modal */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 flex flex-col">
            
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#2D1B4E] text-white">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <FileText size={18} /> Select or Create a Form Template
              </h3>
              <button 
                onClick={() => setIsFormModalOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto bg-gray-50">
              
              {/* Option A: Create New Form Template */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h4 className="text-sm font-semibold text-[#7C3AED]">Create New Form Template</h4>
                <div className="flex items-center gap-2">
                  <input 
                    type="text"
                    placeholder="Enter new form title..."
                    value={newFormTitle}
                    onChange={(e) => setNewFormTitle(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg outline-none focus:border-[#7C3AED]"
                  />
                  <button 
                    type="button"
                    onClick={handleCreateAndSelectNewForm}
                    className="px-4 py-2 bg-[#7C3AED] text-white text-xs font-semibold rounded-lg hover:bg-purple-700 transition"
                  >
                    Create & Select
                  </button>
                </div>
              </div>

              {/* Option B: Pick from Existing Form Templates */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                <h4 className="text-sm font-semibold text-gray-700">Select Existing Form Template</h4>
                {isLoadingFormTemplates ? (
                  <p className="text-xs text-gray-500">Loading form templates...</p>
                ) : formTemplatesList.length === 0 ? (
                  <p className="text-xs text-gray-500">No form templates found.</p>
                ) : (
                  <div className="space-y-2 max-h-44 overflow-y-auto">
                    {formTemplatesList.map((formTemplate) => (
                      <div 
                        key={formTemplate.id}
                        onClick={() => handleSelectFormTemplate(formTemplate)}
                        className="p-3 border border-gray-200 rounded-lg hover:border-[#7C3AED] hover:bg-purple-50 cursor-pointer transition flex items-center justify-between text-sm"
                      >
                        <span className="font-medium text-gray-800">{formTemplate.title}</span>
                        <span className="text-xs text-[#7C3AED] font-semibold">Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-white flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsFormModalOpen(false)}
                className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Live Destination Selection Modal */}
      {isDestinationModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-gray-200 flex flex-col max-h-[85vh]">
            
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-[#2D1B4E] text-white">
              <h3 className="font-semibold text-base flex items-center gap-2">
                <Folder size={18} /> Select Destination Folder
              </h3>
              <button 
                onClick={() => setIsDestinationModalOpen(false)}
                className="text-gray-300 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-gray-50">
              <p className="text-xs text-gray-500 mb-3">
                Click on any organization, cabinet, or folder to select it as the destination path.
              </p>
              <div className="bg-white border border-gray-200 rounded-lg p-2">
                <FolderTree 
                  onSelectFolder={(item) => {
                    setSelectedDestination(item);
                  }} 
                />
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-white flex items-center justify-between">
              <span className="text-xs text-gray-600 truncate max-w-sm">
                Current Target: <strong className="text-[#7C3AED]">{selectedDestination ? selectedDestination.name : 'None selected'}</strong>
              </span>
              <div className="flex items-center gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsDestinationModalOpen(false)}
                  className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100 transition"
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  disabled={!selectedDestination}
                  onClick={() => {
                    if (selectedDestination) setIsDestinationModalOpen(false);
                  }}
                  className="px-4 py-1.5 bg-[#7C3AED] text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition disabled:opacity-50"
                >
                  Confirm Selection
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}