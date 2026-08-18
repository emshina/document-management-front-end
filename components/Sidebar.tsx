'use client';
import Link from 'next/link';
import { Home, FolderKanban, FileText, PenTool, Workflow, LayoutGrid, X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAllFeatures: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpenAllFeatures }: SidebarProps) {
  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
        />
      )}

      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        w-64 bg-[#2D1B4E] text-white flex flex-col justify-between h-screen select-none
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div>
          {/* Logo Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-[#3D256B]">
            <span className="text-2xl font-extrabold tracking-wider">Visaro Server</span>
            <button onClick={onClose} className="md:hidden text-gray-300 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1 px-3">
            <Link href="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#432775] transition">
              <Home size={18} /> Home
            </Link>
            <Link href="/documents" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium bg-[#7C3AED] text-white shadow-md">
              <FolderKanban size={18} /> Documents
            </Link>
            <Link href="/document-requests" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#432775] transition text-gray-300">
              <FileText size={18} /> Document Requests
            </Link>
            <Link href="/esignature" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#432775] transition text-gray-300">
              <PenTool size={18} /> eSignature
            </Link>
            <Link href="/workflow" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#432775] transition text-gray-300">
              <Workflow size={18} /> Workflow
            </Link>
          </nav>
        </div>

        {/* All Features Trigger */}
        <div className="p-3 border-t border-[#3D256B]">
          <button 
            onClick={onOpenAllFeatures}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#432775] transition text-gray-300"
          >
            <span className="flex items-center gap-3"><LayoutGrid size={18} /> All Features</span>
            <span>›</span>
          </button>
        </div>
      </aside>
    </>
  );
}