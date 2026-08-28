// C:\Users\allan.muyesu\Desktop\my-app\components\DocumentContentArea.tsx

'use client';
import { useState, useEffect, useRef, useMemo, ChangeEvent, DragEvent, MouseEvent } from 'react';
import { Folder, Edit3, Pin, MoreVertical, LayoutGrid, List, SlidersHorizontal, Loader2, Building, Building2, FileText, ChevronRight, Upload, CloudUpload, Eye, Download, X, Columns } from 'lucide-react';
import { fetchFolderContents, FolderItem } from '@/services/folderService';
import { apiCall } from '@/lib/api';
import ContextMenu from './ContextMenu';
import FolderTemplateModal from './FolderTemplateModal';
import { usePermissions } from '@/hooks/usePermissions';

interface DocumentContentAreaProps {
  selectedItem?: FolderItem | null;
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
  current_version?: {
    file?: string;
  };
}

export default function DocumentContentArea({ selectedItem, onSelectItem }: DocumentContentAreaProps) {
  const { hasPermission } = usePermissions();

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [contextMenuPos, setContextMenuPos] = useState<{ x: number; y: number } | null>(null);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);

  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  
  // Filtering & View states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'compact' | 'details'>('list');

  // Upload states
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Preview states
  const [previewFile, setPreviewFile] = useState<ContentItem | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  // Hidden inputs for click-to-upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Breadcrumb path tracking history stack
  const [breadcrumbPath, setBreadcrumbPath] = useState<FolderItem[]>([]);

  const itemId = selectedItem?.id;
  const itemType = selectedItem?.type || 'folder';
  const isFolderLevel = itemType === 'folder';

  const [themeColor, setThemeColor] = useState<string>('#4C1D95');

  useEffect(() => {
    const itemColor = (selectedItem as any)?.primary_color;
    const storedColor = typeof window !== 'undefined' ? localStorage.getItem('tenant_primary_color') : null;
    setThemeColor(itemColor || storedColor || '#4C1D95');
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
      return [...prevPath, selectedItem];
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
        };
      });

      const documentsList: ContentItem[] = (data.documents || []).map((d: Record<string, unknown>) => ({
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
        current_version: d.current_version as { file?: string } | undefined,
      }));

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

  // Handle template success with a brief buffer to ensure database transaction completion
  const handleTemplateSuccess = async () => {
    setLoading(true);
    setTimeout(async () => {
      await loadContents();
    }, 400);
  };

  const toggleMenu = (id: string, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleContextMenu = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!itemId || itemId === 'default-folder-id') return;
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleBreadcrumbClick = (item: FolderItem) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  const handleResetHome = () => {
    setBreadcrumbPath([]);
  };

  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!isFolderLevel) {
      alert('Documents can only be uploaded directly inside folders.');
      return;
    }

    if (!hasPermission('add_document') && !hasPermission('upload_document')) {
      alert('You do not have permission to upload documents.');
      return;
    }

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const folderCache = new Map<string, string>();
      const activeTenantId = (selectedItem as any)?.tenant || (typeof window !== 'undefined' ? localStorage.getItem('current_tenant_id') : null);

      for (const file of fileArray) {
        const relativePath = (file as { webkitRelativePath?: string }).webkitRelativePath;

        if (!relativePath) {
          const formData = new FormData();
          formData.append('name', file.name);
          formData.append('folder', itemId!);
          if (activeTenantId) {
            formData.append('tenant', activeTenantId);
          }
          formData.append('file', file);
          
          await apiCall('/v1/documents/documents/', {
            method: 'POST',
            requiresAuth: true,
            body: formData,
          });
        } else {
          const pathSegments = relativePath.split('/');
          pathSegments.pop();

          let currentParentId = itemId!;
          let accumulatedPath = '';

          for (const segment of pathSegments) {
            accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;

            if (folderCache.has(accumulatedPath)) {
              currentParentId = folderCache.get(accumulatedPath)!;
            } else {
              const folderPayload: Record<string, unknown> = {
                name: segment,
                parent: currentParentId,
                cabinet: (selectedItem as any)?.cabinet || null
              };
              if (activeTenantId) {
                folderPayload.tenant = activeTenantId;
              }

              const folderData = await apiCall('/v1/documents/folders/', {
                method: 'POST',
                requiresAuth: true,
                body: JSON.stringify(folderPayload)
              });
              
              currentParentId = folderData.id;
              folderCache.set(accumulatedPath, currentParentId);
            }
          }

          const formData = new FormData();
          formData.append('name', file.name);
          formData.append('folder', currentParentId);
          if (activeTenantId) {
            formData.append('tenant', activeTenantId);
          }
          formData.append('file', file);

          await apiCall('/v1/documents/documents/', {
            method: 'POST',
            requiresAuth: true,
            body: formData,
          });
        }
      }

      await loadContents();
    } catch (err: unknown) {
      const errorObject = err as Error;
      alert(errorObject.message || 'Upload failed.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isFolderLevel) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesUpload(e.dataTransfer.files);
    }
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

    setPreviewFile(item);

    try {
      const docData = await apiCall(`/v1/documents/documents/${item.id}/`, {
        method: 'GET',
        requiresAuth: true,
      });

      const rawFileUrl = docData?.current_version?.file || docData?.file || item.current_version?.file || item.file;
      if (!rawFileUrl) {
        throw new Error('No valid file source found for this document.');
      }

      const targetUrl = resolveFileUrl(rawFileUrl);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('access')) : null;
      
      const res = await fetch(targetUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error('Failed to load document preview binary');

      const blob = await res.blob();
      setPreviewUrl(window.URL.createObjectURL(blob));
    } catch (err) {
      console.error('Failed to load preview:', err);
    }
  };

  const handleDownload = async (item: ContentItem, e: MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    
    if (!hasPermission('download_document') && !hasPermission('view_document')) {
      alert('You do not have permission to download this document.');
      return;
    }

    try {
      const docData = await apiCall(`/v1/documents/documents/${item.id}/`, {
        method: 'GET',
        requiresAuth: true,
      });

      const rawFileUrl = docData?.current_version?.file || docData?.file || item.current_version?.file || item.file;
      if (!rawFileUrl) {
        throw new Error('Download URL not found.');
      }

      const targetUrl = resolveFileUrl(rawFileUrl);
      const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('access')) : null;
      
      const res = await fetch(targetUrl, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

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
    } catch (err: unknown) {
      const errorObject = err as Error;
      alert(errorObject.message || 'Failed to download document.');
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

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden">
      <main 
        className="flex-1 bg-gray-50 flex flex-col overflow-y-auto select-none"
        onContextMenu={handleContextMenu}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          className="hidden" 
          onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleFilesUpload(e.target.files)} 
        />
        <input 
          type="file" 
          ref={folderInputRef} 
          {...({ webkitdirectory: '', directory: '' } as unknown as React.InputHTMLAttributes<HTMLInputElement>)}
          className="hidden" 
          onChange={(e: ChangeEvent<HTMLInputElement>) => e.target.files && handleFilesUpload(e.target.files)} 
        />

        {/* Interactive Breadcrumbs Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500 gap-2 flex-wrap">
            <span 
              onClick={handleResetHome} 
              className="hover:opacity-80 cursor-pointer font-medium"
              style={{ color: themeColor }}
            >
              Home
            </span> 
            {breadcrumbPath.length > 0 && <ChevronRight size={12} className="text-gray-400" />}

            {breadcrumbPath.map((pathItem, index) => {
              const isLast = index === breadcrumbPath.length - 1;
              return (
                <div key={pathItem.id} className="flex items-center gap-2">
                  <span 
                    onClick={() => !isLast && handleBreadcrumbClick(pathItem)}
                    className={`cursor-pointer transition ${
                      isLast 
                        ? 'font-semibold cursor-default' 
                        : 'hover:opacity-80 text-gray-600'
                    }`}
                    style={isLast ? { color: themeColor } : {}}
                  >
                    {pathItem.name}
                  </span>
                  {!isLast && <ChevronRight size={12} className="text-gray-400" />}
                </div>
              );
            })}
            <Edit3 size={14} className="text-gray-400 ml-2 cursor-pointer hover:text-gray-600" />
          </div>
        </div>

        {/* Active Selection Banner Header */}
        <div 
          className="mx-6 mt-6 border rounded-lg p-4 flex items-center justify-between relative"
          style={{ backgroundColor: `${themeColor}08`, borderColor: `${themeColor}30` }}
        >
          <div className="flex items-center gap-3">
            {itemType === 'mother_company' && <Building style={{ color: themeColor }} size={24} />}
            {itemType === 'sub_company' && <Building2 style={{ color: themeColor }} size={24} />}
            {itemType === 'cabinet' && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColor }} />}
            {isFolderLevel && <Folder style={{ color: themeColor }} size={24} />}
            <div>
              <h2 className="text-sm font-bold" style={{ color: themeColor }}>{currentName}</h2>
              <p className="text-xs opacity-80" style={{ color: themeColor }}>{currentTypeLabel} (Right-click anywhere in workspace for options)</p>
            </div>
          </div>
          <div className="flex items-center gap-3" style={{ color: themeColor }}>
            <Pin size={16} className="cursor-pointer hover:opacity-80" />
            <div className="relative">
              <MoreVertical size={18} className="cursor-pointer hover:opacity-80" onClick={(e) => toggleMenu('header-menu', e)} />
            </div>
          </div>
        </div>

        {/* Drag & Drop / Click Upload Zone */}
        {isFolderLevel && (hasPermission('add_document') || hasPermission('upload_document')) && (
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={`mx-6 mt-4 border-2 border-dashed rounded-xl p-5 text-center transition flex flex-col items-center justify-center bg-white ${
              isDragging ? 'border-purple-600 bg-purple-50/50' : 'border-gray-300 hover:border-gray-400'
            }`}
            style={{ borderColor: isDragging ? themeColor : undefined }}
          >
            {uploading ? (
              <div className="flex items-center gap-2 text-xs py-2" style={{ color: themeColor }}>
                <Loader2 size={18} className="animate-spin" style={{ color: themeColor }} /> Uploading files/folders...
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-sm"
                  style={{ backgroundColor: `${themeColor}15`, color: themeColor }}
                >
                  <CloudUpload size={20} />
                </div>
                <p className="text-xs font-semibold text-gray-700">
                  Drag and drop your files or folders here, or use buttons below
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  Supports individual documents or complete directory hierarchies
                </p>
                <div className="flex items-center gap-3 mt-3">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
                    style={{ backgroundColor: themeColor }}
                  >
                    <Upload size={13} /> Upload Document(s)
                  </button>
                  <button 
                    onClick={() => folderInputRef.current?.click()}
                    className="px-3 py-1.5 bg-white border rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
                    style={{ borderColor: themeColor, color: themeColor }}
                  >
                    <Folder size={13} /> Upload Folder
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Inner Filter & View controls */}
        <div className="mx-6 mt-4 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-3 w-72">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <input 
              type="text" 
              placeholder="Filter by name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs bg-transparent outline-none w-full text-gray-700" 
            />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1 border border-gray-200 rounded px-2 py-1">
              <select 
                value={typeFilter} 
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent outline-none text-xs text-gray-600 cursor-pointer"
              >
                <option value="all">All Types</option>
                <option value="file">Files</option>
                <option value="folder">Folders</option>
              </select>
            </div>
            {/* Revver View Mode Toggle Buttons */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded">
              <button 
                title="Grid View"
                onClick={() => setViewMode('grid')}
                className={`p-1 rounded transition ${viewMode === 'grid' ? 'bg-white shadow-sm' : ''}`}
              >
                <LayoutGrid size={14} style={{ color: viewMode === 'grid' ? themeColor : '#9CA3AF' }} />
              </button>
              <button 
                title="Compact View"
                onClick={() => setViewMode('compact')}
                className={`p-1 rounded transition ${viewMode === 'compact' ? 'bg-white shadow-sm' : ''}`}
              >
                <Columns size={14} style={{ color: viewMode === 'compact' ? themeColor : '#9CA3AF' }} />
              </button>
              <button 
                title="Details View"
                onClick={() => setViewMode('details')}
                className={`p-1 rounded transition ${viewMode === 'details' ? 'bg-white shadow-sm' : ''}`}
              >
                <List size={14} style={{ color: viewMode === 'details' ? themeColor : '#9CA3AF' }} />
              </button>
            </div>
            <span className="font-medium text-gray-700">({filteredContents.length} items)</span>
          </div>
        </div>

        {/* Content list / grid items area */}
        <div className="mx-6 mt-3 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2 text-xs">
              <Loader2 size={16} className="animate-spin" style={{ color: themeColor }} /> Loading contents...
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 p-4 rounded text-center">{error}</p>
          )}

          {!loading && !error && filteredContents.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">No matching contents found.</p>
          )}

          {!loading && !error && viewMode === 'details' ? (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/70 text-gray-500 font-medium">
                  <th className="py-2.5 px-4">Name</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Date Created</th>
                  <th className="py-2.5 px-4">Date Modified</th>
                  <th className="py-2.5 px-4">Size</th>
                  <th className="py-2.5 px-4">Created By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredContents.map((item) => {
                  const resolvedType = item.type || (item.file_type || item.reference_no ? 'file' : 'folder');
                  const isFile = resolvedType === 'file' || item.file_type || item.reference_no;
                  const selectableItem = { ...item, type: resolvedType };

                  return (
                    <tr 
                      key={item.id}
                      onClick={(e) => {
                        if (isFile) {
                          handlePreview(item, e);
                        } else {
                          onSelectItem && onSelectItem(selectableItem);
                        }
                      }}
                      className="hover:bg-gray-50 cursor-pointer group"
                    >
                      <td className="py-3 px-4 flex items-center gap-2.5">
                        {isFile ? <FileText size={16} className="text-blue-500 shrink-0" /> : <Folder size={16} className="text-gray-400 shrink-0" />}
                        <span className="font-semibold text-gray-800">{item.name}</span>
                      </td>
                      <td className="py-3 px-4 text-gray-500 capitalize">{resolvedType}</td>
                      <td className="py-3 px-4 text-gray-500">{item.created_at ? new Date(item.created_at).toLocaleDateString() : (item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-')}</td>
                      <td className="py-3 px-4 text-gray-500">{item.updated_at ? new Date(item.updated_at).toLocaleDateString() : '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{item.size || '-'}</td>
                      <td className="py-3 px-4 text-gray-500">{item.created_by || '-'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="divide-y divide-gray-100">
              {!loading && !error && filteredContents.map((item) => {
                const resolvedType = item.type || (item.file_type || item.reference_no ? 'file' : 'folder');
                const isMotherCompany = resolvedType === 'mother_company';
                const isSubCompany = resolvedType === 'sub_company';
                const isCabinet = resolvedType === 'cabinet';
                const isFile = resolvedType === 'file' || item.file_type || item.reference_no;

                const selectableItem = {
                  ...item,
                  type: resolvedType
                };

                return (
                  <div 
                    key={item.id} 
                    onClick={(e) => {
                      if (isFile) {
                        handlePreview(item, e);
                      } else {
                        onSelectItem && onSelectItem(selectableItem);
                      }
                    }}
                    className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      {isMotherCompany && <Building size={18} style={{ color: themeColor }} />}
                      {isSubCompany && <Building2 size={18} style={{ color: themeColor }} />}
                      {isCabinet && <div className="w-2.5 h-2.5 rounded-full ml-1" style={{ backgroundColor: themeColor }} />}
                      {isFile && <FileText size={18} className="text-blue-500" />}
                      {!isMotherCompany && !isSubCompany && !isCabinet && !isFile && <Folder size={18} className="text-gray-400" />}
                      <div>
                        <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                        <p className="text-[10px] text-gray-400">
                          {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}
                        </p>
                      </div>
                    </div>

                    {isFile && (
                      <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                        {(hasPermission('view_document') || hasPermission('change_document')) && (
                          <button 
                            onClick={(e) => handlePreview(item, e)}
                            title="Preview Document"
                            className="p-1.5 rounded-md transition flex items-center gap-1 text-xs hover:bg-gray-100"
                            style={{ color: themeColor }}
                          >
                            <Eye size={15} />
                          </button>
                        )}
                        {(hasPermission('download_document') || hasPermission('view_document')) && (
                          <button 
                            onClick={(e) => handleDownload(item, e)}
                            title="Download Document"
                            className="p-1.5 rounded-md transition flex items-center gap-1 text-xs hover:bg-gray-100"
                            style={{ color: themeColor }}
                          >
                            <Download size={15} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Right Click Context Menu */}
      {contextMenuPos && itemId && (
        <ContextMenu 
          x={contextMenuPos.x} 
          y={contextMenuPos.y} 
          onClose={() => setContextMenuPos(null)}
          onOpenTemplateModal={() => setIsTemplateModalOpen(true)}
          canUpload={hasPermission('add_document') || hasPermission('upload_document')}
        />
      )}

      {/* Folder Template Application Modal with immediate refresh callback */}
      {itemId && (
        <FolderTemplateModal 
          isOpen={isTemplateModalOpen}
          onClose={() => setIsTemplateModalOpen(false)}
          targetId={itemId}
          targetType={itemType}
          themeColor={themeColor}
          onSuccess={handleTemplateSuccess}
        />
      )}

      {/* Document Preview Sidebar / Modal */}
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