'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  FileText, Trash2, X, Save, ArrowLeft, Upload,
  CheckSquare, Calendar, Mail, User, FileSignature,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight, Maximize2, ExternalLink
} from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

interface FormTemplateBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
  editingTemplate: any | null;
  apiCall: (url: string, options?: any) => Promise<any>;
}

const STANDARD_FIELDS = [
  { type: 'signature', label: 'Signature', icon: FileSignature },
  { type: 'initial', label: 'Initial', icon: FileSignature },
  { type: 'stamp', label: 'Stamp', icon: FileSignature },
  { type: 'company', label: 'Company', icon: User },
  { type: 'email', label: 'Email', icon: Mail },
  { type: 'date', label: 'Date', icon: Calendar },
  { type: 'split_text', label: 'Split text', icon: FileText },
  { type: 'checkbox', label: 'Checkbox', icon: CheckSquare },
  { type: 'radio', label: 'Radio', icon: CheckSquare },
  { type: 'payment', label: 'Payment', icon: FileText },
  { type: 'formula', label: 'Formula', icon: FileText },
];

const CUSTOM_FIELDS = [
  { type: 'text', label: 'Text', icon: FileText },
  { type: 'full_name', label: 'Full name', icon: User },
  { type: 'job_title', label: 'Job title', icon: User },
  { type: 'sign_date', label: 'Sign date', icon: Calendar },
  { type: 'dropdown', label: 'Dropdown', icon: CheckSquare },
  { type: 'checkbox_group', label: 'Checkbox group', icon: CheckSquare },
  { type: 'attachment', label: 'Attachment', icon: Upload },
  { type: 'image', label: 'Image', icon: Upload },
];

const BASE_WIDTH = 800; // logical canvas width in CSS px at 100% zoom

