import React, { useRef, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, ExternalLink, Trash2, Maximize2 } from 'lucide-react';
import { BASE_WIDTH, Recipient, PlacedField } from '../constants/esignatureConstants';

interface StepTwoProps {
  mergedBlobUrl: string | null;
  isImageFile: boolean;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  setTotalPages: (pages: number) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  primaryColor: string;
  pageHeight: number;
  setPageHeight: (height: number) => void;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  pdfCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  pdfDocRef: React.MutableRefObject<any>;
  renderTaskRef: React.MutableRefObject<any>;
  pdfReady: boolean;
  setPdfReady: (ready: boolean) => void;
  handleDropOnCanvas: (e: React.DragEvent) => void;
  setActiveFieldId: (id: any) => void;
  activeFieldId: any;
  placedFields: PlacedField[];
  setPlacedFields: React.Dispatch<React.SetStateAction<PlacedField[]>>;
  recipients: Recipient[];
  getRecipientColor: (id: string) => any;
  handleFieldMouseDown: (e: React.MouseEvent, field: PlacedField) => void;
  handleResizeMouseDown: (e: React.MouseEvent, field: PlacedField) => void;
}

export function StepTwoCanvasWorkspace({
  mergedBlobUrl,
  isImageFile,
  currentPage,
  setCurrentPage,
  totalPages,
  setTotalPages,
  zoomLevel,
  setZoomLevel,
  primaryColor,
  pageHeight,
  setPageHeight,
  canvasRef,
  pdfCanvasRef,
  pdfDocRef,
  renderTaskRef,
  pdfReady,
  setPdfReady,
  handleDropOnCanvas,
  setActiveFieldId,
  activeFieldId,
  placedFields,
  setPlacedFields,
  recipients,
  getRecipientColor,
  handleFieldMouseDown,
  handleResizeMouseDown,
}: StepTwoProps) {
  
useEffect(() => {
    let cancelled = false;

    const loadPdf = async () => {
      if (!mergedBlobUrl || isImageFile) {
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

        const loadingTask = pdfjs.getDocument({ url: mergedBlobUrl });
        const doc = await loadingTask.promise;

        if (cancelled) {
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
        try {
          renderTaskRef.current.cancel();
        } catch {}
        renderTaskRef.current = null;
      }
      // Do not call doc.cleanup() here on unmount to prevent rendering collisions when going back/forward
      pdfDocRef.current = null;
    };
  }, [mergedBlobUrl, isImageFile, pdfDocRef, renderTaskRef, setCurrentPage, setPdfReady, setTotalPages]);
  const renderPdfPage = useCallback(async () => {
    const doc = pdfDocRef.current;
    const canvasEl = pdfCanvasRef.current;
    if (!doc || !canvasEl || !pdfReady) return;

    // Safely cancel and wait for the previous render task to fully abort
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
        await renderTaskRef.current.promise.catch(() => {});
      } catch {}
      renderTaskRef.current = null;
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

      ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

      const renderTask = page.render({ canvasContext: ctx, viewport });
      renderTaskRef.current = renderTask;

      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== 'RenderingCancelledException') {
        console.error('Error rendering PDF page:', err);
      }
    }
  }, [currentPage, pdfReady, setPageHeight, pdfCanvasRef, pdfDocRef, renderTaskRef]);

  useEffect(() => {
    renderPdfPage();
  }, [renderPdfPage]);

  return (
    <div
      className="flex-1 bg-gray-900/10 p-4 lg:p-8 rounded-xl overflow-auto flex flex-col items-center relative min-h-[450px] lg:min-h-[650px]"
      onClick={() => setActiveFieldId(null)}
    >
      {mergedBlobUrl && (
        <div className="flex flex-col items-center w-full">
          <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-200 mb-4 flex flex-wrap items-center justify-center gap-4 text-xs text-gray-600 z-30">
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              <span>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
              <button onClick={() => setCurrentPage((p: number) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1 hover:bg-gray-100 rounded disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <div className="flex items-center gap-2">
              <button onClick={() => setZoomLevel((z: number) => Math.max(50, z - 10))} className="p-1 hover:bg-gray-100 rounded"><ZoomOut size={16} /></button>
              <span>{zoomLevel}%</span>
              <button onClick={() => setZoomLevel((z: number) => Math.min(200, z + 10))} className="p-1 hover:bg-gray-100 rounded"><ZoomIn size={16} /></button>
            </div>
            <div className="h-4 w-px bg-gray-200 hidden sm:block" />
            <a href={mergedBlobUrl} target="_blank" rel="noreferrer" style={{ color: primaryColor }} className="font-medium flex items-center gap-1 hover:underline">
              Preview PDF <ExternalLink size={12} />
            </a>
          </div>

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
              {isImageFile ? (
                <img
                  src={mergedBlobUrl}
                  alt="Document background"
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

              <div className="absolute inset-0 z-20 pointer-events-none">
                {placedFields
                  .filter((f) => f.page_number === currentPage)
                  .map((field) => {
                    const isSelected = activeFieldId === field.temp_id;
                    const assignedRecipient = recipients.find((r) => r.id === field.recipient_id);
                    const color = getRecipientColor(field.recipient_id);

                    return (
                      <div
                        key={field.temp_id}
                        onMouseDown={(e) => handleFieldMouseDown(e, field)}
                        style={{
                          top: `${field.y_coord}%`,
                          left: `${field.x_coord}%`,
                          width: `${field.width}%`,
                          height: `${field.height}%`,
                          borderColor: color.border,
                          backgroundColor: color.bg,
                          boxShadow: isSelected ? `0 0 0 2px ${color.border}` : undefined,
                        }}
                        className={`absolute pointer-events-auto border-2 ${isSelected ? 'shadow-xl z-30' : 'shadow-xs z-20'} rounded-md text-xs flex items-center cursor-move group overflow-hidden px-1.5`}
                      >
                        <div className="w-full h-full flex items-center justify-between truncate">
                          <span style={{ color: color.text }} className="font-semibold text-[11px] truncate">
                            {field.label} ({assignedRecipient?.signer_name || `Signer #${assignedRecipient?.signing_order || ''}`})
                          </span>
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
                          style={{ backgroundColor: color.border }}
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
  );
}