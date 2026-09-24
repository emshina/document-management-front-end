'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiCall } from '@/lib/api';

import { StepOneDetailsRecipients } from './components/StepOneDetailsRecipients';
import { StepTwoCanvasWorkspace } from './components/StepTwoCanvasWorkspace';
import { WizardHeader } from './components/WizardHeader';
import { useTenant } from '@/hooks/useTenant';
import { BASE_WIDTH, PlacedField, Recipient } from './constants/esignatureConstants';

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

  // Wizard Step State
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [documentName, setDocumentName] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [sendInOrder, setSendInOrder] = useState(false);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);

  // Step 2 Canvas & PDF States
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [isImageFile, setIsImageFile] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pageHeight, setPageHeight] = useState(800);
  const [pdfReady, setPdfReady] = useState(false);
  const [activeFieldId, setActiveFieldId] = useState<any>(null);

  const canvasRef = useRef<HTMLDivElement | null>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
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
        
        // Document URL for canvas preview (prioritizing backend serializer field: document_file_url)
        const fileUrl = data.document_file_url || data.file_url || data.document_url || data.url || null;
        setMergedBlobUrl(fileUrl);
        if (fileUrl) {
          const lower = fileUrl.toLowerCase();
          setIsImageFile(lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp'));
        }

        // Map recipients
        const mappedRecipients = (data.recipients || []).map((r: any, idx: number) => ({
          id: r.id,
          signer_name: r.signer_name || r.name || '',
          signer_email: r.signer_email || r.email || '',
          action_type: r.action_type || 'needs_to_sign',
          signing_order: r.signing_order || idx + 1,
          status: r.status || 'Pending',
        }));
        setRecipients(mappedRecipients);

        // Map existing fields
        const mappedFields = (data.fields || data.envelope_fields || []).map((f: any) => ({
          id: f.id,
          temp_id: f.id || `field_${Math.random()}`,
          recipient_id: f.recipient_id || f.recipient,
          field_type: f.field_type || f.type,
          page_number: f.page_number || 1,
          x_coord: f.x_coord || 0,
          y_coord: f.y_coord || 0,
          width: f.width || 25,
          height: f.height || 6,
          label: f.label || 'Signature',
        }));
        setPlacedFields(mappedFields);

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
    const hasSigned = recipients.some(r => r.status === 'Signed');
    if (hasSigned) {
      setError('Cannot add or replace documents once a participant has already signed.');
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const newFiles = Array.from(e.target.files);
      setUploadedFiles(prev => [...prev, ...newFiles]);
      const fileUrl = URL.createObjectURL(e.target.files[0]);
      setMergedBlobUrl(fileUrl);
      setError('');
    }
  };

  const removeFileAtIndex = (index: number) => {
    const hasSigned = recipients.some(r => r.status === 'Signed');
    if (hasSigned) {
      setError('Cannot remove documents once a participant has already signed.');
      return;
    }
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
        status: 'Pending',
      }
    ]);
  };

  const removeRecipient = (index: number) => {
    const target = recipients[index];
    if (target && target.status === 'Signed') {
      setError('Cannot remove a recipient who has already signed.');
      return;
    }

    const removedId = target?.id;
    setRecipients(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      return filtered.map((r, idx) => ({ ...r, signing_order: idx + 1 }));
    });

    if (removedId) {
      setPlacedFields(prev => prev.filter(f => f.recipient_id !== removedId));
    }
    setError('');
  };

  const getRecipientColor = (id: string) => {
    return { badge: '#3b82f6', border: '#2563eb', bg: '#eff6ff', text: '#1e40af' };
  };

  // Drag and drop / resize handlers for Step 2 fields
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const xPx = e.clientX - rect.left;
    const yPx = e.clientY - rect.top;

    const x_coord = Math.max(0, Math.min(100, (xPx / rect.width) * 100));
    const y_coord = Math.max(0, Math.min(100, (yPx / rect.height) * 100));

    if (recipients.length === 0) return;

    setPlacedFields(prev => [
      ...prev,
      {
        temp_id: `field_${Date.now()}`,
        recipient_id: recipients[0].id,
        field_type: 'signature',
        page_number: currentPage,
        x_coord,
        y_coord,
        width: 25,
        height: 6,
        label: 'Signature',
        is_required: true,
      }
    ]);
  };

  const handleFieldMouseDown = (e: React.MouseEvent, field: PlacedField) => {
    e.stopPropagation();
    setActiveFieldId(field.temp_id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent, field: PlacedField) => {
    e.stopPropagation();
    // Resizing logic can be wired here or kept as passed
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await apiCall(`/v1/esignature/envelopes/${envelopeId}/`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify({
          title: documentName,
          send_in_order: sendInOrder,
          recipients: recipients.map(r => ({
            id: r.id && String(r.id).length > 15 && !isNaN(Number(r.id)) ? undefined : r.id,
            signer_name: r.signer_name,
            signer_email: r.signer_email,
            action_type: r.action_type,
            signing_order: r.signing_order
          })),
          fields: placedFields.map(f => ({
            id: f.id && String(f.id).length > 15 && !isNaN(Number(f.id)) ? undefined : f.id,
            recipient_id: f.recipient_id,
            field_type: f.field_type,
            page_number: f.page_number,
            x_coord: f.x_coord,
            y_coord: f.y_coord,
            width: f.width,
            height: f.height,
            is_required: f.is_required ?? true,
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
    <div className="max-w-5xl mx-auto space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Requests
        </button>
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

      {/* Unified Wizard Header with Step Switching & Validation */}
      <WizardHeader
        step={step}
        setStep={setStep}
        primaryColor={primaryColor}
        mergedBlobUrl={mergedBlobUrl}
        recipients={recipients}
        handleFinishAndSend={handleSave}
        onClose={onBack}
      />

      {/* Conditional Step Content */}
      {step === 1 ? (
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
        />
      ) : (
        <StepTwoCanvasWorkspace
          mergedBlobUrl={mergedBlobUrl}
          isImageFile={isImageFile}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          totalPages={totalPages}
          setTotalPages={setTotalPages}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          primaryColor={primaryColor}
          pageHeight={pageHeight}
          setPageHeight={setPageHeight}
          canvasRef={canvasRef}
          pdfCanvasRef={pdfCanvasRef}
          pdfDocRef={pdfDocRef}
          renderTaskRef={renderTaskRef}
          pdfReady={pdfReady}
          setPdfReady={setPdfReady}
          handleDropOnCanvas={handleDropOnCanvas}
          setActiveFieldId={setActiveFieldId}
          activeFieldId={activeFieldId}
          placedFields={placedFields}
          setPlacedFields={setPlacedFields}
          recipients={recipients}
          getRecipientColor={getRecipientColor}
          handleFieldMouseDown={handleFieldMouseDown}
          handleResizeMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
}