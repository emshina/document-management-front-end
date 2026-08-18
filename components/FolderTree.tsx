'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ChevronRight, ChevronDown, Building, Building2, Folder, Search, Loader2, 
  Plus, Trash2, Box, FileText, Upload, MoreVertical, FolderPlus 
} from 'lucide-react';
import { fetchFolderTree, createSubCompany, createCabinet, createFolderItem, deleteFolderItem, MotherCompanyItem, TreeNodeItem } from '@/services/folderService';

interface FolderTreeProps {
  onSelectFolder?: (item: TreeNodeItem | any) => void;
  onTriggerUpload?: (parentId: string, parentType: string, uploadType: 'file' | 'folder') => void;
}

export default function FolderTree({ onSelectFolder, onTriggerUpload }: FolderTreeProps) {
  const [folderTree, setFolderTree] = useState<MotherCompanyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState('');
  
  // Creation/Menu States
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'sub_company' | 'cabinet' | 'folder' | null>(null);
  const [activeCreatingParentId, setActiveCreatingParentId] = useState<string | null>(null);
  const [newChildName, setNewChildName] = useState('');
  
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadFolders = async () => {
    try {
      setLoading(true);
      const data = await fetchFolderTree();
      setFolderTree(data);
      if (data.length > 0 && Object.keys(expanded).length === 0) {
        setExpanded({ [data[0].id]: true });
        if (onSelectFolder) onSelectFolder(data[0]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organization tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFolders();
  }, []);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateNode = async (parentItem: TreeNodeItem, e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !creatingType) return;

    try {
      if (creatingType === 'sub_company') {
        await createSubCompany(newChildName.trim(), parentItem.id);
      } else if (creatingType === 'cabinet') {
        await createCabinet(newChildName.trim(), parentItem.id);
      } else if (creatingType === 'folder') {
        // Enforce company standard: Cabinets can only create folders, folders can create folders
        const itemType = parentItem.type === 'cabinet' ? 'cabinet' : 'folder';
        await createFolderItem(newChildName.trim(), parentItem.id, itemType);
      }
      
      setNewChildName('');
      setActiveCreatingParentId(null);
      setCreatingType(null);
      setExpanded(prev => ({ ...prev, [parentItem.id]: true }));
      await loadFolders();
    } catch (err: any) {
      alert(err.message || 'Failed to create item');
    }
  };

  const handleDeleteNode = async (item: TreeNodeItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      await deleteFolderItem(item.id, item.type);
      await loadFolders();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item');
    }
  };

  const filterTreeItems = (items: any[], query: string): any[] => {
    if (!query) return items;
    return items.reduce((acc: any[], item) => {
      const matches = item.name.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = item.children ? filterTreeItems(item.children, query) : [];
      
      if (matches || filteredChildren.length > 0) {
        acc.push({
          ...item,
          children: filteredChildren.length > 0 ? filteredChildren : item.children
        });
      }
      return acc;
    }, []);
  };

  const displayedTree = useMemo(() => {
    return filterTreeItems(folderTree, filterText);
  }, [folderTree, filterText]);

  const renderTree = (items: TreeNodeItem[]) => {
    return items.map((item) => {
      const isExpanded = expanded[item.id] || Boolean(filterText);
      const hasChildren = ('children' in item && item.children && item.children.length > 0) || 
                          ('files' in item && item.files && item.files.length > 0);
      
      const isMother = item.type === 'mother_company';
      const isSubCompany = item.type === 'sub_company';
      const isCabinet = item.type === 'cabinet';
      const isFolder = item.type === 'folder';

      const showChevron = hasChildren || isMother || isSubCompany || isCabinet;

      return (
        <div key={item.id} className="text-sm">
          <div 
            onClick={() => onSelectFolder?.(item)}
            className="flex items-center justify-between py-1.5 px-2 rounded-md cursor-pointer hover:bg-purple-50 group transition text-gray-700 relative"
          >
            <div className="flex items-center gap-2 truncate flex-1">
              {showChevron ? (
                <span onClick={(e) => toggleExpand(item.id, e)} className="p-0.5 hover:bg-gray-200 rounded">
                  {isExpanded ? <ChevronDown size={14} className="text-gray-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-gray-500 flex-shrink-0" />}
                </span>
              ) : <span className="w-4 flex-shrink-0" />}
              
              {isMother && <Building size={16} className="text-purple-900 flex-shrink-0" />}
              {isSubCompany && <Building2 size={16} className="text-purple-600 flex-shrink-0" />}
              {isCabinet && <Box size={15} className="text-indigo-600 flex-shrink-0" />}
              {isFolder && <Folder size={16} className="text-amber-500 flex-shrink-0" />}

              <span className={`truncate ${isMother ? 'font-bold text-purple-950' : ''} ${isSubCompany ? 'font-semibold text-purple-800' : ''} ${isCabinet ? 'font-medium text-gray-800' : ''}`}>
                {item.name}
              </span>
            </div>

            {/* Professional Dropdown Actions Menu */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition relative">
              <button 
                title="Options"
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === item.id ? null : item.id);
                }}
                className="p-1 hover:bg-purple-200 rounded text-purple-700 transition"
              >
                <MoreVertical size={14} />
              </button>

              {/* Context Menu Dropdown */}
              {menuOpenId === item.id && (
                <div 
                  ref={menuRef}
                  className="absolute right-0 top-7 w-48 bg-white border border-gray-200 rounded-md shadow-lg py-1 z-50 text-xs text-gray-700"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isMother && (
                    <button 
                      onClick={() => { setMenuOpenId(null); setCreatingType('sub_company'); setActiveCreatingParentId(item.id); setExpanded(prev => ({ ...prev, [item.id]: true })); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center gap-2 text-purple-900 font-medium"
                    >
                      <Building2 size={13} /> Create Sub-Company
                    </button>
                  )}

                  {isSubCompany && (
                    <button 
                      onClick={() => { setMenuOpenId(null); setCreatingType('cabinet'); setActiveCreatingParentId(item.id); setExpanded(prev => ({ ...prev, [item.id]: true })); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center gap-2 text-indigo-700 font-medium"
                    >
                      <Box size={13} /> Create Cabinet
                    </button>
                  )}

                  {isCabinet && (
                    <button 
                      onClick={() => { setMenuOpenId(null); setCreatingType('folder'); setActiveCreatingParentId(item.id); setExpanded(prev => ({ ...prev, [item.id]: true })); }}
                      className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center gap-2 text-amber-700 font-medium"
                    >
                      <FolderPlus size={13} /> Create Folder
                    </button>
                  )}

                  {isFolder && (
                    <>
                      <button 
                        onClick={() => { setMenuOpenId(null); setCreatingType('folder'); setActiveCreatingParentId(item.id); setExpanded(prev => ({ ...prev, [item.id]: true })); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center gap-2 text-amber-700 font-medium"
                      >
                        <FolderPlus size={13} /> Create Sub-Folder
                      </button>
                      <button 
                        onClick={() => { setMenuOpenId(null); onTriggerUpload?.(item.id, 'folder', 'file'); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center gap-2 text-blue-700 font-medium"
                      >
                        <Upload size={13} /> Upload File
                      </button>
                      <button 
                        onClick={() => { setMenuOpenId(null); onTriggerUpload?.(item.id, 'folder', 'folder'); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-purple-50 flex items-center gap-2 text-emerald-700 font-medium"
                      >
                        <Folder size={13} /> Upload Folder
                      </button>
                    </>
                  )}

                  {!isMother && (
                    <>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button 
                        onClick={(e) => { setMenuOpenId(null); handleDeleteNode(item, e); }}
                        className="w-full text-left px-3 py-1.5 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Inline Creation Input Form */}
          {activeCreatingParentId === item.id && (
            <form onSubmit={(e) => handleCreateNode(item, e)} className="ml-7 mt-1 mr-2">
              <input 
                type="text"
                autoFocus
                placeholder={`New ${creatingType?.replace('_', ' ')} name...`}
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                onBlur={() => {
                  setTimeout(() => {
                    setActiveCreatingParentId(null);
                    setCreatingType(null);
                    setNewChildName('');
                  }, 200);
                }}
                className="w-full text-xs px-2 py-1 border border-purple-400 rounded outline-none bg-white shadow-sm"
              />
            </form>
          )}

          {/* Expanded Children (Folders & Files) */}
          {isExpanded && (
            <div className="pl-4 space-y-1 mt-0.5 border-l border-gray-200 ml-3">
              {hasChildren ? (
                <>
                  {/* Render sub-folders/companies/cabinets */}
                  {item.children && renderTree(item.children)}

                  {/* Render Files directly nested inside folders */}
                  {'files' in item && item.files && item.files.map((file: any) => (
                    <div 
                      key={file.id} 
                      onClick={() => onSelectFolder?.(file)}
                      className="flex items-center gap-2 py-1 px-2 rounded-md cursor-pointer hover:bg-blue-50 text-gray-600 text-xs"
                    >
                      <FileText size={14} className="text-blue-500 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-xs text-gray-400 py-1 pl-2">No items inside</p>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="w-full sm:w-72 lg:w-80 bg-white border-r border-gray-200 flex flex-col h-[calc(100vh-4rem)] flex-shrink-0">
      <div className="flex border-b border-gray-200 text-sm font-semibold">
        <button className="flex-1 py-3 text-purple-700 border-b-2 border-purple-700 bg-purple-50/50">Organization Tree</button>
      </div>

      <div className="p-3 border-b border-gray-100">
        <div className="flex items-center bg-gray-100 rounded px-2.5 py-1.5 text-xs text-gray-500 focus-within:bg-white focus-within:ring-1 focus-within:ring-purple-500 transition">
          <Search size={14} className="mr-2 flex-shrink-0" />
          <input 
            type="text" 
            placeholder="Type to filter..." 
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="bg-transparent w-full outline-none text-gray-700" 
          />
        </div>
      </div>

      <div className="p-3 overflow-y-auto flex-1">
        {loading && (
          <div className="flex items-center justify-center py-10 text-gray-400 gap-2 text-xs">
            <Loader2 size={16} className="animate-spin text-purple-600" /> Loading organization hierarchy...
          </div>
        )}

        {error && (
          <p className="text-xs text-red-500 bg-red-50 p-2 rounded">{error}</p>
        )}

        {!loading && !error && displayedTree.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-6">No structure found.</p>
        )}

        {!loading && !error && renderTree(displayedTree)}
      </div>
    </div>
  );
}