'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { apiCall } from '@/lib/api';

type FieldType =
  | 'signature'
  | 'initial'
  | 'stamp'
  | 'image'
  | 'company'
  | 'full_name'
  | 'email'
  | 'sign_date'
  | 'date'
  | 'text'
  | 'split_text'
  | 'job_title'
  | 'checkbox'
  | 'dropdown'
  | 'radio'
  | 'checkbox_group'
  | 'payment'
  | 'attachment'
  | 'formula';

type Choice = { label: string; value: string };

type EnvelopeField = {
  id: string;
  recipient: string | { id: string };
  field_type?: FieldType;
  type?: FieldType;
  label?: string | null;
  page_number: number;
  x_coord: number;
  y_coord: number;
  width: number;
  height: number;
  is_required: boolean;
  value?: string | null;
  options?: string[] | Choice[] | string | null;
  settings?: {
    placeholder?: string;
    readonly?: boolean;
    max_length?: number;
    accepted_file_types?: string;
    currency?: string;
    amount?: string | number;
    formula?: string;
  };
};

type SigningSession = {
  envelope?: {
    title?: string;
    message?: string;
    description?: string;
    document?: string | { file?: string; document_file?: string };
    document_file?: string;
    document_file_url?: string;
  };
  document?: { file?: string };
  recipient?: {
    id: string;
    status?: string;
    signer_name?: string;
    signer_email?: string;
  };
  fields?: EnvelopeField[];
};

type PdfDocument = {
  numPages: number;
  getPage: (pageNumber: number) => Promise<{
    getViewport: (options: { scale: number }) => { width: number; height: number };
    render: (options: {
      canvasContext: CanvasRenderingContext2D;
      viewport: { width: number; height: number };
    }) => { promise: Promise<void> };
  }>;
};

const SIGNATURE_FONTS = [
  { id: 'classic', name: 'Classic', family: '"Segoe Script", "Brush Script MT", cursive' },
  { id: 'elegant', name: 'Elegant', family: '"URW Chancery L", "Apple Chancery", cursive' },
  { id: 'modern', name: 'Modern', family: '"Bradley Hand", "Comic Sans MS", cursive' },
] as const;

type SignatureFontId = (typeof SIGNATURE_FONTS)[number]['id'];

const today = () => new Date().toISOString().slice(0, 10);

function recipientIdOf(field: EnvelopeField) {
  return typeof field.recipient === 'string' ? field.recipient : field.recipient?.id;
}

function choicesFor(field: EnvelopeField): Choice[] {
  if (Array.isArray(field.options)) {
    return field.options.map((option) =>
      typeof option === 'string' ? { label: option, value: option } : option,
    );
  }

  if (typeof field.options === 'string') {
    try {
      const parsed: unknown = JSON.parse(field.options);
      if (Array.isArray(parsed)) {
        return parsed.map((option) =>
          typeof option === 'string'
            ? { label: option, value: option }
            : (option as Choice),
        );
      }
    } catch {
      return field.options
        .split(',')
        .map((option) => option.trim())
        .filter(Boolean)
        .map((option) => ({ label: option, value: option }));
    }
  }

  return [
    { label: 'Option 1', value: 'Option 1' },
    { label: 'Option 2', value: 'Option 2' },
    { label: 'Option 3', value: 'Option 3' },
  ];
}

