'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

const BASE_WIDTH = 800; // Match the builder's logical canvas width

// The 4 requested signature font families
const SIGNATURE_FONTS = [
  { name: 'Alex Brush', className: 'font-alex-brush' },
  { name: 'Dancing Script', className: 'font-dancing-script' },
  { name: 'Great Vibes', className: 'font-great-vibes' },
  { name: 'Whisper', className: 'font-whisper' },
];

export default function FillFormPage() {
  const params = useParams();
  const id = params?.id;

  const [formTemplate, setFormTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [fieldValues, setFieldValues] = useState({});
  const [signatureStyles, setSignatureStyles] = useState({}); // fieldId -> font index
  const [documentUrl, setDocumentUrl] = useState(null);
  const [isImageFile, setIsImageFile] = useState(false);

  // PDF rendering states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pdfReady, setPdfReady] = useState(false);
  const [pageHeight, setPageHeight] = useState(1050);

  const pdfCanvasRef = useRef(null);
  const pdfDocRef = useRef(null);
  const renderTaskRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!id) return;

    fetch(`http://localhost:8000/api/v1/esignature/form-templates/${id}/`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load form template.');
        return res.json();
      })
      .then(async (data) => {
        setFormTemplate(data);

        const initialValues = {};
        const initialSigStyles = {};
        if (data.fields && Array.isArray(data.fields)) {
          data.fields.forEach((field) => {
            if (field.id) {
              initialValues[field.id] = field.value !== undefined ? field.value : '';
              if (field.field_type === 'signature') {
                initialSigStyles[field.id] = 0; // Default to first font style (Alex Brush)
              }
            }
          });
        }
        setFieldValues(initialValues);
        setSignatureStyles(initialSigStyles);

        if (data.document_url || data.document) {
          let rawUrl = data.document_url || data.document;
          if (rawUrl.startsWith('/')) {
            rawUrl = `http://localhost:8000${rawUrl}`;
          }
          try {
            const docRes = await fetch(rawUrl);
            if (docRes.ok) {
              const blob = await docRes.blob();
              const objectUrl = URL.createObjectURL(blob);
              setDocumentUrl(objectUrl);
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

  // Handle PDF.js initialization if it's a PDF document
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
          if (loadingTask && typeof loadingTask.destroy === 'function') {
            loadingTask.destroy();
          }
          return;
        }

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setPdfReady(true);
      } catch (error) {
        if (!cancelled) {
          console.error('PDF load failed:', error);
          setPdfReady(false);
        }
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
      }
      if (loadingTask && typeof loadingTask.destroy === 'function') {
        try { loadingTask.destroy(); } catch {}
      }
    };
  }, [documentUrl, isImageFile]);

  const renderPdfPage = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvasEl = pdfCanvasRef.current;
    if (!doc || !canvasEl || !pdfReady) return;

    if (renderTaskRef.current) {
      try { renderTaskRef.current.cancel(); } catch {}
    }

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
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF page:', err);
      }
    }
  }, [currentPage, pdfReady]);

  useEffect(() => { 
    renderPdfPage(); 
  }, [renderPdfPage]);

  const handleInputChange = (fieldId, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleSelectSignatureFont = (fieldId, fontIdx) => {
    setSignatureStyles((prev) => ({
      ...prev,
      [fieldId]: fontIdx,
    }));
  };

  // Check if all fields are filled
  const allFieldsFilled = formTemplate?.fields && formTemplate.fields.length > 0
    ? formTemplate.fields.every((field) => {
        const val = fieldValues[field.id];
        if (field.field_type === 'checkbox' || field.field_type === 'radio') {
          return val === true;
        }
        return val !== undefined && val !== null && String(val).trim() !== '';
      })
    : true;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!allFieldsFilled) return;
    setSubmitting(true);

    try {
      const payload = {
        field_values: Object.keys(fieldValues).map((fieldId) => ({
          form_field: fieldId,
          value: fieldValues[fieldId],
        })),
      };

      const response = await fetch(`http://localhost:8000/api/v1/esignature/form-templates/${id}/submit_response/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) throw new Error('Failed to submit form response.');

      setSuccess(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-10 text-white text-center">Loading form template...</div>;
  if (error) return <div className="p-10 text-red-500 text-center">Error: {error}</div>;
  if (success) return <div className="p-10 text-green-400 text-center font-bold text-xl">Form submitted successfully! Thank you.</div>;

  return (
    <div className="w-full min-h-screen bg-gray-950 text-white flex flex-col">
      <form onSubmit={handleSubmit} className="flex flex-col flex-1">
        {/* Top Sticky Bar */}
        <header className="bg-gray-900 border-b border-gray-800 px-6 py-4 sticky top-0 z-50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
          <div>
            <h1 className="text-xl font-bold">muchina kamau</h1>
            <p className="text-xs text-gray-400">Fill in the fields directly on the document.</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={!allFieldsFilled || submitting}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold text-xs transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap shadow"
            >
              {submitting ? 'Submitting...' : 'Submit Form'}
            </button>
          </div>
        </header>

        {/* Main Document Workspace */}
        <main className="flex-1 flex flex-col items-center p-4 md:p-8 bg-gray-950 overflow-auto">
          {documentUrl ? (
            <div className="flex flex-col items-center w-full">
              {totalPages > 1 && (
                <div className="bg-gray-900 border border-gray-800 px-4 py-2 rounded-xl mb-4 flex items-center gap-4 text-xs text-gray-300">
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-2 py-1 bg-gray-800 rounded disabled:opacity-40"
                  >
                    Previous
                  </button>
                  <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 py-1 bg-gray-800 rounded disabled:opacity-40"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* Strict matching canvas box container */}
              <div
                style={{
                  width: BASE_WIDTH,
                  height: pageHeight,
                }}
                className="relative bg-white shadow-2xl rounded-lg border border-gray-800 overflow-hidden"
              >
                {/* Background Document Layer */}
                {isImageFile ? (
                  <img
                    src={documentUrl}
                    alt="Template background"
                    onLoad={(e) => {
                      const img = e.currentTarget;
                      setPageHeight(Math.round((img.naturalHeight / img.naturalWidth) * BASE_WIDTH));
                    }}
                    className="absolute inset-0 z-0 w-full h-full object-contain pointer-events-none"
                    draggable={false}
                  />
                ) : (
                  <canvas ref={pdfCanvasRef} className="absolute top-0 left-0 z-0 pointer-events-none" />
                )}

                {/* Field Overlay Layer */}
                <div className="absolute inset-0 z-20 pointer-events-none">
                  {formTemplate?.fields &&
                    formTemplate.fields
                      .filter((f) => (f.page_number || 1) === currentPage)
                      .map((field) => {
                        const val = fieldValues[field.id];
                        const isFilled = val !== undefined && val !== '' && val !== false;
                        const isSignature = field.field_type === 'signature';
                        const currentSigStyleIndex = signatureStyles[field.id] || 0;
                        const sigFontClass = SIGNATURE_FONTS[currentSigStyleIndex].className;

                        return (
                          <div
                            key={field.id}
                            style={{
                              top: `${field.y_coord}%`,
                              left: `${field.x_coord}%`,
                              width: `${field.width}%`,
                              height: `${field.height}%`,
                            }}
                            className={`absolute pointer-events-auto flex items-center px-1 transition-all ${
                              isFilled
                                ? 'bg-transparent border-none shadow-none ring-0 overflow-hidden' 
                                : 'bg-white/95 backdrop-blur-xs border-2 border-purple-500 shadow-sm rounded-md focus-within:ring-2 focus-within:ring-purple-400 overflow-visible'
                            }`}
                          >
                            {field.field_type === 'checkbox' || field.field_type === 'radio' ? (
                              <div className="flex items-center gap-1.5 w-full h-full">
                                <input
                                  type="checkbox"
                                  checked={val ?? (field.value || false)}
                                  onChange={(e) => handleInputChange(field.id, e.target.checked)}
                                  className="rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                                />
                                {!isFilled && <span className="text-[10px] text-gray-700 truncate">{field.label}</span>}
                              </div>
                            ) : field.field_type === 'dropdown' ? (
                              <select
                                value={val ?? (field.value || '')}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className="w-full bg-transparent outline-none text-xs text-gray-900 font-medium"
                              >
                                <option value="">Select {field.label}</option>
                              </select>
                            ) : isSignature ? (
                              <div className="relative w-full h-full flex items-center group">
                                <input
                                  type="text"
                                  placeholder={field.label || 'Type name for signature'}
                                  value={val ?? (field.value || '')}
                                  onChange={(e) => handleInputChange(field.id, e.target.value)}
                                  className={`w-full h-full bg-transparent outline-none text-xl text-black px-1 placeholder:text-gray-400 placeholder:text-xs placeholder:not-italic ${sigFontClass}`}
                                />
                                
                                {/* Signature Generator / Selector Popover Box */}
                                {isFilled && (
                                  <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:flex flex-col bg-gray-900 border border-gray-700 rounded-lg shadow-2xl p-2 z-50 whitespace-nowrap gap-1.5 w-64">
                                    <div className="flex items-center justify-between border-b border-gray-800 pb-1">
                                      <span className="text-[11px] text-gray-300 font-semibold">Select Signature Style</span>
                                      <span className="text-[9px] text-purple-400">Editable text</span>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                      {SIGNATURE_FONTS.map((font, idx) => (
                                        <button
                                          key={font.name}
                                          type="button"
                                          onClick={() => handleSelectSignatureFont(field.id, idx)}
                                          className={`text-left px-2.5 py-1.5 rounded text-lg hover:bg-gray-800 transition flex items-center justify-between ${font.className} ${
                                            currentSigStyleIndex === idx ? 'bg-purple-600/30 text-purple-300 font-bold border border-purple-500/50' : 'text-gray-200 bg-gray-950/40'
                                          }`}
                                        >
                                          <span className="truncate">{val}</span>
                                          <span className="text-[9px] text-gray-400 font-sans ml-2 shrink-0">{font.name}</span>
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <input
                                type={field.field_type === 'date' || field.field_type === 'sign_date' ? 'date' : 'text'}
                                placeholder={field.label}
                                value={val ?? (field.value || '')}
                                onChange={(e) => handleInputChange(field.id, e.target.value)}
                                className="w-full h-full bg-transparent outline-none text-[11px] md:text-xs px-1 text-black font-medium placeholder:text-gray-400"
                              />
                            )}
                          </div>
                        );
                      })}
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-gray-500 italic text-sm">No document background available for preview.</div>
          )}
        </main>
      </form>
    </div>
  );
}