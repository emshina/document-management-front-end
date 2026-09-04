'use client';
import { Search, SlidersHorizontal, Upload, History, Bell, HelpCircle, Menu } from 'lucide-react';
import { useTenant } from '@/hooks/useTenant';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { tenantName, primaryColor, userInitial } = useTenant();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar} 
          style={{ '--hover-color': primaryColor } as React.CSSProperties}
          className="md:hidden text-gray-600 hover:text-[var(--hover-color)] focus:outline-none"
        >
          <Menu size={22} />
        </button>

        {/* Search Bar */}
        <div 
          style={{ '--focus-border': primaryColor } as React.CSSProperties}
          className="flex items-center w-48 sm:w-72 md:w-96 bg-gray-100 rounded-lg px-3 py-1.5 border border-transparent focus-within:border-[var(--focus-border)] focus-within:bg-white transition"
        >
          <Search size={18} className="text-gray-400 mr-2 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent w-full text-sm outline-none text-gray-700" 
          />
          <SlidersHorizontal size={16} className="text-gray-400 cursor-pointer hover:text-gray-600 hidden sm:block" />
        </div>
      </div>

      {/* Top Right Utilities & Profile */}
      <div className="flex items-center gap-2 md:gap-4 text-gray-600">
        <Upload size={18} style={{ '--hover-color': primaryColor } as React.CSSProperties} className="cursor-pointer hover:text-[var(--hover-color)] transition hidden sm:block" />
        <History size={18} style={{ '--hover-color': primaryColor } as React.CSSProperties} className="cursor-pointer hover:text-[var(--hover-color)] transition hidden sm:block" />
        <Bell size={18} style={{ '--hover-color': primaryColor } as React.CSSProperties} className="cursor-pointer hover:text-[var(--hover-color)] transition" />
        <HelpCircle size={18} style={{ '--hover-color': primaryColor } as React.CSSProperties} className="cursor-pointer hover:text-[var(--hover-color)] transition hidden md:block" />
        
        <div className="flex items-center gap-2 bg-gray-100 px-2.5 py-1.5 rounded-full border border-gray-200 cursor-pointer">
          <div 
            style={{ backgroundColor: primaryColor }}
            className="w-6 h-6 rounded-full text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm"
          >
            {userInitial}
          </div>
          <span className="text-xs font-semibold text-gray-800 truncate max-w-[100px] sm:max-w-xs">
            {tenantName}
          </span>
        </div>
      </div>
    </header>
  );
}