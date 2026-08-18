'use client';
import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Upload, History, Bell, HelpCircle, Menu } from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const [displayName, setDisplayName] = useState('User');
  const [tenantName, setTenantName] = useState('Account');

  useEffect(() => {
    // Read cached details safely from localStorage
    const savedName = localStorage.getItem('user_full_name');
    const savedTenant = localStorage.getItem('tenant_name');
    
    if (savedName) setDisplayName(savedName);
    if (savedTenant) setTenantName(savedTenant);
  }, []);

  const userInitial = displayName.charAt(0).toUpperCase();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center gap-3">
        <button 
          onClick={onToggleSidebar} 
          className="md:hidden text-gray-600 hover:text-purple-700 focus:outline-none"
        >
          <Menu size={22} />
        </button>

        {/* Search Bar */}
        <div className="flex items-center w-48 sm:w-72 md:w-96 bg-gray-100 rounded-lg px-3 py-1.5 border border-transparent focus-within:border-purple-500 focus-within:bg-white transition">
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
        <Upload size={18} className="cursor-pointer hover:text-purple-600 transition hidden sm:block" />
        <History size={18} className="cursor-pointer hover:text-purple-600 transition hidden sm:block" />
        <Bell size={18} className="cursor-pointer hover:text-purple-600 transition" />
        <HelpCircle size={18} className="cursor-pointer hover:text-purple-600 transition hidden md:block" />
        
        <div className="flex items-center gap-2 bg-gray-100 px-2.5 py-1.5 rounded-full border border-gray-200 cursor-pointer">
          <div className="w-6 h-6 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
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