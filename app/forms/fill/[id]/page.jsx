'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';

const BASE_WIDTH = 800;
const API = 'http://localhost:8000';

const SIGNATURE_FONTS = [
  { name: 'Great Vibes', family: "'Great Vibes', cursive" },
  { name: 'Alex Brush', family: "'Alex Brush', cursive" },
  { name: 'Dancing Script', family: "'Dancing Script', cursive" },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const isDateField = (t) => t === 'date' || t === 'sign_date';

export default function FillFormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const id = params?.id;
  const requestToken = searchParams.get('request_token');
  const itemId = searchParams.get('item_id');
  // Optional: You can pass a `return_url` query param from your portal, or fall back to a default route
  const returnUrl = searchParams.get('return_url');

  const [formTemplate, setFormTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [fieldValues, setFieldValues] = useState({});
  const [signatureStyles, setSignatureStyles] = useState({});
  const [activeSigField, setActiveSigField] = useState(null);
  const [documentUrl, setDocumentUrl] = useState(null);
  const [isImageFile, setIsImageFile] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfReady, setPdfReady] = useState(false);
  const [pageHeight, setPageHeight] = useState(1050);

  const pdfCanvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  /* ---------------- load template ---------------- */
  useEffect(() => {
    if (!id) return;

    fetch(`${API}/api/v1/esignature/form-templates/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load form template.');
        return res.json();
      })
      .then(async (data) => {
        setFormTemplate(data);

        const initialValues = {};
        const initialSigStyles = {};
        (Array.isArray(data.fields) ? data.fields : []).forEach((field) => {
          if (!field.id) return;
          if (isDateField(field.field_type)) {
            initialValues[field.id] = field.value || todayISO();
          } else {
            initialValues[field.id] = field.value !== undefined && field.value !== null ? field.value : '';
          }
          if (field.field_type === 'signature') initialSigStyles[field.id] = 0;
        });
        setFieldValues(initialValues);
        setSignatureStyles(initialSigStyles);

        if (data.document_url || data.document) {
          let rawUrl = data.document_url || data.document;
          if (rawUrl.startsWith('/')) rawUrl = `${API}${rawUrl}`;
          try {
            const docRes = await fetch(rawUrl);
            if (docRes.ok) {
              const blob = await docRes.blob();
              setDocumentUrl(URL.createObjectURL(blob));
              setIsImageFile(blob.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(rawUrl));
            } else {
              setDocumentUrl(rawUrl);
              setIsImageFile(/\.(png|jpe?g|webp)$/i.test(rawUrl));
            }
          } catch {
            setDocumentUrl(rawUrl);
            setIsImageFile(/\.(png|jpe?g|webp)$/i.test(rawUrl));
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  /* ---------------- pdf.js ---------------- */
  useEffect(() => {
    let cancelled = false;
    let loadingTask = null;

    const loadPdf = async () => {
      if (!documentUrl || isImageFile) {
        pdfDocRef.current = null;
        setPdfReady(false);
        return;
      }
      try {
        setPdfReady(false);
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        loadingTask = pdfjs.getDocument({ url: documentUrl });
        const doc = await loadingTask.promise;
        if (cancelled) {
          loadingTask?.destroy?.();
          return;
        }
        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setPdfReady(true);
      } catch (e) {
        if (!cancelled) {
          console.error('PDF load failed:', e);
          setPdfReady(false);
        }
      }
    };

    loadPdf();
    return () => {
      cancelled = true;
      try { renderTaskRef.current?.cancel(); } catch {}
      try { loadingTask?.destroy?.(); } catch {}
    };
  }, [documentUrl, isImageFile]);

  const renderPdfPage = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvasEl = pdfCanvasRef.current;
    if (!doc || !canvasEl || !pdfReady) return;
    try { renderTaskRef.current?.cancel(); } catch {}

    try {
      const page = await doc.getPage(currentPage);
      const base = page.getViewport({ scale: 1 });
      const cssScale = BASE_WIDTH / base.width;
      const dpr = window.devicePixelRatio || 1;
      const viewport = page.getViewport({ scale: cssScale * dpr });

      canvasEl.width = viewport.width;
      canvasEl.height = viewport.height;
      canvasEl.style.width = `${BASE_WIDTH}px`;
      canvasEl.style.height = `${base.height * cssScale}px`;
      setPageHeight(Math.round(base.height * cssScale));

      const ctx = canvasEl.getContext('2d');
      if (!ctx) return;
      renderTaskRef.current = page.render({ canvasContext: ctx, viewport });
      await renderTaskRef.current.promise;
    } catch (err) {
      if (err?.name !== 'RenderingCancelledException') console.error(err);
    }
  }, [currentPage, pdfReady]);

  useEffect(() => { renderPdfPage(); }, [renderPdfPage]);

  /* ---------------- handlers ---------------- */
  const handleInputChange = (fieldId, value) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSelectSignatureFont = (fieldId, fontIdx) => {
    setSignatureStyles((prev) => ({ ...prev, [fieldId]: fontIdx }));
    setActiveSigField(null);
  };

  const fields = formTemplate?.fields ?? [];

  const allFieldsFilled = useMemo(() => {
    if (!fields.length) return true;
    return fields.every((field) => {
      const val = fieldValues[field.id];
      if (field.field_type === 'checkbox' || field.field_type === 'radio') return val === true;
      return val !== undefined && val !== null && String(val).trim() !== '';
    });
  }, [fields, fieldValues]);

  const filledCount = fields.filter((f) => {
    const v = fieldValues[f.id];
    return f.field_type === 'checkbox' || f.field_type === 'radio'
      ? v === true
      : v !== undefined && v !== null && String(v).trim() !== '';
  }).length;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allFieldsFilled) return;
    setSubmitting(true);
    try {
      const payload = {
        field_values: Object.keys(fieldValues).map((fieldId) => ({
          form_field: fieldId,
          value: fieldValues[fieldId],
          ...(signatureStyles[fieldId] !== undefined
            ? { signature_font: SIGNATURE_FONTS[signatureStyles[fieldId]].name }
            : {}),
        })),
        ...(requestToken ? { request_token: requestToken } : {}),
        ...(itemId ? { item_id: itemId } : {}),
      };

      const response = await fetch(
        `${API}/api/v1/esignature/form-templates/${id}/submit_response/`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (!response.ok) throw new Error('Failed to submit form response.');
      
      setSuccess(true);

      // Automatically route back after a brief pause, or instantly
      setTimeout(() => {
        if (returnUrl) {
          router.push(returnUrl);
        } else {
          // Fallback: go back in browser history (returns to the main upload portal page)
          router.back();
        }
      }, 1200);

    } catch (err) {
      alert(err.message);
      setSubmitting(false);
    }
  };

  /* ---------------- states ---------------- */
  if (loading) return <Shell><p className="text-slate-300">Loading document…</p></Shell>;
  if (error) return <Shell><p className="text-red-400">Error: {error}</p></Shell>;
  if (success)
    return (
      <Shell>
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 text-2xl text-emerald-400">✓</div>
          <h2 className="text-xl font-semibold text-white">Document signed successfully!</h2>
          <p className="mt-1 text-sm text-slate-400">Redirecting back to your upload portal...</p>
        </div>
      </Shell>
    );

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100">
      <FontLoader />
      <form onSubmit={handleSubmit} className="flex min-h-screen flex-col">
        {/* Header */}
        <header className="sticky top-0 z-50 flex flex-col items-center justify-between gap-4 border-b border-slate-800 bg-slate-900/90 px-6 py-4 backdrop-blur md:flex-row">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">
                {formTemplate?.name || formTemplate?.title || 'Document'}
              </h1>
              {requestToken && (
                <span className="rounded bg-indigo-500/20 px-2 py-0.5 text-[10px] font-medium text-indigo-300">
                  Requested Portal Item
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Click a field on the document to fill it. Signatures are generated from your typed name.
            </p>
          </div>

          <div className="flex items-center gap-4">
            <span className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300">
              {filledCount}/{fields.length} fields complete
            </span>
            <button
              type="submit"
              disabled={!allFieldsFilled || submitting}
              className="whitespace-nowrap rounded-lg bg-indigo-600 px-6 py-2 text-xs font-semibold shadow transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {submitting ? 'Submitting…' : 'Finish & Submit'}
            </button>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex flex-1 flex-col items-center overflow-auto p-4 md:p-8">
          {documentUrl ? (
            <div className="flex w-full flex-col items-center">
              {totalPages > 1 && (
                <div className="mb-4 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-300">
                  <button type="button" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40">Previous</button>
                  <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                  <button type="button" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="rounded bg-slate-800 px-2 py-1 disabled:opacity-40">Next</button>
                </div>
              )}

              <div
                style={{ width: BASE_WIDTH, height: pageHeight }}
                className="relative overflow-hidden rounded-lg border border-slate-800 bg-white shadow-2xl"
                onClick={() => setActiveSigField(null)}
              >
                {isImageFile ? (
                  <img
                    src={documentUrl}
                    alt="Document background"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setPageHeight(Math.round((img.naturalHeight / img.naturalWidth) * BASE_WIDTH));
                    }}
                    className="pointer-events-none absolute inset-0 z-0 h-full w-full object-contain"
                    draggable={false}
                  />
                ) : (
                  <canvas ref={pdfCanvasRef} className="pointer-events-none absolute left-0 top-0 z-0" />
                )}

                {/* Fields */}
                <div className="absolute inset-0 z-20">
                  {fields
                    .filter((f) => (f.page_number || 1) === currentPage)
                    .map((field) => {
                      const val = fieldValues[field.id];
                      const isFilled =
                        val !== undefined && val !== null && val !== '' && val !== false;
                      const isSignature = field.field_type === 'signature';
                      const styleIdx = signatureStyles[field.id] ?? 0;
                      const sigFamily = SIGNATURE_FONTS[styleIdx].family;

                      return (
                        <div
                          key={field.id}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            top: `${field.y_coord}%`,
                            left: `${field.x_coord}%`,
                            width: `${field.width}%`,
                            height: `${field.height}%`,
                          }}
                          className={`absolute flex items-center rounded-[3px] transition-all ${
                            isFilled
                              ? 'border-none bg-transparent ring-0'
                              : 'bg-indigo-50/70 ring-1 ring-inset ring-indigo-400 hover:bg-indigo-50 focus-within:ring-2 focus-within:ring-indigo-600'
                          }`}
                        >
                          {field.field_type === 'checkbox' || field.field_type === 'radio' ? (
                            <label className="flex h-full w-full cursor-pointer items-center gap-1.5 px-1">
                              <input
                                type="checkbox"
                                checked={val === true}
                                onChange={(e) => handleInputChange(field.id, e.target.checked)}
                                className="h-3.5 w-3.5 cursor-pointer accent-indigo-600"
                              />
                              {!isFilled && (
                                <span className="truncate text-[10px] text-slate-600">{field.label}</span>
                              )}
                            </label>
                          ) : field.field_type === 'dropdown' ? (
                            <select
                              value={val ?? ''}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              className="h-full w-full bg-transparent px-1 text-[11px] font-medium text-slate-900 outline-none"
                            >
                              <option value="">Select {field.label}</option>
                              {(field.options || []).map((opt) => {
                                const v = typeof opt === 'string' ? opt : opt.value ?? opt.label;
                                return <option key={v} value={v}>{typeof opt === 'string' ? opt : opt.label ?? v}</option>;
                              })}
                            </select>
                          ) : isDateField(field.field_type) ? (
                            <input
                              type="date"
                              value={val || todayISO()}
                              onChange={(e) => handleInputChange(field.id, e.target.value || todayISO())}
                              className="h-full w-full bg-transparent px-1 text-[11px] font-medium text-slate-900 outline-none"
                            />
                          ) : isSignature ? (
                            <div className="relative flex h-full w-full items-center">
                              <input
                                type="text"
                                placeholder={field.label || 'Type your full name'}
                                value={val ?? ''}
                                onFocus={() => setActiveSigField(field.id)}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                style={{ fontFamily: sigFamily }}
                                className="h-full w-full bg-transparent px-1 text-2xl leading-none text-slate-900 outline-none placeholder:font-sans placeholder:text-[10px] placeholder:text-slate-500"
                              />
                              {isFilled && (
                                <span className="pointer-events-none absolute bottom-0 left-1 right-1 border-b border-slate-400/70" />
                              )}
                              {activeSigField === field.id && String(val || '').trim() !== '' && (
                                <div className="absolute bottom-full left-0 z-50 mb-2 w-72 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl">
                                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                    <span className="text-[11px] font-semibold text-slate-200">Choose your signature</span>
                                    <button type="button" onClick={() => setActiveSigField(null)} className="text-[10px] text-slate-400 hover:text-white">Done</button>
                                  </div>
                                  <div className="mt-1.5 flex flex-col gap-1.5">
                                    {SIGNATURE_FONTS.map((font, idx) => (
                                      <button
                                        key={font.name}
                                        type="button"
                                        onClick={() => handleSelectSignatureFont(field.id, idx)}
                                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
                                          styleIdx === idx
                                            ? 'border-indigo-500 bg-indigo-500/15'
                                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-600'
                                        }`}
                                      >
                                        <span className="truncate text-2xl leading-tight text-white" style={{ fontFamily: font.family }}>
                                          {val}
                                        </span>
                                        <span className="ml-2 shrink-0 text-[9px] text-slate-400">{font.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ) : (
                            <input
                              type={field.field_type === 'email' ? 'email' : 'text'}
                              placeholder={field.label}
                              value={val ?? ''}
                              onChange={(e) => handleInputChange(field.id, e.target.value)}
                              className="h-full w-full bg-transparent px-1 text-[11px] font-medium text-slate-900 outline-none placeholder:text-slate-500 md:text-xs"
                            />
                          )}
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-sm italic text-slate-500">No document background available.</div>
          )}
        </main>
      </form>
    </div>
  );
}

function Shell({ children }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-10 text-center">
      <FontLoader />
      {children}
    </div>
  );
}

function FontLoader() {
  return (
    <link
      rel="stylesheet"
      href="https://fonts.googleapis.com/css2?family=Great+Vibes&family=Alex+Brush&family=Dancing+Script:wght@600&display=swap"
    />
  );
}