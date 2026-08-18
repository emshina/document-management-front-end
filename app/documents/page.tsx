'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FolderTree from '@/components/FolderTree';
import DocumentContentArea from '@/components/DocumentContentArea';
import AllFeaturesModal from '@/components/AllFeaturesModal';
import { TreeNodeItem } from '@/services/folderService';

export default function DocumentsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAllFeaturesOpen, setIsAllFeaturesOpen] = useState(false);
  
  // 1. Manage the single source of truth for the currently selected node
  const [selectedItem, setSelectedItem] = useState<TreeNodeItem | null>(null);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {/* Sidebar Navigation */}
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpenAllFeatures={() => setIsAllFeaturesOpen(true)} 
      />

      {/* Main App Canvas */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden relative">
          
          {/* 2. Pass selection handler to FolderTree */}
          <div className="hidden md:flex">
            <FolderTree 
              onSelectFolder={(item) => setSelectedItem(item)} 
            />
          </div>

          {/* 3. Pass selectedItem and selection handler to DocumentContentArea */}
          <DocumentContentArea 
            selectedItem={selectedItem} 
            onSelectItem={(item) => setSelectedItem(item)} 
          />
        </div>
      </div>

      {/* Pop-up modal drawer */}
      <AllFeaturesModal isOpen={isAllFeaturesOpen} onClose={() => setIsAllFeaturesOpen(false)} />
    </div>
  );
}