export default function FormTemplateBuilder({
  isOpen,
  onClose,
  onSaveSuccess,
  editingTemplate,
  apiCall,
}: FormTemplateBuilderProps) {
  const { primaryColor } = useTenant();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isImageFile, setIsImageFile] = useState(false);

  const [placedFields, setPlacedFields] = useState<any[]>([]);
  const [draggedFieldDef, setDraggedFieldDef] =
    useState<{ category: string; type: string; label: string } | null>(null);

  const [activeFieldId, setActiveFieldId] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [pdfReady, setPdfReady] = useState(false);

  // Page geometry (aspect ratio) so the overlay matches the rendered page exactly
  const [pageHeight, setPageHeight] = useState(1050);

  const canvasRef = useRef<HTMLDivElement>(null);       // the stacking context
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null); // pdf.js render target
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);

  /* ------------------------------------------------------------------ */
  /* Template load                                                       */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (!isOpen) return;
    if (editingTemplate) {
      setTitle(editingTemplate.title || '');
      setDescription(editingTemplate.description || '');
      setPlacedFields(
        (editingTemplate.fields || []).map((f: any, idx: number) => ({
          ...f,
          temp_id: f.id ?? Date.now() + idx,
          value: f.value || '',
          x_coord: f.x_coord ?? 10,
          y_coord: f.y_coord ?? 10,
          width: f.width ?? 18,
          height: f.height ?? 5,
          page_number: f.page_number ?? 1,
        }))
      );
      loadDocumentUrl(editingTemplate.document_url || editingTemplate.document);
    } else {
      setTitle('');
      setDescription('');
      setUploadedFile(null);
      setFilePreviewUrl(null);
      setIsImageFile(false);
      setPlacedFields([]);
      setCurrentPage(1);
      setTotalPages(1);
      pdfDocRef.current = null;
    }
  }, [editingTemplate, isOpen]);

  const loadDocumentUrl = async (docUrl: string) => {
    if (!docUrl) {
      setFilePreviewUrl(null);
      setIsImageFile(false);
      return;
    }
    try {
      let rawUrl = docUrl;
      if (rawUrl.startsWith('/')) {
        const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api')
          .replace(/\/api\/?$/, '');
        rawUrl = `${baseUrl}${rawUrl}`;
      }
      const response = await fetch(rawUrl, {
        headers: { Authorization: `Bearer ${localStorage.getItem('access_token') || ''}` },
      });
      if (response.ok) {
        const blob = await response.blob();
        setFilePreviewUrl(URL.createObjectURL(blob));
        setIsImageFile(blob.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(rawUrl));
      } else {
        setFilePreviewUrl(rawUrl);
        setIsImageFile(/\.(png|jpe?g|webp)$/i.test(rawUrl));
      }
    } catch (err) {
      console.error('Error loading template document:', err);
      setFilePreviewUrl(docUrl);
      setIsImageFile(/\.(png|jpe?g|webp)$/i.test(docUrl));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setFilePreviewUrl(URL.createObjectURL(file));
    setIsImageFile(file.type.startsWith('image/'));
    setCurrentPage(1);
    setTotalPages(1);
    if (!title) setTitle(file.name.replace(/\.[^/.]+$/, ''));
  };

  /* ------------------------------------------------------------------ */
  /* PDF rendering with pdf.js (replaces the <iframe>)                   */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      if (!filePreviewUrl || isImageFile) {
        pdfDocRef.current = null;
        setPdfReady(false);
        return;
      }

      try {
        setPdfReady(false);

        const pdfjs: any = await import('pdfjs-dist');

        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString();

        const loadingTask = pdfjs.getDocument({ url: filePreviewUrl });
        const doc = await loadingTask.promise;

        if (cancelled) {
          await doc.destroy();
          return;
        }

        pdfDocRef.current = doc;
        setTotalPages(doc.numPages);
        setCurrentPage(1);
        setPdfReady(true);
      } catch (error) {
        console.error('PDF load failed:', error);
        setPdfReady(false);
      }
    };

    loadPdf();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        try { renderTaskRef.current.cancel(); } catch {}
        renderTaskRef.current = null;
      }
      if (pdfDocRef.current) {
        try { pdfDocRef.current.destroy(); } catch {}
        pdfDocRef.current = null;
      }
    };
  }, [filePreviewUrl, isImageFile]);

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
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF page:', err);
      }
    }
  }, [currentPage, pdfReady]);

  useEffect(() => { 
    renderPdfPage(); 
  }, [renderPdfPage]);

  /* ------------------------------------------------------------------ */
  /* Field placement / drag / resize (zoom-safe, window-level listeners)  */
  /* ------------------------------------------------------------------ */
  const handleDropOnCanvas = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedFieldDef || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect(); // already includes zoom scale
    const x = Math.max(0, Math.min(82, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(95, ((e.clientY - rect.top) / rect.height) * 100));

    const newField = {
      temp_id: Date.now() + Math.random(),
      category: draggedFieldDef.category,
      field_type: draggedFieldDef.type,
      label: draggedFieldDef.label,
      page_number: currentPage,
      x_coord: parseFloat(x.toFixed(2)),
      y_coord: parseFloat(y.toFixed(2)),
      width: 18.0,
      height: 4.0,
      is_required: true,
      value: '',
    };
    setPlacedFields((prev) => [...prev, newField]);
    setActiveFieldId(newField.temp_id);
    setDraggedFieldDef(null);
  };

  const handleFieldMouseDown = (e: React.MouseEvent, field: any) => {
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

  const handleResizeMouseDown = (e: React.MouseEvent, field: any) => {
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

        const xPercent = Math.max(0, Math.min(98,
          ((currentX - dragOffsetRef.current.x) / canvasWidth) * 100));
        const yPercent = Math.max(0, Math.min(99,
          ((currentY - dragOffsetRef.current.y) / canvasHeight) * 100));

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

          const wPct = Math.min(60, Math.max(5,
            ((mouseX - leftPx) / canvasWidth) * 100));
          const hPct = Math.min(25, Math.max(1.5,
            ((mouseY - topPx) / canvasHeight) * 100));
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

  /* ------------------------------------------------------------------ */
  /* Save                                                                */
  /* ------------------------------------------------------------------ */
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert('Please provide a template title.');
    if (placedFields.length === 0) return alert('Please place at least one field on the document layout.');

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      if (uploadedFile) formData.append('document', uploadedFile);
      formData.append('fields', JSON.stringify(placedFields.map((f) => ({
        ...(typeof f.id === 'string' || typeof f.id === 'number' ? { id: f.id } : {}),
        category: f.category,
        field_type: f.field_type,
        label: f.label,
        page_number: f.page_number,
        x_coord: f.x_coord,
        y_coord: f.y_coord,
        width: f.width,
        height: f.height,
        is_required: f.is_required,
        value: f.value || '',
      }))));

      const endpoint = editingTemplate
        ? `/v1/esignature/form-templates/${editingTemplate.id}/`
        : '/v1/esignature/form-templates/';

      await apiCall(endpoint, {
        method: editingTemplate ? 'PUT' : 'POST',
        requiresAuth: true,
        body: formData,
      });

      onSaveSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error saving template:', err);
      alert(`Failed to save template: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/85 z-50 flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* Top Navbar */}
      <div className="bg-white px-6 py-3.5 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 p-1.5 rounded-lg hover:bg-gray-100 transition">
            <ArrowLeft size={20} />
          </button>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter Template Title (e.g. Employee Onboarding)"
            style={{ '--focus-color': primaryColor } as React.CSSProperties}
            className="font-bold text-gray-900 text-base border-b border-gray-200 hover:border-gray-400 focus:border-[var(--focus-color)] outline-none px-2 py-1 w-96 transition"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveTemplate}
            style={{ backgroundColor: primaryColor }}
            className="hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition"
          >
            <Save size={16} />
            Save Template &amp; Fields ({placedFields.length})
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition">
            <X size={22} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Canvas workspace */}
        <div
          className="flex-1 bg-gray-900/10 p-8 overflow-auto flex flex-col items-center relative"
          onClick={() => setActiveFieldId(null)}
        >
          {!filePreviewUrl ? (
            <div className="my-auto bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 text-center max-w-lg shadow-md">
              <Upload size={48} style={{ color: primaryColor }} className="mx-auto mb-3" />
              <h3 className="text-base font-bold text-gray-800">Upload Document Template</h3>
              <p className="text-xs text-gray-500 mt-1 mb-6">
                Upload a PDF or image file to render the document background workspace.
              </p>
              <label 
                style={{ backgroundColor: primaryColor }}
                className="hover:opacity-90 text-white px-6 py-3 rounded-xl text-sm font-medium cursor-pointer shadow-sm transition inline-block"
              >
                Browse File (PDF / Image)
                <input type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          ) : (
            <div className="flex flex-col items-center w-full">
              {/* Toolbar */}
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 mb-4 flex items-center gap-6 text-xs text-gray-600 z-30">
                <div className="flex items-center gap-2">
                  <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-40">
                    <ChevronLeft size={16} />
                  </button>
                  <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                  <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                    className="p-1 hover:bg-gray-100 rounded disabled:opacity-40">
                    <ChevronRight size={16} />
                  </button>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <button onClick={() => setZoomLevel((z) => Math.max(50, z - 10))} className="p-1 hover:bg-gray-100 rounded">
                    <ZoomOut size={16} />
                  </button>
                  <span>{zoomLevel}%</span>
                  <button onClick={() => setZoomLevel((z) => Math.min(200, z + 10))} className="p-1 hover:bg-gray-100 rounded">
                    <ZoomIn size={16} />
                  </button>
                </div>
                <div className="h-4 w-px bg-gray-200" />
                <a href={filePreviewUrl} target="_blank" rel="noreferrer"
                  style={{ color: primaryColor }}
                  className="font-medium flex items-center gap-1 hover:underline">
                  Open File in New Tab <ExternalLink size={12} />
                </a>
              </div>

              {/* Zoom wrapper: keeps scroll area correct while scaling */}
              <div style={{ width: BASE_WIDTH * (zoomLevel / 100), height: pageHeight * (zoomLevel / 100) }}>
                <div
                  ref={canvasRef}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDropOnCanvas}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: BASE_WIDTH,
                    height: pageHeight,
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left',
                  }}
                  className="relative bg-white shadow-2xl rounded-lg border border-gray-300 select-none overflow-hidden"
                >
                  {/* Document layer (z-0) — canvas/img, never an iframe */}
                  {isImageFile ? (
                    <img
                      src={filePreviewUrl}
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

                  {/* Field overlay (z-20) — sits directly on the rendered page */}
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    {placedFields
                      .filter((f) => f.page_number === currentPage)
                      .map((field) => {
                        const isSelected = activeFieldId === field.temp_id;
                        return (
                          <div
                            key={field.temp_id}
                            onMouseDown={(e) => handleFieldMouseDown(e, field)}
                            style={{
                              top: `${field.y_coord}%`,
                              left: `${field.x_coord}%`,
                              width: `${field.width}%`,
                              height: `${field.height}%`,
                              borderColor: isSelected ? primaryColor : primaryColor,
                              boxShadow: isSelected ? `0 0 0 2px ${primaryColor}40` : undefined,
                            }}
                            className={`absolute pointer-events-auto bg-white/90 border-2 ${
                              isSelected
                                ? 'shadow-xl z-30'
                                : 'shadow-sm z-20'
                            } rounded-md text-xs flex items-center cursor-move group overflow-hidden`}
                          >
                            <div className="w-full h-full flex items-center px-1.5"
                              onMouseDown={(e) => e.stopPropagation()}>
                              {field.field_type === 'checkbox' || field.field_type === 'radio' ? (
                                <div className="flex items-center gap-1.5 w-full">
                                  <input
                                    type="checkbox"
                                    checked={!!field.value}
                                    style={{ color: primaryColor }}
                                    onChange={(e) => {
                                      const checked = e.target.checked;
                                      setPlacedFields((prev) => prev.map((f) =>
                                        f.temp_id === field.temp_id ? { ...f, value: checked } : f));
                                    }}
                                    className="rounded focus:ring-[var(--focus-color)]"
                                  />
                                  <span className="text-[11px] text-gray-700 truncate">{field.label}</span>
                                </div>
                              ) : field.field_type === 'dropdown' ? (
                                <select
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPlacedFields((prev) => prev.map((f) =>
                                      f.temp_id === field.temp_id ? { ...f, value: val } : f));
                                  }}
                                  className="w-full bg-transparent outline-none text-xs text-gray-800"
                                >
                                  <option value="">Select {field.label}</option>
                                </select>
                              ) : (
                                <input
                                  type={field.field_type === 'date' || field.field_type === 'sign_date' ? 'date' : 'text'}
                                  placeholder={field.label}
                                  value={field.value || ''}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setPlacedFields((prev) => prev.map((f) =>
                                      f.temp_id === field.temp_id ? { ...f, value: val } : f));
                                  }}
                                  className="w-full h-full bg-transparent outline-none text-xs text-gray-900 px-1 placeholder:text-gray-400"
                                />
                              )}
                            </div>

                            <button
                              type="button"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                setPlacedFields((prev) => prev.filter((f) => f.temp_id !== field.temp_id));
                                if (activeFieldId === field.temp_id) setActiveFieldId(null);
                              }}
                              className="absolute top-0.5 right-0.5 text-gray-400 hover:text-red-500 bg-white/90 p-0.5 rounded transition opacity-0 group-hover:opacity-100 z-40"
                            >
                              <Trash2 size={10} />
                            </button>

                            <div
                              onMouseDown={(e) => handleResizeMouseDown(e, field)}
                              style={{ backgroundColor: primaryColor }}
                              className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize rounded-tl flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-40"
                            >
                              <Maximize2 size={6} className="text-white" />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col p-5 overflow-y-auto">
          {activeField ? (
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-gray-800 text-sm">Field Properties</h3>
                  <button 
                    onClick={() => setActiveFieldId(null)} 
                    style={{ color: primaryColor }}
                    className="text-xs font-semibold hover:underline"
                  >
                    Done
                  </button>
                </div>
                <p className="text-xs text-gray-500">Configure label, dimensions &amp; settings.</p>
              </div>

              <div className="space-y-4 bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs">
                <div>
                  <label className="font-medium text-gray-700 block mb-1">Field Label</label>
                  <input
                    type="text"
                    value={activeField.label}
                    style={{ '--focus-color': primaryColor } as React.CSSProperties}
                    onChange={(e) => {
                      const val = e.target.value;
                      setPlacedFields((prev) => prev.map((f) =>
                        f.temp_id === activeField.temp_id ? { ...f, label: val } : f));
                    }}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-[var(--focus-color)]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-medium text-gray-700 block mb-1">Width (%)</label>
                    <input
                      type="number" step="0.5" min="5" max="60"
                      value={activeField.width}
                      style={{ '--focus-color': primaryColor } as React.CSSProperties}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 18;
                        setPlacedFields((prev) => prev.map((f) =>
                          f.temp_id === activeField.temp_id ? { ...f, width: val } : f));
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-[var(--focus-color)]"
                    />
                  </div>
                  <div>
                    <label className="font-medium text-gray-700 block mb-1">Height (%)</label>
                    <input
                      type="number" step="0.5" min="1.5" max="25"
                      value={activeField.height}
                      style={{ '--focus-color': primaryColor } as React.CSSProperties}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 4;
                        setPlacedFields((prev) => prev.map((f) =>
                          f.temp_id === activeField.temp_id ? { ...f, height: val } : f));
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 outline-none focus:border-[var(--focus-color)]"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isRequired"
                    checked={!!activeField.is_required}
                    style={{ color: primaryColor }}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setPlacedFields((prev) => prev.map((f) =>
                        f.temp_id === activeField.temp_id ? { ...f, is_required: checked } : f));
                    }}
                    className="rounded focus:ring-[var(--focus-color)]"
                  />
                  <label htmlFor="isRequired" className="font-medium text-gray-700 cursor-pointer">Required Field</label>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPlacedFields((prev) => prev.filter((f) => f.temp_id !== activeField.temp_id));
                  setActiveFieldId(null);
                }}
                className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-medium py-2 rounded-lg text-xs transition"
              >
                Delete Field
              </button>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-gray-800 text-sm mb-1">Template Toolbox</h3>
              <p className="text-xs text-gray-500 mb-4">Drag elements onto the document canvas.</p>

              <div className="space-y-4 mb-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block mb-1">Template Title</label>
                  <input
                    type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Onboarding Contract"
                    style={{ '--focus-color': primaryColor } as React.CSSProperties}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[var(--focus-color)]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase text-gray-500 tracking-wider block mb-1">Description</label>
                  <textarea
                    value={description} onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief summary..." rows={2}
                    style={{ '--focus-color': primaryColor } as React.CSSProperties}
                    className="w-full bg-white border border-gray-300 rounded px-2.5 py-1.5 text-xs outline-none focus:border-[var(--focus-color)] resize-none"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-2.5">Standard Fields</span>
                  <div className="grid grid-cols-2 gap-2">
                    {STANDARD_FIELDS.map((f) => (
                      <div
                        key={f.type}
                        draggable
                        onDragStart={() => setDraggedFieldDef({ category: 'standard', type: f.type, label: f.label })}
                        onDragEnd={() => setDraggedFieldDef(null)}
                        style={{ '--hover-color': primaryColor, '--hover-bg': `${primaryColor}10` } as React.CSSProperties}
                        className="bg-gray-50 hover:bg-[var(--hover-bg)] border border-gray-200 hover:border-[var(--hover-color)] text-gray-700 hover:text-[var(--hover-color)] p-2.5 rounded-lg text-xs font-medium cursor-grab active:cursor-grabbing transition text-center flex flex-col items-center gap-1.5"
                      >
                        <f.icon size={15} style={{ color: primaryColor }} />
                        {f.label}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100">
                  <span className="text-[11px] font-bold uppercase text-gray-400 tracking-wider block mb-2.5">Custom Fields</span>
                  <div className="grid grid-cols-2 gap-2">
                    {CUSTOM_FIELDS.map((f) => (
                      <div
                        key={f.type}
                        draggable
                        onDragStart={() => setDraggedFieldDef({ category: 'custom', type: f.type, label: f.label })}
                        onDragEnd={() => setDraggedFieldDef(null)}
                        style={{ '--hover-color': primaryColor, '--hover-bg': `${primaryColor}10` } as React.CSSProperties}
                        className="bg-gray-50 hover:bg-[var(--hover-bg)] border border-gray-200 hover:border-[var(--hover-color)] text-gray-700 hover:text-[var(--hover-color)] p-2.5 rounded-lg text-xs font-medium cursor-grab active:cursor-grabbing transition text-center flex flex-col items-center gap-1.5"
                      >
                        <f.icon size={15} style={{ color: primaryColor }} />
                        {f.label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}