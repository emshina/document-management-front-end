'use client';

import { useState, useRef, ChangeEvent, DragEvent } from 'react';
import { CloudUpload, Upload, Folder, Loader2 } from 'lucide-react';
import { apiCall } from '@/lib/api';

interface DocumentUploadZoneProps {
  isFolderLevel: boolean;
  hasPermission: (permission: string) => boolean;
  themeColor: string;
  selectedItem: any;
  onUploadComplete: () => Promise<void>;
}

export default function DocumentUploadZone({
  isFolderLevel,
  hasPermission,
  themeColor,
  selectedItem,
  onUploadComplete,
}: DocumentUploadZoneProps) {
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  const itemId = selectedItem?.id;

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
      const activeTenantId = selectedItem?.tenant || (typeof window !== 'undefined' ? localStorage.getItem('current_tenant_id') : null);

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
                cabinet: selectedItem?.cabinet || null
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

      await onUploadComplete();
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

  if (!isFolderLevel || (!hasPermission('add_document') && !hasPermission('upload_document'))) {
    return null;
  }

  return (
    <>
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
    </>
  );
}