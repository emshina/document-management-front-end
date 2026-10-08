'use client';

import { useState, useEffect, useMemo, useRef, MouseEvent } from 'react';
import { 
  Folder, Pin, Loader2, Building, Building2, FileText, 
  ChevronRight, Download, X, Eye, Check, Trash2, Edit, Plus
} from 'lucide-react';
import { fetchFolderContents, FolderItem, createSubCompany, createCabinet, createFolderItem } from '@/services/folderService';
import { apiCall } from '@/lib/api';
import ContextMenu from './ContextMenu';
import FolderTemplateModal from './FolderTemplateModal';
import DocumentUploadZone from './DocumentUploadZone';
import { usePermissions } from '@/hooks/usePermissions';

interface DocumentContentAreaProps {
  selectedItem?: (FolderItem & { pathSegments?: string[]; idPath?: string[] }) | null;
  onSelectItem?: (item: FolderItem) => void;
}

interface ContentItem {
  id: string;
  name: string;
  type: string;
  updated_at?: string;
  created_at?: string;
  file?: string;
  file_type?: string;
  reference_no?: string;
  cabinet?: string;
  folder?: string;
  tenant?: string;
  size?: string;
  created_by?: string;
  primary_color?: string;
  is_pinned?: boolean;
  current_version?: {
    file?: string;
  };
}

