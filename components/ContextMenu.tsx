'use client';
import { FolderPlus, Search, Upload, Download, FileSpreadsheet, Trash2, Edit } from 'lucide-react';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onOpenTemplateModal: () => void;
  canUpload: boolean;
}

export default function ContextMenu({ x, y, onClose, onOpenTemplateModal, canUpload }: ContextMenuProps) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div 
        className="fixed z-50 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-1.5 text-xs text-gray-700 divide-y divide-gray-100"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          <div className="px-3 py-1.5 font-semibold text-gray-400 uppercase text-[10px]">Properties</div>
          <button className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
            <Edit size={14} /> Properties
          </button>
        </div>

        <div className="py-1">
          <button className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
            <FolderPlus size={14} /> New Folder
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
            <Search size={14} /> Search Here
          </button>
          {canUpload && (
            <button className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
              <Upload size={14} /> Upload Document
            </button>
          )}
          <button className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
            <Download size={14} /> Download
          </button>
        </div>

        <div className="py-1">
          <button 
            onClick={() => { onClose(); onOpenTemplateModal(); }}
            className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2 font-medium text-purple-900"
          >
            <FileSpreadsheet size={14} /> Apply Folder Template
          </button>
          <button className="w-full text-left px-4 py-2 hover:bg-purple-50 hover:text-purple-700 flex items-center gap-2">
            <FileSpreadsheet size={14} /> Mass Apply Folder Template
          </button>
        </div>

        <div className="py-1">
          <button className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600 flex items-center gap-2">
            <Trash2 size={14} /> Delete
          </button>
        </div>
      </div>
    </>
  );
}