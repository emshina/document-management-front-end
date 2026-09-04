'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { apiCall } from '@/lib/api';
import { 
  Home, 
  FolderKanban, 
  FileCheck, 
  Layers, 
  PenTool, 
  Workflow, 
  LayoutGrid, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Sparkles
} from 'lucide-react';

interface TenantData {
  name: string;
  effective_logo?: string;
  effective_primary_color?: string;
}

interface SidebarProps {
  isOpen: boolean; // Mobile drawer open state
  onClose: () => void;
  onOpenAllFeatures: () => void;
}

export default function Sidebar({ isOpen, onClose, onOpenAllFeatures }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(256); // Default 64 (w-64 = 256px)
  const [isResizing, setIsResizing] = useState(false);
  const [tenant, setTenant] = useState<TenantData | null>(null);
  
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLElement>(null);

  // Fetch current tenant branding using the dedicated current endpoint
// Fetch current tenant branding safely handling single or list responses
  useEffect(() => {
    apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
      .then((data) => {
        if (!data) return;
        // Handle if API returns a direct object vs a paginated results array
        const tenantObj = Array.isArray(data) 
          ? data[0] 
          : data.results?.[0] || data;
        
        if (tenantObj) {
          setTenant(tenantObj);
        }
      })
      .catch((err) => console.error('Error loading tenant branding:', err));
  }, []);

  // Safely parse logo URL (handles relative media paths from Django)
  const getLogoUrl = (logoPath?: string) => {
    if (!logoPath) return '';
    if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
      return logoPath;
    }
    
    // Fallback cleanly to your API environment base URL or window origin
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const backendRoot = apiBase ? apiBase.replace(/\/api\/?$/, '') : window.location.origin;
    
    return `${backendRoot}${logoPath.startsWith('/') ? '' : '/'}${logoPath}`;
  };

  const navItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Documents', href: '/documents', icon: FolderKanban },
    { name: 'Document Requests', href: '/document-requests', icon: FileCheck },
    { name: 'Folder Template', href: '/folder-template', icon: Layers },
    { name: 'eSignature', href: '/esignature', icon: PenTool },
    { name: 'Workflow', href: '/workflow', icon: Workflow },
  ];

  // Mouse resizing handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = e.clientX;
      if (newWidth > 72 && newWidth < 384) {
        setSidebarWidth(newWidth);
        if (newWidth < 120) {
          setIsCollapsed(true);
        } else {
          setIsCollapsed(false);
        }
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const handleLogout = () => {
    window.location.href = '/login';
  };

  // Dynamically apply primary color from database, fallback to default purple
  const customBg = tenant?.effective_primary_color || '#2D1B4E';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          onClick={onClose} 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside 
        ref={sidebarRef}
        style={{ 
          width: isOpen ? '256px' : isCollapsed ? '80px' : `${sidebarWidth}px`,
          backgroundColor: customBg
        }}
        className={`
          fixed md:static inset-y-0 left-0 z-50
          text-white flex flex-col justify-between h-screen select-none
          transition-all duration-75 ease-out border-r border-white/10 shadow-2xl
          ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* Top Section */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Logo & Collapse / Close Header */}
          <div className="flex items-center justify-between px-4 py-5 border-b border-white/10 bg-black/10">
            {(!isCollapsed || isOpen) && (
              <div className="flex items-center gap-2.5 truncate">
                {tenant?.effective_logo ? (
                  <img 
                    src={getLogoUrl(tenant.effective_logo)} 
                    alt={tenant.name || 'Company Logo'} 
                    className="w-8 h-8 rounded-lg object-contain bg-white/10 p-1 shrink-0" 
                  />
                ) : (
                  <div className="p-2 rounded-xl bg-white/10 text-white shrink-0">
                    <Sparkles size={18} />
                  </div>
                )}
                <span className="text-lg font-bold tracking-tight truncate">
                  {tenant?.name || 'Visaro Server'}
                </span>
              </div>
            )}

            {/* Desktop Collapse Toggle */}
            <button 
              onClick={() => {
                setIsCollapsed(!isCollapsed);
                setSidebarWidth(isCollapsed ? 256 : 80);
              }}
              className="hidden md:flex p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition ml-auto border border-white/10"
              title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
            >
              {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>

            {/* Mobile Close Button */}
            <button onClick={onClose} className="md:hidden text-white/70 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mt-4 space-y-1.5 px-3 flex-1 overflow-y-auto scrollbar-none">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={isCollapsed && !isOpen ? item.name : undefined}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all group relative ${
                    isActive
                      ? 'bg-white/20 text-white shadow-lg shadow-black/10 font-semibold border border-white/10'
                      : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <Icon size={20} className={`shrink-0 transition-transform group-hover:scale-110 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white'}`} />
                  {(!isCollapsed || isOpen) && <span className="truncate tracking-wide">{item.name}</span>}
                  
                  {isActive && (!isCollapsed || isOpen) && (
                    <span className="absolute right-2 w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Bottom Section: All Features & Logout */}
          <div className="p-3 border-t border-white/10 space-y-1.5 bg-black/10">
            <button 
              onClick={onOpenAllFeatures}
              title={isCollapsed && !isOpen ? 'All Features' : undefined}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/10 transition text-white/80 hover:text-white group"
            >
              <span className="flex items-center gap-3 truncate">
                <LayoutGrid size={20} className="shrink-0 text-white/60 group-hover:text-white transition-transform group-hover:rotate-12" /> 
                {(!isCollapsed || isOpen) && <span className="truncate">All Features</span>}
              </span>
              {(!isCollapsed || isOpen) && <span className="text-xs text-white/60">›</span>}
            </button>

            <button 
              onClick={handleLogout}
              title={isCollapsed && !isOpen ? 'Log Out' : undefined}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/20 hover:text-rose-200 transition group"
            >
              <LogOut size={20} className="shrink-0 text-rose-400 group-hover:scale-110 transition-transform" />
              {(!isCollapsed || isOpen) && <span className="truncate">Log Out</span>}
            </button>
          </div>
        </div>

        {/* Resizer Handle (Desktop Only) */}
        <div 
          onMouseDown={() => setIsResizing(true)}
          className="hidden md:flex absolute top-0 right-0 w-1.5 h-full cursor-col-resize items-center justify-center hover:bg-white/20 group transition-colors"
          title="Drag to resize sidebar"
        >
          <div className="w-0.5 h-8 bg-white/30 rounded-full group-hover:bg-white transition-colors" />
        </div>
      </aside>
    </>
  );
}