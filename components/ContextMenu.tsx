// components/ContextMenu.tsx
"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import {
  FolderPlus, Search, Upload, Download, FileSpreadsheet, Trash2, Edit,
  Share2, Link as LinkIcon, FileText, Zap, Scissors, Copy, Move, Pin,
  ChevronRight, Folder, PinOff,
} from "lucide-react";
import * as api from "@/lib/documentsApi";
import { getClipboard, setClipboard, onClipboardChange } from "@/lib/dmsClipboard";
import { apiCall } from "@/lib/api";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;

  onOpenTemplateModal: () => void;
  onOpenMassFolderTemplateModal?: () => void;
  onOpenFormFillModal?: () => void;
  onOpenMassFormFillModal?: () => void;
  onOpenPropertiesModal?: (item: any) => void;
  onSearchHere?: (scope: { folder?: string; cabinet?: string }) => void;

  canUpload: boolean;
  isFolderLevel?: boolean;
  selectedItem?: any;                 // must carry { id, name, kind?, is_pinned?, tenant? }
  onUploadComplete?: () => Promise<void>;

  isFolderTemplateHidden?: boolean;
  onStartInlineCreate?: () => void;
  childKindLabel?: string;
}

export default function ContextMenu({
  x, y, onClose,
  onOpenTemplateModal, onOpenMassFolderTemplateModal,
  onOpenFormFillModal, onOpenMassFormFillModal,
  onOpenPropertiesModal, onSearchHere,
  canUpload, isFolderLevel = false, selectedItem, onUploadComplete,
  isFolderTemplateHidden = false, onStartInlineCreate, childKindLabel = "Folder",
}: ContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<"collection" | "template" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [, force] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // item kind: documents come through with a file/current_version, folders don't
  const isDocument =
    selectedItem?.kind === "document" ||
    Boolean(selectedItem?.current_version || selectedItem?.file_type);
  const targetId: string | undefined = selectedItem?.id;
  const clip = getClipboard();

  useEffect(() => onClipboardChange(() => force((n) => n + 1)), []);
  useEffect(() => () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); }, []);

  // close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  // keep the menu inside the viewport
  const [pos, setPos] = useState({ left: x, top: y });
  useEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: Math.min(x, window.innerWidth - r.width - 8),
      top: Math.min(y, window.innerHeight - r.height - 8),
    });
  }, [x, y]);

  const openSubmenu = (s: "collection" | "template") => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveSubmenu(s);
  };
  const closeSubmenu = () => {
    timeoutRef.current = setTimeout(() => setActiveSubmenu(null), 150);
  };

  /** Wrapper: runs an action, refreshes the tree, closes the menu, surfaces errors. */
  const run = async (label: string, fn: () => Promise<any>, keepOpen = false) => {
    if (!targetId) return alert("Nothing is selected.");
    setBusy(label);
    try {
      const result = await fn();
      if (onUploadComplete) await onUploadComplete();
      if (!keepOpen) onClose();
      return result;
    } catch (err) {
      alert((err as Error)?.message || `${label} failed.`);
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------ actions ------------------------------ */

  const handleProperties = () => {
    onClose();
    onOpenPropertiesModal?.(selectedItem);
  };

  const handleRename = () => {
    const newName = prompt("Enter new name:", selectedItem?.name || "");
    if (!newName || newName === selectedItem?.name) return;
    run("Rename", () =>
      isDocument ? api.renameDocument(targetId!, newName) : api.renameFolder(targetId!, newName)
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${selectedItem?.name}"? This cannot be undone.`)) return;
    run("Delete", () =>
      isDocument ? api.deleteDocument(targetId!) : api.deleteFolder(targetId!)
    );
  };

  const handlePinToggle = () => {
    const pinned = Boolean(selectedItem?.is_pinned);
    run(pinned ? "Unpin" : "Pin", () =>
      isDocument
        ? pinned ? api.unpinDocument(targetId!) : api.pinDocument(targetId!)
        : pinned ? api.unpinFolder(targetId!) : api.pinFolder(targetId!)
    );
  };

  const handleDownload = () => {
    if (!isDocument) {
      alert("Only documents can be downloaded. Folder (zip) download is not available yet.");
      return;
    }
    run("Download", () => api.downloadDocument(targetId!, selectedItem?.name || "document"));
  };

  const handleCut = () => {
    setClipboard({
      id: targetId!, name: selectedItem?.name,
      kind: isDocument ? "document" : "folder", mode: "cut",
    });
    onClose();
  };

  const handleCopy = () => {
    alert("Server-side duplication isn't available yet — use Cut → Paste to move items.");
    onClose();
  };

  const handlePaste = () => {
    if (!clip) return;
    if (clip.mode === "copy") return alert("Copy/paste needs a backend duplicate endpoint.");
    if (isDocument) return alert("Paste into a folder, not onto a document.");
    if (clip.id === targetId) return alert("Cannot paste an item into itself.");

    run("Paste", async () => {
      if (clip.kind === "folder") await api.moveFolder(clip.id, { parent: targetId! });
      else await api.moveDocument(clip.id, targetId!);
      setClipboard(null);
    });
  };

  const handleMove = () => {
    const dest = prompt("Paste the destination folder ID:");
    if (!dest) return;
    run("Move", () =>
      isDocument ? api.moveDocument(targetId!, dest) : api.moveFolder(targetId!, { parent: dest })
    );
  };

  const handleSearchHere = () => {
    onClose();
    onSearchHere?.(isFolderLevel ? { folder: targetId } : { cabinet: targetId });
  };

  const copyToClipboard = async (url: string, label: string) => {
    try {
      await navigator.clipboard.writeText(url);
      alert(`${label} copied to clipboard:\n${url}`);
    } catch {
      prompt(`${label}:`, url);
    }
  };

  const getActiveTenant = () => {
    if (selectedItem?.tenant) return selectedItem.tenant;
    if (typeof window === "undefined") return null;
    return (
      localStorage.getItem("tenant_id") ||
      localStorage.getItem("current_tenant_id") ||
      localStorage.getItem("tenant") ||
      localStorage.getItem("active_tenant")
    );
  };

  const handleShareLink = () =>
    run("Share link", async () => {
      const tenantId = getActiveTenant();
      if (!tenantId) {
        throw new Error("Tenant context is missing. Please select a tenant before creating a share link.");
      }

      const payload = {
        link_type: "view",
        tenant: tenantId,
        ...(isDocument ? { document: targetId! } : { folder: targetId! }),
      };

      const data = await api.createShareLink(payload);
      const url = data?.url || `${window.location.origin}/share/${data?.token || data?.id}`;
      await copyToClipboard(url, "Shareable link");
    });

  const handleUploadLink = () => {
    if (!isFolderLevel || isDocument)
      return alert("Upload links can only be created on a folder.");
    
    run("Upload link", async () => {
      const tenantId = getActiveTenant();
      if (!tenantId) {
        throw new Error("Tenant context is missing. Please select a tenant before creating an upload link.");
      }

      const payload = {
        title: selectedItem?.name ? `${selectedItem.name} Upload` : "Upload Portal",
        tenant: tenantId,
        folder: targetId!,
      };

      const data = await api.createUploadLink(payload);
      const url = data?.url || `${window.location.origin}/upload/${data?.token || data?.id}`;
      await copyToClipboard(url, "Upload link");
    });
  };

  const handleApplyTemplate = () => { onClose(); onOpenTemplateModal(); };
  const handleMassFolderTemplate = () => { onClose(); onOpenMassFolderTemplateModal?.(); };
  const handleFormFillTemplate = () => { onClose(); onOpenFormFillModal?.(); };
  const handleMassFormFillTemplate = () => { onClose(); onOpenMassFormFillModal?.(); };

  /* -------------------------- recursive upload -------------------------- */

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!isFolderLevel) return alert("Documents can only be uploaded inside folders.");
    if (!canUpload) return alert("You do not have permission to upload documents.");

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const folderCache = new Map<string, string>();
      const itemId = targetId!;
      const activeTenantId = getActiveTenant();

      for (const file of fileArray) {
        const relativePath = (file as { webkitRelativePath?: string }).webkitRelativePath;
        let parentId = itemId;

        if (relativePath) {
          const segments = relativePath.split("/");
          segments.pop();
          let accumulated = "";
          for (const segment of segments) {
            accumulated = accumulated ? `${accumulated}/${segment}` : segment;
            if (folderCache.has(accumulated)) {
              parentId = folderCache.get(accumulated)!;
            } else {
              const created = await api.createFolder({
                name: segment,
                parent: parentId,
                tenant: activeTenantId,
              });
              parentId = created.id;
              folderCache.set(accumulated, parentId);
            }
          }
        }

        const formData = new FormData();
        formData.append("name", file.name);
        formData.append("folder", parentId);
        if (activeTenantId) formData.append("tenant", activeTenantId);
        formData.append("file", file);
        await api.uploadDocument(formData);
      }

      if (onUploadComplete) await onUploadComplete();
      onClose();
    } catch (err) {
      alert((err as Error)?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  /* ------------------------------- render ------------------------------- */

  const Item = ({
    icon: Icon, label, onClick, disabled = false, danger = false,
  }: any) => (
    <button
      onClick={onClick}
      disabled={disabled || Boolean(busy)}
      className={`w-full text-left px-4 py-1.5 flex items-center gap-2.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed ${
        danger ? "text-red-600 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"
      }`}
    >
      <Icon size={14} className={danger ? "text-red-500" : "text-gray-600"} />
      <span>{busy === label ? `${label}…` : label}</span>
    </button>
  );

  return (
    <>
      <input type="file" ref={fileInputRef} multiple className="hidden"
        onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleFilesUpload(e.target.files)} />
      <input type="file" ref={folderInputRef} className="hidden"
        {...({ webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleFilesUpload(e.target.files)} />

      <div className="fixed inset-0 z-[9998]" onClick={onClose}
        onContextMenu={(e) => { e.preventDefault(); onClose(); }} />

      <div
        ref={menuRef}
        className="fixed z-[9999] min-w-[230px] max-h-[80vh] overflow-y-auto rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
        style={{ left: pos.left, top: pos.top }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Item icon={FileText} label="Properties" onClick={handleProperties} disabled={!targetId} />

        <div className="my-1 h-px bg-gray-100" />

        <Item icon={Edit} label="Rename" onClick={handleRename} disabled={!targetId} />
        <Item icon={Pin} label={selectedItem?.is_pinned ? "Unpin" : "Pin"} onClick={handlePinToggle} disabled={!targetId} />
        <Item icon={Scissors} label="Cut" onClick={handleCut} disabled={!targetId} />
        <Item icon={Copy} label="Copy" onClick={handleCopy} disabled={!targetId} />
        <Item icon={Move} label={clip ? `Paste "${clip.name}"` : "Paste"} onClick={handlePaste} disabled={!clip || isDocument} />
        <Item icon={Move} label="Move to…" onClick={handleMove} disabled={!targetId} />

        <div className="my-1 h-px bg-gray-100" />

        <Item icon={LinkIcon} label="Shareable Link" onClick={handleShareLink} disabled={!targetId} />
        <Item icon={Upload} label="Create Upload Link" onClick={handleUploadLink} disabled={!isFolderLevel || isDocument} />
        <Item icon={Share2} label="Request Documents" onClick={handleUploadLink} disabled={!isFolderLevel || isDocument} />
        <Item icon={Download} label="Download" onClick={handleDownload} disabled={!isDocument} />

        <div className="my-1 h-px bg-gray-100" />

        <button
          onClick={() => { onClose(); onStartInlineCreate?.(); }}
          className="w-full flex items-center gap-2.5 px-4 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
        >
          <FolderPlus size={14} className="text-gray-600" />
          <span>New {childKindLabel}</span>
        </button>

        <Item icon={Search} label="Search Here" onClick={handleSearchHere} />

        {canUpload && isFolderLevel && (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
            >
              <Upload size={14} className="text-gray-600" />
              <span>{uploading ? "Uploading…" : "Upload Document(s)"}</span>
            </button>
            <button
              onClick={() => folderInputRef.current?.click()}
              disabled={uploading}
              className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
            >
              <Folder size={14} className="text-gray-600" />
              <span>{uploading ? "Uploading…" : "Upload Folder"}</span>
            </button>
          </>
        )}

        {!isFolderTemplateHidden && (
          <>
            <div className="my-1 h-px bg-gray-100" />
            <div className="relative" onMouseEnter={() => openSubmenu("template")} onMouseLeave={closeSubmenu}>
              <button
                onClick={handleApplyTemplate}
                className="w-full text-left px-4 py-1.5 hover:bg-purple-50 flex items-center justify-between text-xs"
              >
                <span className="flex items-center gap-2.5 font-medium text-purple-900">
                  <FileSpreadsheet size={14} className="text-purple-700" />
                  <span>Apply Template</span>
                </span>
                <ChevronRight size={12} className="text-gray-400" />
              </button>

              {activeSubmenu === "template" && (
                <div
                  className="absolute left-full top-0 ml-1 min-w-[240px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
                  onMouseEnter={() => openSubmenu("template")}
                  onMouseLeave={closeSubmenu}
                >
                  <button onClick={handleApplyTemplate}
                    className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center gap-2 font-medium text-purple-900 text-xs">
                    <FileSpreadsheet size={14} /> <span>Apply Folder Template</span>
                  </button>
                  {onOpenMassFolderTemplateModal && (
                    <button onClick={handleMassFolderTemplate}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center gap-2 text-xs text-gray-700">
                      <Zap size={14} /> <span>Mass Apply Folder Template</span>
                    </button>
                  )}
                  {onOpenFormFillModal && (
                    <button onClick={handleFormFillTemplate}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center gap-2 text-xs text-gray-700">
                      <FileText size={14} /> <span>Apply Form-Fill Template</span>
                    </button>
                  )}
                  {onOpenMassFormFillModal && (
                    <button onClick={handleMassFormFillTemplate}
                      className="w-full text-left px-4 py-2 hover:bg-purple-50 flex items-center gap-2 text-xs text-gray-700">
                      <Zap size={14} /> <span>Mass Apply Form-Fill Template</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </>
        )}

        <div className="my-1 h-px bg-gray-100" />
        <Item icon={Trash2} label="Delete" onClick={handleDelete} disabled={!targetId} danger />
      </div>
    </>
  );
}