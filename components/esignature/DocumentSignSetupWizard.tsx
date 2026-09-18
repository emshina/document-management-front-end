'use client';

import { useState, useRef, useEffect } from 'react';
import { useTenant } from '@/hooks/useTenant';
import { apiCall } from '@/lib/api';
import { RECIPIENT_COLORS, DocumentSignSetupWizardProps, Recipient, PlacedField } from './constants/esignatureConstants';
import { processAndMergeFiles } from './utils/pdfMerger';
import { WizardHeader } from './components/WizardHeader';
import { StepOneDetailsRecipients } from './components/StepOneDetailsRecipients';
import { StepTwoCanvasWorkspace } from './components/StepTwoCanvasWorkspace';
import { FieldToolboxSidebar } from './components/FieldToolboxSidebar';

export default function DocumentSignSetupWizard({
  existingDocuments = [],
  onSaveSuccess,
  onClose,
}: DocumentSignSetupWizardProps) {
  const { primaryColor, tenantId } = useTenant();

  const [step, setStep] = useState<1 | 2>(1);
  const [envelopeId, setEnvelopeId] = useState<string | null>(null); // Tracks backend Draft ID
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const [documentName, setDocumentName] = useState('');
  const [description, setDescription] = useState('');
  const [sendInOrder, setSendInOrder] = useState(true);

  const [recipients, setRecipients] = useState<Recipient[]>([
    { id: '1', signer_email: '', signer_name: '', action_type: 'needs_to_sign', signing_order: 1 },
    { id: '2', signer_email: '', signer_name: '', action_type: 'needs_to_sign', signing_order: 2 }
  ]);
  const [activeRecipientId, setActiveRecipientId] = useState('1');

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [mergedBlobUrl, setMergedBlobUrl] = useState<string | null>(null);
  const [isImageFile, setIsImageFile] = useState(false);
  const [isMerging, setIsMerging] = useState(false);

  const [placedFields, setPlacedFields] = useState<PlacedField[]>([]);
  const [draggedFieldDef, setDraggedFieldDef] = useState<{ type: string; label: string } | null>(null);

  const [activeFieldId, setActiveFieldId] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pdfReady, setPdfReady] = useState(false);
  const [pageHeight, setPageHeight] = useState(1050);

  // Reference to hold Step 1's validation function
  const validateStepOneRef = useRef<() => boolean>(() => true);

  const canvasRef = useRef<HTMLDivElement>(null);
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  const getRecipientColor = (recipientId: string) => {
    const index = recipients.findIndex((r) => r.id === recipientId);
    return RECIPIENT_COLORS[(index >= 0 ? index : 0) % RECIPIENT_COLORS.length];
  };

  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const updatedFiles = [...uploadedFiles, ...files];
    setUploadedFiles(updatedFiles);
    if (!documentName && updatedFiles.length > 0) {
      setDocumentName(updatedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }

    await processAndMergeFiles(updatedFiles, setMergedBlobUrl, setIsImageFile, setCurrentPage, setTotalPages, setIsMerging);
  };

  const removeFileAtIndex = async (index: number) => {
    const updatedFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(updatedFiles);
    if (updatedFiles.length === 0) {
      setMergedBlobUrl(null);
      setIsImageFile(false);
      setCurrentPage(1);
      setTotalPages(1);
    } else {
      await processAndMergeFiles(updatedFiles, setMergedBlobUrl, setIsImageFile, setCurrentPage, setTotalPages, setIsMerging);
    }
  };

  const addRecipient = () => {
    const newId = String(Date.now());
    setRecipients([
      ...recipients,
      {
        id: newId,
        signer_email: '',
        signer_name: '',
        action_type: 'needs_to_sign',
        signing_order: recipients.length + 1
      }
    ]);
  };

  const removeRecipient = (index: number) => {
    const targetRecipient = recipients[index];
    const updated = recipients.filter((_, i) => i !== index);
    const reordered = updated.map((r, i) => ({ ...r, signing_order: i + 1 }));
    setRecipients(reordered);

    setPlacedFields((prev) => prev.filter((f) => f.recipient_id !== targetRecipient.id));

    if (activeRecipientId === targetRecipient.id && reordered.length > 0) {
      setActiveRecipientId(reordered[0].id);
    }
  };

  // Triggered when moving from Step 1 to Step 2 (Saves Draft to Backend)