export default function DocumentContentArea({ selectedItem, onSelectItem }: DocumentContentAreaProps) {
  const { hasPermission } = usePermissions();

  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number; item?: ContentItem | null } | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Filtering & View states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter] = useState<string>('all');

  // Preview states
  const [previewFile, setPreviewFile] = useState<ContentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Breadcrumb tracking
  const [breadcrumbPath, setBreadcrumbPath] = useState<FolderItem[]>([]);

  // Inline creation states
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [savingNew, setSavingNew] = useState<boolean>(false);
  const newItemInputRef = useRef<HTMLInputElement>(null);

  // Rename states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState<string>('');

  const itemId = selectedItem?.id;
  const itemType = selectedItem?.type || 'folder';
  const isFolderLevel = itemType === 'folder';

  const [themeColor, setThemeColor] = useState<string>('#4C1D95');

  // Clean up object URLs to prevent memory leaks when changing previews
  useEffect(() => {
    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Database Color Code resolution
  useEffect(() => {
    let color = (selectedItem as any)?.primary_color;
    
    if (!color) {
      const storedColor = typeof window !== 'undefined' ? localStorage.getItem('tenant_primary_color') : null;
      if (storedColor) {
        color = storedColor;
      } else {
        apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
          .then((data) => {
            if (!data) return;
            const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
            if (tenantObj?.effective_primary_color) {
              setThemeColor(tenantObj.effective_primary_color);
              localStorage.setItem('tenant_primary_color', tenantObj.effective_primary_color);
            }
          })
          .catch(() => {});
      }
    }
    
    if (color) {
      setThemeColor(color);
    }
  }, [selectedItem]);

  useEffect(() => {
    if (!selectedItem || selectedItem.id === 'default-folder-id') {
      setBreadcrumbPath([]);
      return;
    }

    setBreadcrumbPath((prevPath) => {
      const existingIndex = prevPath.findIndex((p) => p.id === selectedItem.id);
      if (existingIndex !== -1) {
        return prevPath.slice(0, existingIndex + 1);
      }

      if ((selectedItem as any).pathSegments && (selectedItem as any).idPath) {
        const segments: string[] = (selectedItem as any).pathSegments;
        const ids: string[] = (selectedItem as any).idPath;
        return segments.map((seg, i) => ({
          id: ids[i] || selectedItem.id,
          name: seg,
          type: i === segments.length - 1 ? selectedItem.type : 'folder',
        }));
      }

      const isDirectChild = contents.some((c) => c.id === selectedItem.id);
      if (isDirectChild) {
        return [...prevPath, selectedItem];
      }

      return [selectedItem];
    });
  }, [selectedItem]);

  const loadContents = async () => {
    if (!itemId || itemId === 'default-folder-id') {
      setContents([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const data = await fetchFolderContents(itemId, itemType);
      
      const foldersList: ContentItem[] = (data.folders || []).map((f: Record<string, unknown>) => {
        let derivedType = 'folder';
        if (itemType === 'mother_company') derivedType = 'sub_company';
        else if (itemType === 'sub_company') derivedType = 'cabinet';
        else if (itemType === 'cabinet') derivedType = 'folder';
        
        return {
          id: String(f.id || ''),
          name: String(f.name || ''),
          type: String(f.type || derivedType),
          updated_at: f.updated_at ? String(f.updated_at) : (f.created_at ? String(f.created_at) : undefined),
          created_at: f.created_at ? String(f.created_at) : undefined,
          created_by: f.created_by ? String(f.created_by) : undefined,
          primary_color: f.primary_color ? String(f.primary_color) : undefined,
          is_pinned: Boolean(f.is_pinned),
        };
      });

      let documentsList: ContentItem[] = [];
      if (itemType === 'folder') {
        documentsList = (data.documents || []).map((d: Record<string, unknown>) => ({
          id: String(d.id || ''),
          name: String(d.name || ''),
          type: String(d.type || 'file'),
          updated_at: d.updated_at ? String(d.updated_at) : (d.created_at ? String(d.created_at) : undefined),
          created_at: d.created_at ? String(d.created_at) : undefined,
          file: d.file ? String(d.file) : undefined,
          file_type: d.file_type ? String(d.file_type) : undefined,
          reference_no: d.reference_no ? String(d.reference_no) : undefined,
          cabinet: d.cabinet ? String(d.cabinet) : undefined,
          folder: d.folder ? String(d.folder) : undefined,
          size: d.size ? String(d.size) : undefined,
          created_by: d.created_by ? String(d.created_by) : undefined,
          is_pinned: Boolean(d.is_pinned),
          current_version: d.current_version as { file?: string } | undefined,
        }));
      }

      setContents([...foldersList, ...documentsList]);
    } catch (err: unknown) {
      const errorObject = err as Error;
      setError(errorObject.message || 'Failed to load contents.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContents();
  }, [itemId, itemType]);

  const handleTemplateSuccess = async () => {
    await loadContents();
  };

  const handleItemContextMenu = (e: MouseEvent<HTMLDivElement>, item: ContentItem) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY, item: item });
  };

  const handleAreaContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!itemId || itemId === 'default-folder-id') return;
    setContextMenuPos({ x: e.clientX, y: e.clientY, item: { id: itemId, name: currentName, type: itemType } });
  };

  const handleTogglePin = async (item: ContentItem, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    try {
      await apiCall(`/v1/documents/documents/${item.id}/pin/`, {
        method: 'POST',
        requiresAuth: true,
      });
      await loadContents();
    } catch (err: any) {
      alert(err.message || 'Failed to toggle pin status.');
    }
  };

  const handleRenameSubmit = async (item: ContentItem) => {
    const newName = editingItemName.trim();
    if (!newName) return;

    try {
      let endpoint = '';
      if (item.type === 'file') {
        endpoint = `/v1/documents/documents/${item.id}/`;
      } else if (item.type === 'folder' || item.type === 'cabinet') {
        endpoint = `/v1/documents/folders/${item.id}/`;
      } else if (item.type === 'sub_company' || item.type === 'mother_company') {
        endpoint = `/v1/tenants/tenants/${item.id}/`;
      }

      if (endpoint) {
        await apiCall(endpoint, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ name: newName }),
          requiresAuth: true,
        });
      }
      setEditingItemId(null);
      await loadContents();
    } catch (err: any) {
      alert(err.message || 'Failed to rename item.');
    }
  };

  const handleDeleteItem = async (item: ContentItem, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete "${item.name}"?`)) return;

    try {
      let endpoint = '';
      if (item.type === 'file') {
        endpoint = `/v1/documents/documents/${item.id}/`;
      } else if (item.type === 'folder' || item.type === 'cabinet') {
        endpoint = `/v1/documents/folders/${item.id}/`;
      } else if (item.type === 'sub_company') {
        endpoint = `/v1/tenants/tenants/${item.id}/`;
      }

      if (endpoint) {
        await apiCall(endpoint, {
          method: 'DELETE',
          requiresAuth: true,
        });
      }
      await loadContents();
    } catch (err: any) {
      alert(err.message || 'Failed to delete item.');
    }
  };

  const handleBreadcrumbClick = (item: FolderItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  const handleResetHome = () => {
    setBreadcrumbPath([]);
  };

  const resolveFileUrl = (fileUrl: string) => {
    if (!fileUrl) return '';
    if (fileUrl.startsWith('http')) return fileUrl;
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    return `${apiBase}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`;
  };

  const handlePreview = async (item: ContentItem, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    if (!hasPermission('view_document') && !hasPermission('change_document')) {
      alert('You do not have permission to view this document.');
      return;
    }

    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }

    setPreviewFile(item);
    try {
      const docData = await apiCall(`/v1/documents/documents/${item.id}/`, { method: 'GET', requiresAuth: true });
      const rawFileUrl = docData?.current_version?.file || docData?.file || item.current_version?.file || item.file;
      if (!rawFileUrl) throw new Error('No valid file source found.');
      
      const targetUrl = resolveFileUrl(rawFileUrl);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('access')) : null;
      const res = await fetch(targetUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Failed to load preview');

      const blob = await res.blob();
      setPreviewUrl(window.URL.createObjectURL(blob));
    } catch (err) {
      console.error('Preview error:', err);
    }
  };

  const handleDownload = async (item: ContentItem, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    if (!hasPermission('download_document') && !hasPermission('view_document')) {
      alert('You do not have permission to download this document.');
      return;
    }

    try {
      const docData = await apiCall(`/v1/documents/documents/${item.id}/`, { method: 'GET', requiresAuth: true });
      const rawFileUrl = docData?.current_version?.file || docData?.file || item.current_version?.file || item.file;
      if (!rawFileUrl) throw new Error('Download URL not found.');

      const targetUrl = resolveFileUrl(rawFileUrl);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('access')) : null;
      const res = await fetch(targetUrl, { headers: token ? { 'Authorization': `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error('Download failed');

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = item.name || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      alert(err.message || 'Download failed.');
    }
  };

  // Determine label and check whether sub-company creation is allowed
  const canCreateChild = itemType !== 'mother_company'; // Hide sub-company creation at mother level to match tree logic
  const childKindLabel = 
    itemType === 'sub_company' ? 'Cabinet'
    : itemType === 'cabinet' || itemType === 'folder' ? 'Folder'
    : '';

  const startInlineCreate = () => {
    if (!canCreateChild || !childKindLabel) {
      return;
    }
    if (!itemId || itemId === 'default-folder-id') {
      alert('Select a folder or cabinet first.');
      return;
    }
    setContextMenuPos(null);
    setNewItemName(`New ${childKindLabel}`);
    setIsCreating(true);
    setTimeout(() => {
      newItemInputRef.current?.focus();
      newItemInputRef.current?.select();
    }, 30);
  };

  const cancelInlineCreate = () => {
    setIsCreating(false);
    setNewItemName('');
  };

  const submitInlineCreate = async () => {
    const name = newItemName.trim();
    if (!name || savingNew || !itemId) return;

    try {
      setSavingNew(true);
      if (itemType === 'sub_company') await createCabinet(name, itemId);
      else await createFolderItem(name, itemId, itemType === 'cabinet' ? 'cabinet' : 'folder');

      cancelInlineCreate();
      await loadContents();
    } catch (err: any) {
      alert(err.message || 'Failed to create item.');
    } finally {
      setSavingNew(false);
    }
  };

  const filteredContents = useMemo(() => {
    return contents.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const resolvedType = item.type || (item.file_type || item.reference_no ? 'file' : 'folder');
      if (typeFilter === 'all') return matchesSearch;
      if (typeFilter === 'file') return matchesSearch && (resolvedType === 'file' || item.file_type);
      if (typeFilter === 'folder') return matchesSearch && resolvedType === 'folder';
      return matchesSearch;
    });
  }, [contents, searchQuery, typeFilter]);

  const currentName = selectedItem?.name || 'Select a folder';
  const currentTypeLabel = itemType ? itemType.replace('_', ' ').toUpperCase() : 'DIRECTORY';

  const activeTargetId = contextMenuPos?.item?.id || itemId;
  const activeTargetType = contextMenuPos?.item?.type || itemType;

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden">
      <main 
        className="flex-1 bg-gray-50 flex flex-col overflow-y-auto select-none"
        onContextMenu={handleAreaContextMenu}
      >
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500 gap-2 flex-wrap w-full">
            <span onClick={handleResetHome} className="hover:opacity-80 cursor-pointer font-medium" style={{ color: themeColor }}>
              Home
            </span> 
            {breadcrumbPath.length > 0 && <ChevronRight size={12} className="text-gray-400" />}
            {breadcrumbPath.map((pathItem, index) => {
              const isLast = index === breadcrumbPath.length - 1;
              return (
                <div key={pathItem.id} className="flex items-center gap-2">
                  <span 
                    onClick={() => !isLast && handleBreadcrumbClick(pathItem)}
                    className={`cursor-pointer transition ${isLast ? 'font-semibold cursor-default' : 'hover:opacity-80 text-gray-600'}`}
                    style={isLast ? { color: themeColor } : {}}
                  >
                    {pathItem.name}
                  </span>
                  {!isLast && <ChevronRight size={12} className="text-gray-400" />}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mx-6 mt-6 border rounded-lg p-4 flex items-center justify-between" style={{ backgroundColor: `${themeColor}08`, borderColor: `${themeColor}30` }}>
          <div className="flex items-center gap-3">
            {itemType === 'mother_company' && <Building style={{ color: themeColor }} size={24} />}
            {itemType === 'sub_company' && <Building2 style={{ color: themeColor }} size={24} />}
            {itemType === 'cabinet' && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColor }} />}
            {isFolderLevel && <Folder style={{ color: themeColor }} size={24} />}
            <div>
              <h2 className="text-sm font-bold" style={{ color: themeColor }}>{currentName}</h2>
              <p className="text-xs opacity-80" style={{ color: themeColor }}>{currentTypeLabel}</p>
            </div>
          </div>
          {itemId && itemId !== 'default-folder-id' && canCreateChild && (
            <button
              onClick={startInlineCreate}
              className="px-3 py-1.5 rounded-lg text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition hover:opacity-90"
              style={{ backgroundColor: themeColor }}
            >
              <Plus size={14} /> New {childKindLabel}
            </button>
          )}
        </div>

        <DocumentUploadZone 
          isFolderLevel={isFolderLevel}
          hasPermission={hasPermission}
          themeColor={themeColor}
          selectedItem={selectedItem}
          onUploadComplete={loadContents}
        />

        <div className="mx-6 mt-3 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="divide-y divide-gray-100">
            {/* INLINE CREATE ROW */}
            {isCreating && (
              <div className="flex items-center justify-between px-4 py-3 bg-purple-50/50">
                <div className="flex items-center gap-3 flex-1">
                  <Folder size={18} style={{ color: themeColor }} />
                  <input
                    ref={newItemInputRef}
                    type="text"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitInlineCreate();
                      if (e.key === 'Escape') cancelInlineCreate();
                    }}
                    className="border rounded px-2 py-1 text-xs outline-none bg-white"
                    style={{ borderColor: themeColor }}
                    disabled={savingNew}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={submitInlineCreate}
                    disabled={savingNew}
                    className="p-1 rounded text-white flex items-center gap-1 text-xs px-2"
                    style={{ backgroundColor: themeColor }}
                  >
                    {savingNew ? <Loader2 size={12} className="animate-spin" /> : <Check size={14} />} Save
                  </button>
                  <button onClick={cancelInlineCreate} className="p-1 rounded text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                </div>
              </div>
            )}

            {filteredContents.map((item) => {
              const resolvedType = item.type || (item.file_type || item.reference_no ? 'file' : 'folder');
              const isFile = resolvedType === 'file' || item.file_type || item.reference_no;
              const isEditing = editingItemId === item.id;
              const selectableItem = { ...item, type: resolvedType };

              return (
                <div 
                  key={item.id} 
                  onContextMenu={(e) => handleItemContextMenu(e, item)}
                  onClick={(e) => {
                    if (isEditing) return;
                    if (isFile) handlePreview(item, e);
                    else onSelectItem && onSelectItem(selectableItem);
                  }}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {isFile ? <FileText size={18} className="text-blue-500" /> : <Folder size={18} className="text-gray-400" />}
                    
                    {isEditing ? (
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="text"
                          value={editingItemName}
                          onChange={(e) => setEditingItemName(e.target.value)}
                          className="border rounded px-2 py-1 text-xs outline-none"
                          style={{ borderColor: themeColor }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleRenameSubmit(item);
                            if (e.key === 'Escape') setEditingItemId(null);
                          }}
                        />
                        <button onClick={() => handleRenameSubmit(item)} className="text-xs font-semibold" style={{ color: themeColor }}><Check size={14} /></button>
                        <button onClick={() => setEditingItemId(null)} className="text-gray-400"><X size={14} /></button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div>
                          <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                          <p className="text-[10px] text-gray-400">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}</p>
                        </div>
                        {isFile && item.is_pinned && (
                          <Pin size={13} className="text-amber-500 fill-amber-500 rotate-45" />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 opacity-90 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                    {isFile && (
                      <button 
                        onClick={(e) => handleTogglePin(item, e)} 
                        title={item.is_pinned ? "Unpin document" : "Pin document"} 
                        className={`p-1.5 rounded-md hover:bg-gray-100 ${item.is_pinned ? 'text-amber-500 bg-amber-50' : 'text-gray-400'}`}
                      >
                        <Pin size={15} className={item.is_pinned ? "fill-amber-500 rotate-45" : ""} />
                      </button>
                    )}
                    {isFile && (
                      <button onClick={(e) => handlePreview(item, e)} title="Preview" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
                        <Eye size={15} />
                      </button>
                    )}
                    {isFile && (
                      <button onClick={(e) => handleDownload(item, e)} title="Download" className="p-1.5 rounded-md hover:bg-gray-100 text-gray-600">
                        <Download size={15} />
                      </button>
                    )}
                    <button 
                      onClick={() => { setEditingItemId(item.id); setEditingItemName(item.name); }} 
                      title="Rename" 
                      className="p-1.5 rounded-md hover:bg-gray-100 text-blue-600"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      onClick={(e) => handleDeleteItem(item, e)} 
                      title="Delete" 
                      className="p-1.5 rounded-md hover:bg-gray-100 text-rose-600"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {contextMenuPos && (
        <ContextMenu 
          x={contextMenuPos.x} 
          y={contextMenuPos.y} 
          onClose={() => setContextMenuPos(null)}
          onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
          canUpload={hasPermission('add_document') || hasPermission('upload_document')}
          onStartInlineCreate={startInlineCreate}
          childKindLabel={childKindLabel}
          selectedItem={contextMenuPos.item ?? selectedItem}
          onUploadComplete={loadContents}
        />
      )}

      {/* FOLDER TEMPLATE MODAL */}
      {activeTargetId && (
        <FolderTemplateModal 
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          targetId={activeTargetId}
          targetType={activeTargetType}
          themeColor={themeColor}
          onSuccess={handleTemplateSuccess}
        />
      )}

      {/* PREVIEW SIDEBAR */}
      {previewFile && (
        <aside className="w-[480px] bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText size={18} style={{ color: themeColor }} className="shrink-0" />
              <h3 className="text-xs font-bold text-gray-800 truncate">{previewFile.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              {(hasPermission('download_document') || hasPermission('view_document')) && (
                <button 
                  onClick={(e) => handleDownload(previewFile, e)}
                  className="p-1.5 text-white rounded-md text-xs flex items-center gap-1 transition"
                  style={{ backgroundColor: themeColor }}
                >
                  <Download size={14} /> Download
                </button>
              )}
              <button 
                onClick={() => { setPreviewFile(null); setPreviewUrl(null); }}
                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md transition"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex-1 bg-gray-100 relative flex items-center justify-center overflow-hidden">
            {previewUrl ? (
              <iframe 
                src={previewUrl} 
                className="w-full h-full border-none"
                title={previewFile.name}
              />
            ) : (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 size={18} className="animate-spin" style={{ color: themeColor }} /> Loading preview...
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}