export default function SignDocumentPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const envelopeId = params?.id;
  const recipientId = searchParams.get('recipient');

  const [loading, setLoading] = useState(true);
  const [sessionData, setSessionData] = useState<SigningSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAgreed, setHasAgreed] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [totalPages, setTotalPages] = useState(1);
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [fieldFiles, setFieldFiles] = useState<Record<string, File>>({});
  const [signatureFonts, setSignatureFonts] = useState<Record<string, SignatureFontId>>({});
  const [signatureField, setSignatureField] = useState<EnvelopeField | null>(null);
  const [signatureName, setSignatureName] = useState('');
  const [signatureFont, setSignatureFont] = useState<SignatureFontId>('classic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [successState, setSuccessState] = useState(false);
  const [alreadySignedState, setAlreadySignedState] = useState(false);

  const pdfDocRef = useRef<PdfDocument | null>(null);
  const canvasRefs = useRef<Record<number, HTMLCanvasElement | null>>({});

  const fields = useMemo(
    () =>
      (sessionData?.fields ?? []).filter(
        (field) => recipientIdOf(field) === sessionData?.recipient?.id,
      ),
    [sessionData],
  );

  const completedRequired = fields.filter((field) => {
    if (!field.is_required) return false;
    const value = fieldValues[field.id]?.trim();
    return Boolean(value && value !== 'false' && value !== '[]');
  }).length;
  const requiredTotal = fields.filter((field) => field.is_required).length;
  const completion = requiredTotal === 0 ? 100 : Math.round((completedRequired / requiredTotal) * 100);

  useEffect(() => {
    if (!envelopeId || !recipientId) {
      setError('This signing link is incomplete or invalid.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSigningSession() {
      try {
        setLoading(true);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

        const data = (await apiCall(
          `/v1/esignature/envelopes/${envelopeId}/signing-session/?recipient=${recipientId}`,
          { method: 'GET', requiresAuth: false },
        )) as SigningSession;
        if (cancelled) return;

        setSessionData(data);
        if (data.recipient?.status?.toLowerCase() === 'signed') {
          setAlreadySignedState(true);
        } else {
          setShowConsentModal(true);
        }

        const values: Record<string, string> = {};
        const fonts: Record<string, SignatureFontId> = {};
        for (const field of data.fields ?? []) {
          const fieldType = field.field_type ?? field.type ?? 'text';
          let initialValue = field.value ?? '';
          if (!initialValue && fieldType === 'full_name') initialValue = data.recipient?.signer_name ?? '';
          if (!initialValue && fieldType === 'email') initialValue = data.recipient?.signer_email ?? '';
          if (!initialValue && fieldType === 'sign_date') initialValue = today();
          values[field.id] = initialValue;
          fonts[field.id] = 'classic';
        }
        setFieldValues(values);
        setSignatureFonts(fonts);

        let rawFileUrl: string | undefined;
        if (typeof data.envelope?.document_file_url === 'string') {
          rawFileUrl = data.envelope.document_file_url;
        } else if (typeof data.envelope?.document === 'object' && data.envelope.document) {
          rawFileUrl = data.envelope.document.file ?? data.envelope.document.document_file;
        } else if (typeof data.envelope?.document_file === 'string') {
          rawFileUrl = data.envelope.document_file;
        } else if (typeof data.document?.file === 'string') {
          rawFileUrl = data.document.file;
        }

        if (!rawFileUrl && typeof data.envelope?.document === 'string') {
          try {
            const documentData = (await apiCall(
              `/v1/esignature/documents/${data.envelope.document}/`,
              { method: 'GET', requiresAuth: false },
            )) as { file?: string; document_file?: string };
            rawFileUrl = documentData.file ?? documentData.document_file;
          } catch {
            rawFileUrl = `/media/documents/${data.envelope.document}.pdf`;
          }
        }

        if (!rawFileUrl) throw new Error('The document file is unavailable.');
        const fileUrl = rawFileUrl.startsWith('http')
          ? rawFileUrl
          : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${rawFileUrl}`;
        const loadingTask = pdfjsLib.getDocument({ url: fileUrl });
        const pdf = (await loadingTask.promise) as PdfDocument;
        if (cancelled) return;
        pdfDocRef.current = pdf;
        setTotalPages(pdf.numPages);
      } catch (caught) {
        if (!cancelled) {
          const message = caught instanceof Error ? caught.message : 'This signing link is invalid or expired.';
          setError(message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchSigningSession();
    return () => {
      cancelled = true;
    };
  }, [envelopeId, recipientId]);

  useEffect(() => {
    if (!pdfDocRef.current || showConsentModal || alreadySignedState) return;
    let cancelled = false;

    async function renderPages() {
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber += 1) {
        const canvas = canvasRefs.current[pageNumber];
        if (!canvas || !pdfDocRef.current || cancelled) continue;
        try {
          const page = await pdfDocRef.current.getPage(pageNumber);
          const viewport = page.getViewport({ scale: 1.5 });
          const context = canvas.getContext('2d');
          if (!context) continue;
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          await page.render({ canvasContext: context, viewport }).promise;
        } catch {
          if (!cancelled) setPdfLoadError('One or more document pages could not be displayed.');
        }
      }
    }

    void renderPages();
    return () => {
      cancelled = true;
    };
  }, [totalPages, showConsentModal, alreadySignedState]);

  function updateField(fieldId: string, value: string) {
    setFieldValues((current) => ({ ...current, [fieldId]: value }));
    setInvalidFields((current) => {
      const next = new Set(current);
      next.delete(fieldId);
      return next;
    });
    setSubmitError(null);
  }

  function openSignature(field: EnvelopeField) {
    const fieldType = field.field_type ?? field.type;
    const signerName = sessionData?.recipient?.signer_name ?? '';
    const existing = fieldValues[field.id] ?? '';
    setSignatureField(field);
    setSignatureName(existing || (fieldType === 'initial' ? initialsOf(signerName) : signerName));
    setSignatureFont(signatureFonts[field.id] ?? 'classic');
  }

  function applySignature() {
    if (!signatureField || !signatureName.trim()) return;
    updateField(signatureField.id, signatureName.trim());
    setSignatureFonts((current) => ({ ...current, [signatureField.id]: signatureFont }));
    setSignatureField(null);
  }

  function validateFields() {
    const invalid = new Set<string>();
    for (const field of fields) {
      if (!field.is_required) continue;
      const value = fieldValues[field.id]?.trim();
      if (!value || value === 'false' || value === '[]') invalid.add(field.id);
      if ((field.field_type ?? field.type) === 'email' && value && !/^\S+@\S+\.\S+$/.test(value)) {
        invalid.add(field.id);
      }
    }
    setInvalidFields(invalid);
    if (invalid.size > 0) {
      setSubmitError(`Complete the ${invalid.size} highlighted required field${invalid.size === 1 ? '' : 's'}.`);
      document.getElementById(`field-${Array.from(invalid)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return false;
    }
    return true;
  }

  async function handleCompleteSigning() {
    if (isSubmitting || !validateFields()) return;
    try {
      setIsSubmitting(true);
      setSubmitError(null);
      const formattedFields = fields.map((field) => ({
        id: field.id,
        value: fieldValues[field.id] ?? '',
        ...(field.field_type === 'signature' || field.field_type === 'initial'
          ? { font_family: signatureFonts[field.id] ?? 'classic' }
          : {}),
      }));
      const formData = new FormData();
      formData.append('fields', JSON.stringify(formattedFields));
      Object.entries(fieldFiles).forEach(([fieldId, file]) => {
        formData.append(`field_file_${fieldId}`, file, file.name);
      });
      await apiCall(`/v1/esignature/envelopes/${envelopeId}/recipients/${recipientId}/sign/`, {
        method: 'POST',
        requiresAuth: false,
        body: formData,
      });
      setSuccessState(true);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : 'Unable to complete signing.';
      if (message.toLowerCase().includes('already signed')) setAlreadySignedState(true);
      else setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loading) return <CenteredState kind="loading" title="Preparing your document" detail="Creating a secure signing session…" />;
  if (error) return <CenteredState kind="error" title="Unable to open document" detail={error} />;
  if (alreadySignedState) return <CenteredState kind="info" title="Document already signed" detail="Your signature has already been recorded. No further action is required." />;
  if (successState) return <CenteredState kind="success" title="Signing complete" detail="Your signature was securely recorded and the document has moved to the next step." />;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100 text-slate-950">
      {showConsentModal && (
        <Modal title="Electronic record and signature disclosure">
          <p className="text-sm leading-6 text-slate-600">
            By continuing, you consent to use electronic records and signatures for this document and confirm that you can access and retain them.
          </p>
          <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
            <input type="checkbox" checked={hasAgreed} onChange={(event) => setHasAgreed(event.target.checked)} className="mt-0.5 h-4 w-4 accent-emerald-700" />
            <span className="text-sm font-medium text-slate-800">I agree to use electronic records and signatures.</span>
          </label>
          <button type="button" disabled={!hasAgreed} onClick={() => setShowConsentModal(false)} className="mt-5 w-full rounded-md bg-emerald-700 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-40">
            Review document
          </button>
        </Modal>
      )}

      {signatureField && (
        <Modal title={(signatureField.field_type ?? signatureField.type) === 'initial' ? 'Adopt your initials' : 'Adopt your signature'} onClose={() => setSignatureField(null)}>
          <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Your name</label>
          <input autoFocus value={signatureName} onChange={(event) => setSignatureName(event.target.value)} className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none ring-emerald-600 focus:ring-2" placeholder="Enter your full name" />
          <div className="mt-5 space-y-2">
            {SIGNATURE_FONTS.map((font) => (
              <button key={font.id} type="button" onClick={() => setSignatureFont(font.id)} className={`flex min-h-16 w-full items-center justify-between rounded-md border px-4 py-3 text-left transition ${signatureFont === font.id ? 'border-emerald-700 bg-emerald-50 ring-1 ring-emerald-700' : 'border-slate-200 bg-white hover:border-slate-400'}`}>
                <span className="text-xs font-semibold text-slate-500">{font.name}</span>
                <span className="truncate pl-4 text-2xl text-slate-900" style={{ fontFamily: font.family }}>{signatureName || 'Your signature'}</span>
              </button>
            ))}
          </div>
          <p className="mt-4 text-xs leading-5 text-slate-500">By selecting Adopt and sign, you agree this typed mark represents your electronic signature.</p>
          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => setSignatureField(null)} className="flex-1 rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
            <button type="button" disabled={!signatureName.trim()} onClick={applySignature} className="flex-1 rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-40">Adopt and sign</button>
          </div>
        </Modal>
      )}

      <header className="z-20 flex shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-900 text-sm font-bold text-white">S</span>
            <div className="min-w-0">
              <h1 className="truncate text-sm font-semibold sm:text-base">{sessionData?.envelope?.title || 'Signature request'}</h1>
              <p className="truncate text-xs text-slate-500">Signing as {sessionData?.recipient?.signer_name || sessionData?.recipient?.signer_email}</p>
            </div>
          </div>
        </div>
        <button type="button" onClick={handleCompleteSigning} disabled={isSubmitting} className="shrink-0 rounded-md bg-emerald-700 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-wait disabled:opacity-60 sm:px-5 sm:text-sm">
          {isSubmitting ? 'Submitting…' : 'Finish signing'}
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-72 shrink-0 flex-col border-r border-slate-200 bg-white p-5 md:flex">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Your progress</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full bg-emerald-600 transition-all" style={{ width: `${completion}%` }} /></div>
          <p className="mt-2 text-sm font-semibold text-slate-800">{completedRequired} of {requiredTotal} required fields</p>
          <div className="mt-6 border-t border-slate-100 pt-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Message</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">{sessionData?.envelope?.message || sessionData?.envelope?.description || 'Review the document and complete every field marked as required.'}</p>
          </div>
          <div className="mt-auto border-t border-slate-100 pt-4 text-xs leading-5 text-slate-400">Secure electronic signature session</div>
        </aside>

        <main className="min-w-0 flex-1 overflow-y-auto bg-slate-200 p-3 sm:p-6 lg:p-8">
          {(submitError || pdfLoadError) && <div role="alert" className="mx-auto mb-4 max-w-3xl rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">{submitError || pdfLoadError}</div>}
          <div className="mx-auto max-w-3xl space-y-6 pb-16">
            {Array.from({ length: totalPages }, (_, index) => {
              const pageNumber = index + 1;
              const pageFields = fields.filter((field) => field.page_number === pageNumber);
              return (
                <section key={pageNumber} aria-label={`Document page ${pageNumber}`} className="relative overflow-hidden bg-white shadow-xl ring-1 ring-slate-300">
                  <canvas ref={(element) => { canvasRefs.current[pageNumber] = element; }} className="block h-auto w-full" />
                  {pageFields.map((field) => (
                    <FieldControl key={field.id} field={field} value={fieldValues[field.id] ?? ''} file={fieldFiles[field.id]} fontId={signatureFonts[field.id] ?? 'classic'} invalid={invalidFields.has(field.id)} onChange={(value) => updateField(field.id, value)} onFile={(file) => { setFieldFiles((current) => ({ ...current, [field.id]: file })); updateField(field.id, file.name); }} onSignature={() => openSignature(field)} />
                  ))}
                  <span className="absolute bottom-2 right-2 rounded bg-slate-950/75 px-2 py-1 text-[10px] font-medium text-white">{pageNumber} / {totalPages}</span>
                </section>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

function FieldControl({ field, value, file, fontId, invalid, onChange, onFile, onSignature }: { field: EnvelopeField; value: string; file?: File; fontId: SignatureFontId; invalid: boolean; onChange: (value: string) => void; onFile: (file: File) => void; onSignature: () => void }) {
  const type = field.field_type ?? field.type ?? 'text';
  const label = field.label || type.replaceAll('_', ' ');
  const options = choicesFor(field);
  const selectedChecks = parseCheckedValues(value);
  const font = SIGNATURE_FONTS.find((item) => item.id === fontId) ?? SIGNATURE_FONTS[0];
  const commonInput = 'h-full w-full border-0 bg-transparent px-2 text-xs font-medium text-slate-950 outline-none placeholder:text-slate-400';

  let control: React.ReactNode;
  if (type === 'signature' || type === 'initial') {
    control = <button type="button" onClick={onSignature} className="flex h-full w-full items-center justify-center overflow-hidden px-2 text-slate-900"><span className={value ? 'truncate text-lg' : 'text-[11px] font-semibold text-amber-800'} style={value ? { fontFamily: font.family } : undefined}>{value || `Adopt ${type === 'initial' ? 'initials' : 'signature'}`}</span></button>;
  } else if (type === 'checkbox') {
    control = <label className="flex h-full cursor-pointer items-center gap-2 px-2 text-[11px] font-medium"><input type="checkbox" checked={value === 'true'} onChange={(event) => onChange(event.target.checked ? 'true' : 'false')} className="h-4 w-4 accent-emerald-700" /><span className="truncate">{label}</span></label>;
  } else if (type === 'checkbox_group') {
    control = <div className="flex h-full flex-wrap items-center gap-x-3 gap-y-1 overflow-y-auto px-2 py-1">{options.map((option) => <label key={option.value} className="flex items-center gap-1 text-[10px]"><input type="checkbox" checked={selectedChecks.includes(option.value)} onChange={(event) => { const next = event.target.checked ? [...selectedChecks, option.value] : selectedChecks.filter((item) => item !== option.value); onChange(JSON.stringify(next)); }} className="h-3.5 w-3.5 accent-emerald-700" />{option.label}</label>)}</div>;
  } else if (type === 'radio') {
    control = <div className="flex h-full flex-wrap items-center gap-x-3 gap-y-1 overflow-y-auto px-2 py-1">{options.map((option) => <label key={option.value} className="flex items-center gap-1 text-[10px]"><input type="radio" name={`radio-${field.id}`} checked={value === option.value} onChange={() => onChange(option.value)} className="accent-emerald-700" />{option.label}</label>)}</div>;
  } else if (type === 'dropdown') {
    control = <select value={value} onChange={(event) => onChange(event.target.value)} className={commonInput}><option value="">Select…</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>;
  } else if (type === 'image' || type === 'attachment') {
    control = <label className="flex h-full cursor-pointer items-center justify-center overflow-hidden px-2 text-[10px] font-semibold text-sky-800"><input type="file" accept={type === 'image' ? 'image/*' : field.settings?.accepted_file_types} onChange={(event) => { const selected = event.target.files?.[0]; if (selected) onFile(selected); }} className="sr-only" /><span className="truncate">{file?.name || value || (type === 'image' ? 'Choose image' : 'Attach file')}</span></label>;
  } else if (type === 'date' || type === 'sign_date') {
    control = <input type="date" value={value} readOnly={type === 'sign_date' || field.settings?.readonly} onChange={(event) => onChange(event.target.value)} className={commonInput} />;
  } else if (type === 'formula') {
    control = <output className="flex h-full items-center px-2 text-xs font-semibold text-slate-700">{value || field.settings?.formula || 'Calculated value'}</output>;
  } else if (type === 'payment') {
    control = <div className="flex h-full items-center gap-1 px-2"><span className="text-[10px] font-semibold text-emerald-800">{field.settings?.currency || 'Payment'}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={field.settings?.amount ? String(field.settings.amount) : 'Reference'} className="min-w-0 flex-1 border-0 bg-transparent text-xs font-medium outline-none" /></div>;
  } else {
    control = <input type={type === 'email' ? 'email' : 'text'} value={value} readOnly={field.settings?.readonly} maxLength={field.settings?.max_length} onChange={(event) => onChange(event.target.value)} placeholder={field.settings?.placeholder || `Enter ${label.toLowerCase()}`} className={`${commonInput} ${type === 'split_text' ? 'font-mono tracking-[0.3em]' : ''}`} />;
  }

  return (
    <div 
      id={`field-${field.id}`} 
      className={`absolute z-10 overflow-visible rounded border bg-amber-50/95 shadow-sm transition focus-within:ring-2 ${
        invalid ? 'border-red-600 ring-2 ring-red-500' : 'border-amber-500 focus-within:ring-amber-500'
      }`} 
      style={{ 
        top: `${field.y_coord}%`, 
        left: `${field.x_coord}%`, 
        width: `${Math.max(field.width, 12)}%`, 
        height: `${Math.max(field.height, 5)}%`,
        minHeight: '26px' 
      }}
    >
      <span className="pointer-events-none absolute left-1 top-0 z-20 max-w-[calc(100%-8px)] -translate-y-1/2 truncate rounded-sm bg-amber-600 px-1 text-[8px] font-bold uppercase text-white shadow-xs">
        {label}{field.is_required ? ' *' : ''}
      </span>
      {control}
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose?: () => void }) {
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={title}><div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-200 bg-white p-6 shadow-2xl sm:p-8">{onClose && <button type="button" onClick={onClose} aria-label="Close" className="float-right flex h-8 w-8 items-center justify-center rounded-full text-xl text-slate-500 hover:bg-slate-100">×</button>}<h2 className="pr-8 text-xl font-bold text-slate-950">{title}</h2><div className="mt-3">{children}</div></div></div>;
}

function CenteredState({ kind, title, detail }: { kind: 'loading' | 'error' | 'info' | 'success'; title: string; detail: string }) {
  const symbol = kind === 'success' ? '✓' : kind === 'error' ? '!' : kind === 'info' ? 'i' : '';
  return <main className="flex min-h-dvh items-center justify-center bg-slate-100 p-4"><section className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-center shadow-xl">{kind === 'loading' ? <div className="mx-auto mb-5 h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-700" /> : <div className={`mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full text-xl font-bold ${kind === 'success' ? 'bg-emerald-100 text-emerald-700' : kind === 'error' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-700'}`}>{symbol}</div>}<h1 className="text-xl font-bold text-slate-950">{title}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></section></main>;
}

function initialsOf(name: string) {
  return name.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 4).toUpperCase();
}

function parseCheckedValues(value: string): string[] {
  if (!value) return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return value.split(',').map((item) => item.trim()).filter(Boolean);
  }
}