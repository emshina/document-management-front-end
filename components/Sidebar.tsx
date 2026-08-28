'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  FolderKanban, 
  FileText, 
  PenTool, 
  Workflow, 
  LayoutGrid, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  LogOut 
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean; // Mobile drawer open state
  onClose: () => void;
  onOpenAllFeatures: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpenAllFeatures }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Documents', href: '/documents', icon: FolderKanban },
    { name: 'Document Requests', href: '/document-requests', icon: FileText },

    { name: 'Folder Template', href: '/folder-template', icon: FileText },

    { name: 'eSignature', href: '/esignature', icon: PenTool },
    { name: 'Workflow', href: '/workflow', icon: Workflow },
  ];

  const handleLogout = () => {
    // Add your Django logout logic/token clearing here
    window.location.href = '/login';
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed md:static inset-y-0 left-0 z-50
        bg-[#2D1B4E] text-white flex flex-col justify-between h-screen select-none
        transition-all duration-300 ease-in-out border-r border-[#3D256B]
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        ${isCollapsed ? 'md:w-20' : 'md:w-64'}
        w-64
      `}>
        {/* Top Section */}
        <div>
          {/* Logo & Collapse / Close Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-5 border-b border-[#3D256B]">
            {!isCollapsed && (
              <span className="text-xl font-extrabold tracking-wider truncate">
                Visaro Server
              </span>
            )}

            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-[#432775] transition ml-auto"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </button>

            {/* Mobile Close Button */}
            <button onClick={onClose} className="md:hidden text-gray-300 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1.5 px-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition group ${
                    isActive
                      ? 'bg-[#7C3AED] text-white shadow-md'
                      : 'text-gray-300 hover:bg-[#432775] hover:text-white'
                  }`}
                >
                  <Icon size={18} className="shrink-0" />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section: All Features & Logout */}
        <div className="p-3 border-t border-[#3D256B] space-y-1">
          <button 
            onClick={onOpenAllFeatures}
            title={isCollapsed ? 'All Features' : undefined}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-[#432775] transition text-gray-300"
          >
            <span className="flex items-center gap-3 truncate">
              <LayoutGrid size={18} className="shrink-0" /> 
              {!isCollapsed && <span>All Features</span>}
            </span>
            {!isCollapsed && <span className="text-xs">›</span>}
          </button>

          <button 
            onClick={handleLogout}
            title={isCollapsed ? 'Log Out' : undefined}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition"
          >
            <LogOut size={18} className="shrink-0" />
            {!isCollapsed && <span className="truncate">Log Out</span>}
          </button>
        </div>
      </aside>
    </>
  );
}