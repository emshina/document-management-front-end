// app/documents/page.tsx
'use client';
import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import FolderTree from '@/components/FolderTree';
import DocumentContentArea from '@/components/DocumentContentArea';
import AllFeaturesModal from '@/components/AllFeaturesModal';

export default function DocumentsPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAllFeaturesOpen, setIsAllFeaturesOpen] = useState(false);
  
  // Single source of truth for the active selected item
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTriggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSelect = (item: any, meta?: any) => {
    if (!item) return;

    // Normalize type and id regardless of property naming variation
    const resolvedType = item.type || item.nodeType || item.itemType || 'folder';
    const resolvedId = item.id || item._id || item.value;

    setSelectedItem({
      ...item,
      id: resolvedId,
      type: resolvedType,
      pathSegments: meta?.pathSegments || item.pathSegments,
      idPath: meta?.idPath || item.idPath,
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        onOpenAllFeatures={() => setIsAllFeaturesOpen(true)} 
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <div className="flex flex-1 overflow-hidden relative">
          
          <div className="hidden md:flex">
            <FolderTree 
              key={refreshKey}
              selectedItem={selectedItem}
              onSelectFolder={(item, meta) => handleSelect(item, meta)} 
            />
          </div>

          <DocumentContentArea 
            selectedItem={selectedItem} 
            onSelectItem={(item) => handleSelect(item)} 
            onRefreshTree={handleTriggerRefresh}
          />
        </div>
      </div>

      <AllFeaturesModal isOpen={isAllFeaturesOpen} onClose={() => setIsAllFeaturesOpen(false)} />
    </div>
  );
}