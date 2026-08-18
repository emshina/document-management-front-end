// C:\Users\allan.muyesu\Desktop\my-app\components\DocumentContentArea.tsx

'use client';
import { useState, useEffect, useRef } from 'react';
import { Folder, Edit3, Pin, MoreVertical, LayoutGrid, List, SlidersHorizontal, Loader2, Building, Building2, FileText, ChevronRight, Upload, CloudUpload, Eye, Download, X } from 'lucide-react';
import { fetchFolderContents, FolderItem } from '@/services/folderService';
import { apiCall } from '@/lib/api';
import ContextMenu from './ContextMenu';

interface DocumentContentAreaProps {
  selectedItem?: FolderItem | null;
  onSelectItem?: (item: FolderItem) => void;
}

export default function DocumentContentArea({ selectedItem, onSelectItem }: DocumentContentAreaProps) {
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Preview states
  const [previewFile, setPreviewFile] = useState<any | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Hidden inputs for click-to-upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Breadcrumb path tracking history stack
  const [breadcrumbPath, setBreadcrumbPath] = useState<FolderItem[]>([]);

  const itemId = selectedItem?.id;
  const itemType = selectedItem?.type || 'folder';

  // Update breadcrumb path stack whenever the selected item changes
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

  useEffect(() => {
    async function loadContents() {
      if (!itemId || itemId === 'default-folder-id') {
        setContents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError('');
        
        const data = await fetchFolderContents(itemId, itemType);
        
        const foldersList = (data.folders || []).map((f: any) => {
          let derivedType = 'folder';
          if (itemType === 'mother_company') derivedType = 'sub_company';
          else if (itemType === 'sub_company') derivedType = 'cabinet';
          else if (itemType === 'cabinet') derivedType = 'folder';
          
          return {
            ...f,
            type: f.type || derivedType
          };
        });

        const documentsList = (data.documents || []).map((d: any) => ({
          ...d,
          type: d.type || 'file'
        }));

        setContents([...foldersList, ...documentsList]);
      } catch (err: any) {
        setError(err.message || 'Failed to load contents.');
      } finally {
        setLoading(false);
      }
    }

    loadContents();
  }, [itemId, itemType]);

  const toggleMenu = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleBreadcrumbClick = (item: FolderItem, index: number) => {
    if (onSelectItem) {
      onSelectItem(item);
    }
  };

  const handleResetHome = () => {
    setBreadcrumbPath([]);
  };

  // Handle file/folder upload action
  const handleFilesUpload = async (files: FileList | File[]) => {
    if (!itemId || itemId === 'default-folder-id' || itemType === 'mother_company' || itemType === 'sub_company') {
      alert('Please select a specific folder or cabinet first before uploading documents.');
      return;
    }

    setUploading(true);
    try {
      const fileArray = Array.from(files);
      const folderCache = new Map<string, string>();
      const activeTenantId = (selectedItem as any)?.tenant || localStorage.getItem('current_tenant_id');

      for (const file of fileArray) {
        const relativePath = (file as any).webkitRelativePath;

        if (!relativePath) {
          const formData = new FormData();
          formData.append('name', file.name);
          formData.append('folder', itemId);
          if (itemType === 'cabinet' || (selectedItem as any)?.cabinet) {
            formData.append('cabinet', (selectedItem as any)?.cabinet || itemId);
          }
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

          let currentParentId = itemId;
          let accumulatedPath = '';

          for (const segment of pathSegments) {
            accumulatedPath = accumulatedPath ? `${accumulatedPath}/${segment}` : segment;

            if (folderCache.has(accumulatedPath)) {
              currentParentId = folderCache.get(accumulatedPath)!;
            } else {
              const folderPayload: any = {
                name: segment,
                parent: currentParentId,
                cabinet: (selectedItem as any)?.cabinet || (itemType === 'cabinet' ? itemId : null)
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

      const data = await fetchFolderContents(itemId, itemType);
      const foldersList = (data.folders || []).map((f: any) => ({ ...f, type: f.type || 'folder' }));
      const documentsList = (data.documents || []).map((d: any) => ({ ...d, type: d.type || 'file' }));
      setContents([...foldersList, ...documentsList]);
    } catch (err: any) {
      console.error('Django Document Upload Validation Error:', err);
      alert(err.message || 'Upload failed. Check console for validation details.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (folderInputRef.current) folderInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
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

  const handlePreview = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewFile(item);
    setPreviewLoading(true);

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
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      
      const res = await fetch(targetUrl, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });

      if (!res.ok) throw new Error('Failed to load document preview binary');

      const blob = await res.blob();
      setPreviewUrl(window.URL.createObjectURL(blob));
    } catch (err) {
      console.error('Failed to load preview:', err);
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleDownload = async (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
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
      const token = localStorage.getItem('access_token') || localStorage.getItem('access');
      
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
    } catch (err: any) {
      alert(err.message || 'Failed to download document.');
    }
  };

  const currentName = selectedItem?.name || 'Select a folder';
  const currentTypeLabel = itemType ? itemType.replace('_', ' ').toUpperCase() : 'DIRECTORY';

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] overflow-hidden">
      <main className="flex-1 bg-gray-50 flex flex-col overflow-y-auto">
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          className="hidden" 
          onChange={(e) => e.target.files && handleFilesUpload(e.target.files)} 
        />
        <input 
          type="file" 
          ref={folderInputRef} 
          {...({ webkitdirectory: '', directory: '' } as any)}
          className="hidden" 
          onChange={(e) => e.target.files && handleFilesUpload(e.target.files)} 
        />

        {/* Interactive Breadcrumbs Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center text-xs text-gray-500 gap-2 flex-wrap">
            <span 
              onClick={handleResetHome} 
              className="hover:text-purple-700 cursor-pointer font-medium"
            >
              Home
            </span> 
            {breadcrumbPath.length > 0 && <ChevronRight size={12} className="text-gray-400" />}

            {breadcrumbPath.map((pathItem, index) => {
              const isLast = index === breadcrumbPath.length - 1;
              return (
                <div key={pathItem.id} className="flex items-center gap-2">
                  <span 
                    onClick={() => !isLast && handleBreadcrumbClick(pathItem, index)}
                    className={`cursor-pointer transition ${
                      isLast 
                        ? 'text-purple-900 font-semibold cursor-default' 
                        : 'hover:text-purple-700 text-gray-600'
                    }`}
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
        <div className="mx-6 mt-6 bg-purple-50 border border-purple-200 rounded-lg p-4 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            {itemType === 'mother_company' && <Building className="text-purple-900" size={24} />}
            {itemType === 'sub_company' && <Building2 className="text-purple-700" size={24} />}
            {itemType === 'cabinet' && <div className="w-3 h-3 rounded-full bg-purple-600" />}
            {(!itemType || itemType === 'folder') && <Folder className="text-purple-700" size={24} />}
            <div>
              <h2 className="text-sm font-bold text-purple-900">{currentName}</h2>
              <p className="text-xs text-purple-700">{currentTypeLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-purple-700">
            <Pin size={16} className="cursor-pointer hover:text-purple-900" />
            <div className="relative">
              <MoreVertical size={18} className="cursor-pointer hover:text-purple-900" onClick={(e) => toggleMenu('header-menu', e)} />
              {activeMenuId === 'header-menu' && <ContextMenu onClose={() => setActiveMenuId(null)} />}
            </div>
          </div>
        </div>

        {/* Drag & Drop / Click Upload Zone */}
        <div 
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`mx-6 mt-4 border-2 border-dashed rounded-xl p-5 text-center transition flex flex-col items-center justify-center bg-white ${
            isDragging ? 'border-purple-600 bg-purple-50/50' : 'border-gray-300 hover:border-purple-400'
          }`}
        >
          {uploading ? (
            <div className="flex items-center gap-2 text-xs text-purple-700 py-2">
              <Loader2 size={18} className="animate-spin text-purple-600" /> Uploading files/folders...
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center mb-2 shadow-sm">
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
                  className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
                >
                  <Upload size={13} /> Upload Document(s)
                </button>
                <button 
                  onClick={() => folderInputRef.current?.click()}
                  className="px-3 py-1.5 bg-white border border-purple-300 hover:bg-purple-50 text-purple-700 rounded-lg text-xs font-medium shadow-sm transition flex items-center gap-1.5"
                >
                  <Folder size={13} /> Upload Folder
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Inner Filter & View controls */}
        <div className="mx-6 mt-4 flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-3 w-72">
            <SlidersHorizontal size={14} className="text-gray-400" />
            <input type="text" placeholder="Type to filter" className="text-xs bg-transparent outline-none w-full" />
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1 border border-gray-200 rounded px-2 py-1">
              <span>Type</span>
              <span>▾</span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded">
              <LayoutGrid size={14} className="text-purple-700 cursor-pointer" />
              <List size={14} className="text-gray-400 cursor-pointer" />
            </div>
            <span className="font-medium text-gray-700">({contents.length} items)</span>
          </div>
        </div>

        {/* Content list items area */}
        <div className="mx-6 mt-3 mb-6 bg-white border border-gray-200 rounded-lg shadow-sm divide-y divide-gray-100">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 gap-2 text-xs">
              <Loader2 size={16} className="animate-spin text-purple-600" /> Loading contents...
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 p-4 rounded text-center">{error}</p>
          )}

          {!loading && !error && contents.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-8">This directory is empty. Drop files above to get started.</p>
          )}

          {!loading && !error && contents.map((item) => {
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
                  {isMotherCompany && <Building size={18} className="text-purple-900" />}
                  {isSubCompany && <Building2 size={18} className="text-purple-700" />}
                  {isCabinet && <div className="w-2.5 h-2.5 rounded-full bg-purple-600 ml-1" />}
                  {isFile && <FileText size={18} className="text-blue-500" />}
                  {!isMotherCompany && !isSubCompany && !isCabinet && !isFile && <Folder size={18} className="text-gray-400" />}
                  <div>
                    <p className="text-xs font-semibold text-gray-800">{item.name}</p>
                    <p className="text-[10px] text-gray-400">
                      {item.updated_at ? new Date(item.updated_at).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>

                {/* Quick action buttons for files (Preview & Download) */}
                {isFile && (
                  <div className="flex items-center gap-2 opacity-80 group-hover:opacity-100">
                    <button 
                      onClick={(e) => handlePreview(item, e)}
                      title="Preview Document"
                      className="p-1.5 hover:bg-purple-100 text-purple-700 rounded-md transition flex items-center gap-1 text-xs"
                    >
                      <Eye size={15} />
                    </button>
                    <button 
                      onClick={(e) => handleDownload(item, e)}
                      title="Download Document"
                      className="p-1.5 hover:bg-purple-100 text-purple-700 rounded-md transition flex items-center gap-1 text-xs"
                    >
                      <Download size={15} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      {/* Document Preview Sidebar / Modal */}
      {previewFile && (
        <aside className="w-[480px] bg-white border-l border-gray-200 flex flex-col shadow-xl z-20">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center gap-2 overflow-hidden">
              <FileText size={18} className="text-purple-700 shrink-0" />
              <h3 className="text-xs font-bold text-gray-800 truncate">{previewFile.name}</h3>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={(e) => handleDownload(previewFile, e)}
                className="p-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-md text-xs flex items-center gap-1 transition"
              >
                <Download size={14} /> Download
              </button>
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
                <Loader2 size={18} className="animate-spin text-purple-600" /> Loading preview...
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
}