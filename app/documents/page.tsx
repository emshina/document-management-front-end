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

  // 2. Add a refresh trigger counter to force FolderTree to re-fetch on command
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTriggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

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
          
          {/* 3. Pass refreshKey so FolderTree reloads instantly when mutated */}
          <div className="hidden md:flex">
            <FolderTree 
              key={refreshKey}
              onSelectFolder={(item) => setSelectedItem(item)} 
            />
          </div>

          {/* 4. Pass selectedItem, selection handler, and the refresh callback to DocumentContentArea */}
          <DocumentContentArea 
            selectedItem={selectedItem} 
            onSelectItem={(item) => setSelectedItem(item)} 
            onRefreshTree={handleTriggerRefresh}
          />
        </div>
      </div>

      {/* Pop-up modal drawer */}
      <AllFeaturesModal isOpen={isAllFeaturesOpen} onClose={() => setIsAllFeaturesOpen(false)} />
    </div>
  );
}