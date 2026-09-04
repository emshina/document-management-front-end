// C:\Users\allan.muyesu\Desktop\my-app\components\ContextMenu.tsx

"use client";

import { useEffect, useRef, useState, ChangeEvent } from "react";
import {
  FolderPlus,
  Search,
  Upload,
  Download,
  FileSpreadsheet,
  Trash2,
  Edit,
  Share2,
  Link,
  FileSignature,
  FileText,
  Zap,
  Scissors,
  Copy,
  Move,
  Pin,
  PlayCircle,
  ScanText,
  ChevronRight,
  Folder,
} from "lucide-react";
import { apiCall } from "@/lib/api";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;

  // Template actions
  onOpenTemplateModal: () => void;
  onOpenMassFolderTemplateModal?: () => void;
  onOpenFormFillModal?: () => void;
  onOpenMassFormFillModal?: () => void;

  // Permissions & Context state
  canUpload: boolean;
  isFolderLevel?: boolean;
  selectedItem?: any;
  onUploadComplete?: () => Promise<void>;

  // Hide folder template functionality if required
  isFolderTemplateHidden?: boolean;

  // Inline create actions
  onStartInlineCreate?: () => void;
  childKindLabel?: string;
}

export default function ContextMenu({
  x,
  y,
  onClose,
  onOpenTemplateModal,
  onOpenMassFolderTemplateModal,
  onOpenFormFillModal,
  onOpenMassFormFillModal,
  canUpload,
  isFolderLevel = false,
  selectedItem,
  onUploadComplete,
  isFolderTemplateHidden = false,
  onStartInlineCreate,
  childKindLabel = 'Folder',
}: ContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<
    "collection" | "template" | null
  >(null);
  const [uploading, setUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const openSubmenu = (submenu: "collection" | "template") => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setActiveSubmenu(submenu);
  };

  const closeSubmenu = () => {
    timeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 150);
  };

  const handleApplyTemplate = () => {
    console.log("Apply Template clicked");
    onClose();
    onOpenTemplateModal();
  };

  const handleMassFolderTemplate = () => {
    console.log("Mass Apply Folder Template clicked");
    onClose();
    if (onOpenMassFolderTemplateModal) {
      onOpenMassFolderTemplateModal();
    }
  };

  const handleFormFillTemplate = () => {
    console.log("Apply Form-Fill Template clicked");
    onClose();
    if (onOpenFormFillModal) {
      onOpenFormFillModal();
    }
  };

  const handleMassFormFillTemplate = () => {
    console.log("Mass Apply Form-Fill Template clicked");
    onClose();
    if (onOpenMassFormFillModal) {
      onOpenMassFormFillModal();
    }
  };

  // Handler for renaming a folder
  const handleRenameFolder = async () => {
    if (!selectedItem || !selectedItem.id) {
      alert("No folder selected for renaming.");
      return;
    }

    const newName = prompt("Enter new folder name:", selectedItem.name || "");
    if (!newName || newName === selectedItem.name) return;

    try {
      await apiCall(`/v1/documents/folders/${selectedItem.id}/`, {
        method: "PATCH",
        requiresAuth: true,
        body: JSON.stringify({ name: newName }),
      });

      if (onUploadComplete) {
        await onUploadComplete();
      }
      onClose();
    } catch (err: unknown) {
      const errorObject = err as Error;
      alert(errorObject.message || "Failed to rename folder.");
    }
  };

  // Handler for deleting a folder
  const handleDeleteFolder = async () => {
    if (!selectedItem || !selectedItem.id) {
      alert("No folder selected for deletion.");
      return;
    }

    const confirmDelete = window.confirm(`Are you sure you want to delete folder "${selectedItem.name}"?`);
    if (!confirmDelete) return;

    try {
      await apiCall(`/v1/documents/folders/${selectedItem.id}/`, {
        method: "DELETE",
        requiresAuth: true,
      });

      if (onUploadComplete) {
        await onUploadComplete();
      }
      onClose();
    } catch (err: unknown) {
      const errorObject = err as Error;
      alert(errorObject.message || "Failed to delete folder.");
    }
  };

  // Shared folder and file recursive multi-hierarchy upload parser matching DocumentUploadZone
  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!isFolderLevel) {
      alert("Documents can only be uploaded directly inside folders.");
      return;
    }

    if (!canUpload) {
      alert("You do not have permission to upload documents.");
      return;
    }

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const folderCache = new Map<string, string>();
      const itemId = selectedItem?.id;
      const activeTenantId = selectedItem?.tenant || (typeof window !== "undefined" ? localStorage.getItem("current_tenant_id") : null);

      for (const file of fileArray) {
        const relativePath = (file as { webkitRelativePath?: string }).webkitRelativePath;

        if (!relativePath) {
          const formData = new FormData();
          formData.append("name", file.name);
          formData.append("folder", itemId!);
          if (activeTenantId) {
            formData.append("tenant", activeTenantId);
          }
          formData.append("file", file);
          
          await apiCall("/v1/documents/documents/", {
            method: "POST",
            requiresAuth: true,
            body: formData,
          });
        } else {
          const pathSegments = relativePath.split("/");
          pathSegments.pop();

          let currentParentId = itemId!;
          let accumulatedPath = "";

          for (const segment of pathSegments) {
            accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;

            if (folderCache.has(accumulatedPath)) {
              currentParentId = folderCache.get(accumulatedPath)!;
            } else {
              const folderPayload: Record<string, unknown> = {
                name: segment,
                parent: currentParentId,
                cabinet: selectedItem?.cabinet || null
              };
              if (activeTenantId) {
                folderPayload.tenant = activeTenantId;
              }

              const folderData = await apiCall("/v1/documents/folders/", {
                method: "POST",
                requiresAuth: true,
                body: JSON.stringify(folderPayload)
              });
              
              currentParentId = folderData.id;
              folderCache.set(accumulatedPath, currentParentId);
            }
          }

          const formData = new FormData();
          formData.append("name", file.name);
          formData.append("folder", currentParentId);
          if (activeTenantId) {
            formData.append("tenant", activeTenantId);
          }
          formData.append("file", file);

          await apiCall("/v1/documents/documents/", {
            method: "POST",
            requiresAuth: true,
            body: formData,
          });
        }
      }

      if (onUploadComplete) {
        await onUploadComplete();
      }
      onClose();
    } catch (err: unknown) {
      const errorObject = err as Error;
      alert(errorObject.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Hidden inputs to support programmatic triggers from context menu items */}
      <input 
        type="file" 
        ref={fileInputRef} 
        multiple 
        className="hidden" 
        onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleFilesUpload(e.target.files)} 
      />
      <input 
        type="file" 
        ref={folderInputRef} 
        {...({ webkitdirectory: "", directory: "" } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
        className="hidden" 
        onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleFilesUpload(e.target.files)} 
      />

      {/* Invisible overlay to close menu */}
      <div
        className="fixed inset-0 z-[9998]"
        onClick={onClose}
        onContextMenu={(e) => {
          e.preventDefault();
          onClose();
        }}
      />

      {/* Context Menu */}
      <div
        className="fixed z-[9999] min-w-[220px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
        style={{
          left: x,
          top: y,
        }}
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Properties */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <FileText size={14} className="text-gray-600" />
          <span>Properties</span>
        </button>

        {/* Add To Collection */}
        <div
          className="relative"
          onMouseEnter={() => openSubmenu("collection")}
          onMouseLeave={closeSubmenu}
        >
          <button
            className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center justify-between text-xs text-gray-700"
          >
            <span className="flex items-center gap-2.5">
              <FolderPlus size={14} className="text-gray-600" />
              Add To Collection
            </span>

            <ChevronRight size={13} className="text-gray-400" />
          </button>

          {activeSubmenu === "collection" && (
            <div
              className="absolute left-full top-0 ml-1 min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
              onMouseEnter={() => openSubmenu("collection")}
              onMouseLeave={closeSubmenu}
            >
              <button
                onClick={() => {
                  onClose();
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-gray-50 text-xs text-gray-700"
              >
                Add to Collection
              </button>

              <button
                onClick={() => {
                  onClose();
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-gray-50 text-xs text-gray-700"
              >
                Create Collection
              </button>
            </div>
          )}
        </div>

        {/* Share */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Share2 size={14} className="text-gray-600" />
          <span>Share</span>
        </button>

        {/* Shareable Link */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Link size={14} className="text-gray-600" />
          <span>Shareable Link</span>
        </button>

        {/* Request Signatures */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <FileSignature size={14} className="text-gray-600" />
          <span>Request Signatures from a Template</span>
        </button>

        {/* Request Documents */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <FileText size={14} className="text-gray-600" />
          <span>Request Documents</span>
        </button>

        {/* Quick Link */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Zap size={14} className="text-gray-600" />
          <span>Quick Link</span>
        </button>

        {/* Create Upload Link */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Upload size={14} className="text-gray-600" />
          <span>Create Upload Link</span>
        </button>

        {/* New Folder / Cabinet / Sub Company — inline, no popup */}
        <button
          onClick={() => { onClose(); onStartInlineCreate && onStartInlineCreate(); }}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 hover:bg-gray-100"
        >
          <FolderPlus size={14} className="text-gray-600" />
          <span>New {childKindLabel}</span>
        </button>

        {/* Search Here */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Search size={14} className="text-gray-600" />
          <span>Search Here</span>
        </button>

        {/* Upload Document / Folder Options */}
        {canUpload && isFolderLevel && (
          <>
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
            >
              <Upload size={14} className="text-gray-600" />
              <span>{uploading ? "Uploading..." : "Upload Document(s)"}</span>
            </button>

            <button
              onClick={() => {
                folderInputRef.current?.click();
              }}
              disabled={uploading}
              className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
            >
              <Folder size={14} className="text-gray-600" />
              <span>{uploading ? "Uploading..." : "Upload Folder"}</span>
            </button>
          </>
        )}

        {/* Download */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Download size={14} className="text-gray-600" />
          <span>Download</span>
        </button>

        {/* ====================================================== */}
        {/* APPLY TEMPLATE */}
        {/* ====================================================== */}

        {!isFolderTemplateHidden && (
          <div
            className="relative"
            onMouseEnter={() => openSubmenu("template")}
            onMouseLeave={closeSubmenu}
          >
            {/* Main Apply Template Button */}
            <button
              onClick={handleApplyTemplate}
              className="w-full text-left px-4 py-1.5 hover:bg-purple-50 hover:text-purple-700 flex items-center justify-between cursor-pointer text-xs text-gray-700"
            >
              <span className="flex items-center gap-2.5 font-medium text-purple-900">
                <FileSpreadsheet
                  size={14}
                  className="text-purple-700"
                />

                <span>Apply Template</span>
              </span>

              <ChevronRight
                size={12}
                className="text-gray-400"
              />
            </button>

            {/* Template Submenu */}
            {activeSubmenu === "template" && (
              <div
                className="absolute left-full top-0 ml-1 min-w-[230px] rounded-lg border border-gray-200 bg-white py-1 shadow-xl"
                onMouseEnter={() => openSubmenu("template")}
                onMouseLeave={closeSubmenu}
              >
                {/* Apply Folder Template */}
                <button
                  onClick={handleApplyTemplate}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 font-medium text-purple-900 text-xs"
                >
                  <FileSpreadsheet size={14} />

                  <span>Apply Folder Template</span>
                </button>

                {/* Mass Apply Folder Template */}
                <button
                  onClick={handleMassFolderTemplate}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 text-xs text-gray-700"
                >
                  <FileSpreadsheet size={14} />

                  <span>Mass Apply Folder Template</span>
                </button>

                {/* Apply Form-Fill Template */}
                <button
                  onClick={handleFormFillTemplate}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 text-xs text-gray-700"
                >
                  <FileSpreadsheet size={14} />

                  <span>Apply Form-Fill Template</span>
                </button>

                {/* Mass Apply Form-Fill Template */}
                <button
                  onClick={handleMassFormFillTemplate}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 text-xs text-gray-700"
                >
                  <FileSpreadsheet size={14} />

                  <span>Mass Apply Form-Fill Template</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Divider */}
        <div className="my-1 border-t border-gray-100" />

        {/* Cut */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Scissors size={14} className="text-gray-600" />
          <span>Cut</span>
        </button>

        {/* Copy */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Copy size={14} className="text-gray-600" />
          <span>Copy</span>
        </button>

        {/* Move To */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Move size={14} className="text-gray-600" />
          <span>Move to...</span>
        </button>

        {/* Rename */}
        <button
          onClick={handleRenameFolder}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Edit size={14} className="text-gray-600" />
          <span>Rename</span>
        </button>

        {/* Delete */}
        <button
          onClick={handleDeleteFolder}
          className="w-full text-left px-4 py-1.5 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>

        {/* Pin */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <Pin size={14} className="text-gray-600" />
          <span>Pin to Top</span>
        </button>

        {/* Start Workflow */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <PlayCircle size={14} className="text-gray-600" />
          <span>Start Workflow</span>
        </button>

        {/* Make Searchable */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5 text-xs text-gray-700"
        >
          <ScanText size={14} className="text-gray-600" />
          <span>Make Searchable (OCR)</span>
        </button>
      </div>
    </>
  );
}