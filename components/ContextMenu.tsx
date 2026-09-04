"use client";

import { useEffect, useRef, useState } from "react";
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
  FolderInput,
  Scissors,
  Copy,
  Move,
  PenSquare,
  Pin,
  PlayCircle,
  ScanText,
  ChevronRight,
} from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;

  // Template actions
  onOpenTemplateModal: () => void;
  onOpenMassFolderTemplateModal?: () => void;
  onOpenFormFillModal?: () => void;
  onOpenMassFormFillModal?: () => void;

  // Permissions
  canUpload: boolean;

  // Hide folder template functionality if required
  isFolderTemplateHidden?: boolean;
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
  isFolderTemplateHidden = false,
}: ContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<
    "collection" | "template" | null
  >(null);

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

    // Close the context menu
    onClose();

    // Open the existing template modal
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

  return (
    <>
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
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
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
            className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center justify-between"
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
                className="w-full text-left px-4 py-1.5 hover:bg-gray-50"
              >
                Add to Collection
              </button>

              <button
                onClick={() => {
                  onClose();
                }}
                className="w-full text-left px-4 py-1.5 hover:bg-gray-50"
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
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Share2 size={14} className="text-gray-600" />
          <span>Share</span>
        </button>

        {/* Shareable Link */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Link size={14} className="text-gray-600" />
          <span>Shareable Link</span>
        </button>

        {/* Request Signatures */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <FileSignature size={14} className="text-gray-600" />
          <span>Request Signatures from a Template</span>
        </button>

        {/* Request Documents */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <FileText size={14} className="text-gray-600" />
          <span>Request Documents</span>
        </button>

        {/* Quick Link */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Zap size={14} className="text-gray-600" />
          <span>Quick Link</span>
        </button>

        {/* Create Upload Link */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Upload size={14} className="text-gray-600" />
          <span>Create Upload Link</span>
        </button>

        {/* New Folder */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <FolderPlus size={14} className="text-gray-600" />
          <span>New Folder</span>
        </button>

        {/* Search Here */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Search size={14} className="text-gray-600" />
          <span>Search Here</span>
        </button>

        {/* Upload */}
        {canUpload && (
          <button
            onClick={() => {
              onClose();
            }}
            className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
          >
            <Upload size={14} className="text-gray-600" />
            <span>Upload Document</span>
          </button>
        )}

        {/* Download */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
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
              className="w-full text-left px-4 py-1.5 hover:bg-purple-50 hover:text-purple-700 flex items-center justify-between cursor-pointer"
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
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 font-medium text-purple-900"
                >
                  <FileSpreadsheet size={14} />

                  <span>Apply Folder Template</span>
                </button>

                {/* Mass Apply Folder Template */}
                <button
                  onClick={handleMassFolderTemplate}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                >
                  <FileSpreadsheet size={14} />

                  <span>Mass Apply Folder Template</span>
                </button>

                {/* Apply Form-Fill Template */}
                <button
                  onClick={handleFormFillTemplate}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
                >
                  <FileSpreadsheet size={14} />

                  <span>Apply Form-Fill Template</span>
                </button>

                {/* Mass Apply Form-Fill Template */}
                <button
                  onClick={handleMassFormFillTemplate}
                  className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2"
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
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Scissors size={14} className="text-gray-600" />
          <span>Cut</span>
        </button>

        {/* Copy */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Copy size={14} className="text-gray-600" />
          <span>Copy</span>
        </button>

        {/* Move To */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Move size={14} className="text-gray-600" />
          <span>Move to...</span>
        </button>

        {/* Rename */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Edit size={14} className="text-gray-600" />
          <span>Rename</span>
        </button>

        {/* Delete */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-red-50 hover:text-red-700 flex items-center gap-2.5"
        >
          <Trash2 size={14} />
          <span>Delete</span>
        </button>

        {/* Pin */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <Pin size={14} className="text-gray-600" />
          <span>Pin to Top</span>
        </button>

        {/* Start Workflow */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <PlayCircle size={14} className="text-gray-600" />
          <span>Start Workflow</span>
        </button>

        {/* Make Searchable */}
        <button
          onClick={() => {
            onClose();
          }}
          className="w-full text-left px-4 py-1.5 hover:bg-gray-50 flex items-center gap-2.5"
        >
          <ScanText size={14} className="text-gray-600" />
          <span>Make Searchable (OCR)</span>
        </button>
      </div>
    </>
  );
}