'use client';
import { useEffect, useRef } from 'react';

interface ContextMenuProps {
  onClose: () => void;
}

export default function ContextMenu({ onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div ref={menuRef} className="absolute right-0 top-8 w-56 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-xs text-gray-700">
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer flex justify-between items-center">Properties <span>›</span></div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer flex justify-between items-center">Add To Collection <span>›</span></div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Quick Link</div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">New Drawer</div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Search Here</div>
      <div className="my-1 border-t border-gray-100"></div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer flex justify-between items-center">Apply Template <span>›</span></div>
      <div className="my-1 border-t border-gray-100"></div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Cut</div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Copy</div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Move to...</div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Rename</div>
      <div className="px-4 py-2 hover:bg-red-50 hover:text-red-600 cursor-pointer">Delete</div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Pin to Top</div>
      <div className="my-1 border-t border-gray-100"></div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Start Workflow</div>
      <div className="px-4 py-2 hover:bg-purple-50 hover:text-purple-700 cursor-pointer">Make Searchable (OCR)</div>
    </div>
  );
}