// Triggered when moving from Step 1 to Step 2 (Saves Draft to Backend)
// Triggered when moving from Step 1 to Step 2 (Saves Draft to Backend)
// Triggered when moving from Step 1 to Step 2 (Saves Draft to Backend)
 const handleProceedToCanvas = async () => {
    if (validateStepOneRef.current && !validateStepOneRef.current()) {
      return;
    }

    try {
      setIsSavingDraft(true);
      const formData = new FormData();
      formData.append('title', documentName);
      formData.append('description', description || 'Draft signing request');
      formData.append('send_in_order', String(sendInOrder));
      formData.append('status', 'Draft');
      formData.append('recipients', JSON.stringify(recipients));

      if (mergedBlobUrl && uploadedFiles.length > 0) {
        const response = await fetch(mergedBlobUrl);
        const blob = await response.blob();
        const mergedFile = new File([blob], `${documentName}.pdf`, { type: 'application/pdf' });
        formData.append('file', mergedFile);
      } else {
        alert('Please attach or merge a document file.');
        setIsSavingDraft(false);
        return;
      }

      let resData;
      if (!envelopeId) {
        // First time leaving Step 1: Create Draft on backend
        resData = await apiCall('/v1/esignature/envelopes/', {
          method: 'POST',
          requiresAuth: true,
          body: formData,
        });
        setEnvelopeId(resData.id);
      } else {
        // Returning to Step 1 and updating changes
        resData = await apiCall(`/v1/esignature/envelopes/${envelopeId}/`, {
          method: 'PATCH',
          requiresAuth: true,
          body: formData,
        });
      }

      // 👉 CRITICAL FIX: Map the backend's saved recipients back to your frontend state
      // Assuming your backend returns an array of saved recipients in `resData.recipients`
      if (resData && resData.recipients) {
        setRecipients(resData.recipients);
        
        // If your old activeRecipientId no longer matches, point it to the first real recipient
        if (!resData.recipients.some((r: any) => r.id === activeRecipientId)) {
          setActiveRecipientId(resData.recipients[0].id);
        }
      }

      setStep(2);
    } catch (err: any) {
      console.error('Error saving draft:', err);
      alert(`Failed to save draft: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFieldDef || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(82, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    const newField: PlacedField = {
      temp_id: Date.now() + Math.random(),
      recipient_id: activeRecipientId,
      field_type: draggedFieldDef.type,
      label: draggedFieldDef.label,
      page_number: currentPage,
      x_coord: parseFloat(x.toFixed(2)),
      y_coord: parseFloat(y.toFixed(2)),
      width: 18.0,
      height: 4.0,
      is_required: true,
    };
    setPlacedFields((prev) => [...prev, newField]);
    setActiveFieldId(newField.temp_id);
    setDraggedFieldDef(null);
  };

  const handleFieldMouseDown = (e: React.MouseEvent, field: PlacedField) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveFieldId(field.temp_id);
    setIsDragging(true);

    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const scale = zoomLevel / 100;
      dragOffsetRef.current = {
        x: (e.clientX - rect.left) / scale - (field.x_coord / 100) * (rect.width / scale),
        y: (e.clientY - rect.top) / scale - (field.y_coord / 100) * (rect.height / scale),
      };
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent, field: PlacedField) => {
    e.stopPropagation();
    e.preventDefault();
    setActiveFieldId(field.temp_id);
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const onMove = (e: MouseEvent) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || activeFieldId === null) return;

      const scale = zoomLevel / 100;
      const canvasWidth = rect.width / scale;
      const canvasHeight = rect.height / scale;

      if (isDragging) {
        const currentX = (e.clientX - rect.left) / scale;
        const currentY = (e.clientY - rect.top) / scale;

        const xPercent = Math.max(0, Math.min(98, ((currentX - dragOffsetRef.current.x) / canvasWidth) * 100));
        const yPercent = Math.max(0, Math.min(99, ((currentY - dragOffsetRef.current.y) / canvasHeight) * 100));

        setPlacedFields((prev) => prev.map((f) =>
          f.temp_id === activeFieldId
            ? { ...f, x_coord: +xPercent.toFixed(2), y_coord: +yPercent.toFixed(2) }
            : f));
      } else if (isResizing) {
        setPlacedFields((prev) => prev.map((f) => {
          if (f.temp_id !== activeFieldId) return f;
          const leftPx = (f.x_coord / 100) * canvasWidth;
          const topPx = (f.y_coord / 100) * canvasHeight;
          const mouseX = (e.clientX - rect.left) / scale;
          const mouseY = (e.clientY - rect.top) / scale;

          const wPct = Math.min(60, Math.max(5, ((mouseX - leftPx) / canvasWidth) * 100));
          const hPct = Math.min(25, Math.max(1.5, ((mouseY - topPx) / canvasHeight) * 100));
          return { ...f, width: +wPct.toFixed(2), height: +hPct.toFixed(2) };
        }));
      }
    };

    const onUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, isResizing, activeFieldId, zoomLevel]);

  const activeField = placedFields.find((f) => f.temp_id === activeFieldId);

  // Final Step Submission (Updates existing draft envelope with fields and sends)
// Final Step Submission (Updates existing draft envelope with fields and sends)
  const handleFinishAndSend = async () => {
    if (!envelopeId) {
      alert('Draft envelope not found. Please complete step 1 first.');
      return;
    }
    if (placedFields.length === 0) {
      alert('Please place at least one field on the document layout.');
      return;
    }

    try {
      const payload = {
        fields: placedFields,
        status: 'Pending'
      };

      // 1. Save the fields and set status to Pending
      await apiCall(`/v1/esignature/envelopes/${envelopeId}/`, {
        method: 'PATCH',
        requiresAuth: true,
        body: JSON.stringify(payload),
        headers: { 'Content-Type': 'application/json' },
      });

      // 👉 2. Trigger the backend email dispatch action
      await apiCall(`/v1/esignature/envelopes/${envelopeId}/send/`, {
        method: 'POST',
        requiresAuth: true,
      });

      alert('Envelope successfully sent and email dispatched to the first recipient!');
      if (onSaveSuccess) onSaveSuccess();
      if (onClose) onClose();
    } catch (err: any) {
      console.error('Error finalizing envelope:', err);
      alert(`Failed to finalize envelope: ${err.message || 'Unknown error'}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      <WizardHeader
        step={step}
        setStep={(targetStep) => {
          if (targetStep === 2) {
            handleProceedToCanvas();
          } else {
            setStep(targetStep);
          }
        }}
        primaryColor={primaryColor}
        mergedBlobUrl={mergedBlobUrl}
        recipients={recipients}
        handleFinishAndSend={handleFinishAndSend}
        onClose={onClose}
      />

      {isSavingDraft && (
        <div className="text-center py-2 text-xs font-medium text-gray-500 animate-pulse">
          Saving draft to backend...
        </div>
      )}

      {step === 1 ? (
        <StepOneDetailsRecipients
          primaryColor={primaryColor}
          documentName={documentName}
          setDocumentName={setDocumentName}
          uploadedFiles={uploadedFiles}
          handleFilesUpload={handleFilesUpload}
          removeFileAtIndex={removeFileAtIndex}
          isMerging={isMerging}
          sendInOrder={sendInOrder}
          setSendInOrder={setSendInOrder}
          recipients={recipients}
          setRecipients={setRecipients}
          addRecipient={addRecipient}
          removeRecipient={removeRecipient}
          getRecipientColor={getRecipientColor}
          onValidateReady={(validator) => {
            validateStepOneRef.current = validator;
          }}
        />
      ) : (
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden gap-6">
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

        <FieldToolboxSidebar
            recipients={recipients}
            activeRecipientId={activeRecipientId}
            setActiveRecipientId={setActiveRecipientId}
            getRecipientColor={getRecipientColor}
            setDraggedFieldDef={setDraggedFieldDef}
            activeField={activeField}
            setActiveFieldId={setActiveFieldId}
            setPlacedFields={setPlacedFields}
            placedFields={placedFields} // 👉 Add this line here
          />
        </div>
      )}
    </div>
  );
}