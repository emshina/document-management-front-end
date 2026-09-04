// C:\Users\allan.muyesu\Desktop\my-app\components\FolderTree.tsx
'use client';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ChevronRight, ChevronDown, Building, Building2, Folder, Search, Loader2,
  Trash2, Box, FileText, Upload, MoreVertical, FolderPlus, Check, X,
  PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';
import {
  fetchFolderTree, createSubCompany, createCabinet, createFolderItem,
  deleteFolderItem, TreeNodeItem,
} from '@/services/folderService';
import { apiCall } from '@/lib/api';

const MIN_WIDTH = 200;
const MAX_WIDTH = 550;
const COLLAPSED_WIDTH = 48;

export interface SelectedNode {
  item: any;
  /** e.g. ["Visaro Group", "Kenya Ltd", "HR Cabinet", "Contracts"] */
  pathSegments: string[];
  /** e.g. "Visaro Group / Kenya Ltd / HR Cabinet / Contracts" */
  fullPath: string;
  /** e.g. "/Visaro Group/Kenya Ltd/HR Cabinet/Contracts" */
  slashPath: string;
  /** ancestor ids from root down to the item itself */
  idPath: string[];
}

interface FolderTreeProps {
  onSelectFolder?: (item: TreeNodeItem | any, meta?: SelectedNode) => void;
  onTriggerUpload?: (parentId: string, parentType: string, uploadType: 'file' | 'folder') => void;
}

export default function FolderTree({ onSelectFolder, onTriggerUpload }: FolderTreeProps) {
  const [folderTree, setFolderTree] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [filterText, setFilterText] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#2D1B4E');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedPath, setSelectedPath] = useState<string>('');

  // ---------- Resize / collapse state ----------
  const [treeWidth, setTreeWidth] = useState(280);
  const [collapsed, setCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastWidthRef = useRef(280);

  const menuRef = useRef<HTMLDivElement>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<'sub_company' | 'cabinet' | 'folder' | null>(null);
  const [activeCreatingParentId, setActiveCreatingParentId] = useState<string | null>(null);
  const [newChildName, setNewChildName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydration-safe restore of persisted width / collapsed flag
  useEffect(() => {
    const savedWidth = localStorage.getItem('revver_folder_tree_width');
    const savedCollapsed = localStorage.getItem('revver_folder_tree_collapsed');
    if (savedWidth) {
      const w = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, parseInt(savedWidth, 10) || 280));
      setTreeWidth(w);
      lastWidthRef.current = w;
    }
    if (savedCollapsed === '1') setCollapsed(true);
  }, []);

  // Brand color
  useEffect(() => {
    const storedColor = localStorage.getItem('tenant_primary_color');
    if (storedColor) setPrimaryColor(storedColor);

    apiCall('/v1/tenants/tenants/current/', { requiresAuth: true })
      .then((data: any) => {
        if (!data) return;
        const tenantObj = Array.isArray(data) ? data[0] : data.results?.[0] || data;
        if (tenantObj?.effective_primary_color) {
          setPrimaryColor(tenantObj.effective_primary_color);
          localStorage.setItem('tenant_primary_color', tenantObj.effective_primary_color);
        }
      })
      .catch((err) => console.error('Error loading tree brand color:', err));
  }, []);

  // ---------- Mouse drag resize (bidirectional, clamped to container origin) ----------
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const left = containerRef.current?.getBoundingClientRect().left ?? 0;
      const raw = e.clientX - left;
      if (raw < MIN_WIDTH / 2) {          // drag hard left => collapse
        setCollapsed(true);
        return;
      }
      setCollapsed(false);
      const next = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, raw));
      setTreeWidth(next);
      lastWidthRef.current = next;
    };
    const stop = () => setIsResizing(false);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stop);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stop);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing]);

  useEffect(() => {
    localStorage.setItem('revver_folder_tree_width', String(treeWidth));
  }, [treeWidth]);

  useEffect(() => {
    localStorage.setItem('revver_folder_tree_collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      if (c) setTreeWidth(lastWidthRef.current || 280);
      return !c;
    });
  };

  // Double-click the handle => snap between collapsed and default
  const handleDoubleClick = () => toggleCollapsed();

  // Keyboard resize for accessibility
  const handleHandleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') setTreeWidth((w) => Math.max(MIN_WIDTH, w - 16));
    if (e.key === 'ArrowRight') { setCollapsed(false); setTreeWidth((w) => Math.min(MAX_WIDTH, w + 16)); }
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleCollapsed(); }
  };

  // ---------- Outside click for menus ----------
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ---------- Data ----------
  const loadFolders = async () => {
    try {
      const data = await fetchFolderTree();
      setFolderTree(data as any[]);
      if (data.length > 0 && Object.keys(expanded).length === 0) {
        setExpanded({ [data[0].id]: true });
        handleSelect(data[0], []);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load organization tree');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadFolders();
  }, []);

  // ---------- Path helpers ----------
  const buildMeta = useCallback((item: any, ancestors: any[]): SelectedNode => {
    const chain = [...ancestors, item];
    const pathSegments = chain.map((n) => n.name);
    return {
      item,
      pathSegments,
      fullPath: pathSegments.join(' / '),
      slashPath: '/' + pathSegments.join('/'),
      idPath: chain.map((n) => n.id),
    };
  }, []);

  const handleSelect = useCallback((item: any, ancestors: any[]) => {
    const meta = buildMeta(item, ancestors);
    setSelectedId(item.id);
    setSelectedPath(meta.fullPath);
    onSelectFolder?.(item, meta);
  }, [buildMeta, onSelectFolder]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreateNode = async (parentItem: TreeNodeItem, e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim() || !creatingType || isSubmitting) return;
    try {
      setIsSubmitting(true);
      if (creatingType === 'sub_company') await createSubCompany(newChildName.trim(), parentItem.id);
      else if (creatingType === 'cabinet') await createCabinet(newChildName.trim(), parentItem.id);
      else {
        const itemType = parentItem.type === 'cabinet' ? 'cabinet' : 'folder';
        await createFolderItem(newChildName.trim(), parentItem.id, itemType);
      }
      setNewChildName('');
      setActiveCreatingParentId(null);
      setCreatingType(null);
      setExpanded((prev) => ({ ...prev, [parentItem.id]: true }));
      await loadFolders();
    } catch (err: any) {
      alert(err.message || 'Failed to create item');
    } finally {
      setIsSubmitting(false);
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
      const matches = item.name?.toLowerCase().includes(query.toLowerCase());
      const filteredChildren = item.children ? filterTreeItems(item.children, query) : [];
      if (matches || filteredChildren.length > 0) {
        acc.push({ ...item, children: filteredChildren.length > 0 ? filteredChildren : item.children });
      }
      return acc;
    }, []);
  };

  const displayedTree = useMemo(() => filterTreeItems(folderTree, filterText), [folderTree, filterText]);

  // ---------- Tree rendering (ancestors carried down for full path) ----------
  const renderTree = (items: TreeNodeItem[], level = 0, ancestors: any[] = []) => {
    return items.map((item: any) => {
      const isExpanded = expanded[item.id] || Boolean(filterText);
      const hasChildren =
        (item.children && item.children.length > 0) || (item.files && item.files.length > 0);

      const isMother = item.type === 'mother_company';
      const isSubCompany = item.type === 'sub_company';
      const isCabinet = item.type === 'cabinet';
      const isFolder = item.type === 'folder';
      const showChevron = hasChildren || isMother || isSubCompany || isCabinet;

      const meta = buildMeta(item, ancestors);
      const isSelected = selectedId === item.id;

      return (
        <div key={item.id} style={{ paddingLeft: level ? 10 : 0 }}>
          <div
            onClick={() => handleSelect(item, ancestors)}
            title={meta.slashPath}
            style={{
              '--hover-bg': `${primaryColor}15`,
              backgroundColor: isSelected ? `${primaryColor}1f` : undefined,
            } as React.CSSProperties}
            className="flex items-center justify-between py-1 px-1.5 rounded cursor-pointer hover:bg-[var(--hover-bg)] group transition text-gray-700 relative"
          >
            <div className="flex items-center gap-1 min-w-0 flex-1">
              {showChevron ? (
                <button onClick={(e) => toggleExpand(item.id, e)} className="p-0.5 hover:bg-gray-200 rounded flex-shrink-0">
                  {isExpanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                </button>
              ) : (
                <span className="w-[18px] flex-shrink-0" />
              )}

              {isMother && <Building2 size={14} style={{ color: primaryColor }} className="flex-shrink-0" />}
              {isSubCompany && <Building size={14} className="text-indigo-600 flex-shrink-0" />}
              {isCabinet && <Box size={14} className="text-amber-600 flex-shrink-0" />}
              {isFolder && <Folder size={14} className="text-amber-500 flex-shrink-0" />}

              <span className="text-[12px] truncate">{item.name}</span>
            </div>

            {/* Actions menu */}
            <div className="relative flex-shrink-0" ref={menuOpenId === item.id ? menuRef : undefined}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === item.id ? null : item.id);
                }}
                className="p-0.5 hover:bg-gray-200 rounded text-gray-600 transition opacity-0 group-hover:opacity-100"
              >
                <MoreVertical size={13} />
              </button>

              {menuOpenId === item.id && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-6 z-30 w-44 bg-white border rounded shadow-lg py-1 text-[11px]"
                >
                  {isMother && (
                    <button
                      onClick={() => { setMenuOpenId(null); setCreatingType('sub_company'); setActiveCreatingParentId(item.id); setExpanded((p) => ({ ...p, [item.id]: true })); }}
                      className="w-full text-left px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1.5 font-medium"
                      style={{ color: primaryColor }}
                    >
                      <Building size={12} /> Create Sub-Company
                    </button>
                  )}

                  {isSubCompany && (
                    <button
                      onClick={() => { setMenuOpenId(null); setCreatingType('cabinet'); setActiveCreatingParentId(item.id); setExpanded((p) => ({ ...p, [item.id]: true })); }}
                      className="w-full text-left px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1.5 text-indigo-700 font-medium"
                    >
                      <Box size={12} /> Create Cabinet
                    </button>
                  )}

                  {isCabinet && (
                    <button
                      onClick={() => { setMenuOpenId(null); setCreatingType('folder'); setActiveCreatingParentId(item.id); setExpanded((p) => ({ ...p, [item.id]: true })); }}
                      className="w-full text-left px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1.5 text-amber-700 font-medium"
                    >
                      <FolderPlus size={12} /> Create Folder
                    </button>
                  )}

                  {isFolder && (
                    <>
                      <button
                        onClick={() => { setMenuOpenId(null); setCreatingType('folder'); setActiveCreatingParentId(item.id); setExpanded((p) => ({ ...p, [item.id]: true })); }}
                        className="w-full text-left px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1.5 text-amber-700 font-medium"
                      >
                        <FolderPlus size={12} /> Create Sub-Folder
                      </button>
                      <button
                        onClick={() => { setMenuOpenId(null); onTriggerUpload?.(item.id, 'folder', 'file'); }}
                        className="w-full text-left px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1.5 text-blue-700 font-medium"
                      >
                        <Upload size={12} /> Upload File
                      </button>
                      <button
                        onClick={() => { setMenuOpenId(null); onTriggerUpload?.(item.id, 'folder', 'folder'); }}
                        className="w-full text-left px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1.5 text-emerald-700 font-medium"
                      >
                        <Upload size={12} /> Upload Folder
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => { navigator.clipboard?.writeText(meta.slashPath); setMenuOpenId(null); }}
                    className="w-full text-left px-2.5 py-1 hover:bg-gray-50 flex items-center gap-1.5 text-gray-700 font-medium"
                  >
                    <FileText size={12} /> Copy Full Path
                  </button>

                  {!isMother && (
                    <>
                      <div className="my-1 border-t" />
                      <button
                        onClick={(e) => { setMenuOpenId(null); handleDeleteNode(item, e as any); }}
                        className="w-full text-left px-2.5 py-1 hover:bg-red-50 flex items-center gap-1.5 text-red-600 font-medium"
                      >
                        <Trash2 size={12} /> Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {activeCreatingParentId === item.id && (
            <form onSubmit={(e) => handleCreateNode(item, e)} className="ml-5 mt-0.5 mr-1 flex items-center gap-1">
              <input
                autoFocus
                value={newChildName}
                placeholder={`New ${creatingType?.replace('_', '-')} name`}
                onChange={(e) => setNewChildName(e.target.value)}
                className="w-full text-[11px] px-1.5 py-0.5 border rounded outline-none bg-white shadow-sm"
                style={{ borderColor: primaryColor }}
              />
              <button type="submit" disabled={isSubmitting} className="p-1 rounded text-white flex-shrink-0" style={{ backgroundColor: primaryColor }} title="Save">
                {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
              </button>
              <button
                type="button"
                onClick={() => { setActiveCreatingParentId(null); setCreatingType(null); setNewChildName(''); }}
                className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300 transition flex-shrink-0"
                title="Cancel"
              >
                <X size={12} />
              </button>
            </form>
          )}

          {isExpanded && (
            <div className="ml-2 border-l border-gray-200 pl-1">
              {hasChildren ? (
                <>
                  {item.children && renderTree(item.children, level + 1, [...ancestors, item])}
                  {item.files?.map((file: any) => (
                    <div
                      key={file.id}
                      onClick={() => handleSelect(file, [...ancestors, item])}
                      title={buildMeta(file, [...ancestors, item]).slashPath}
                      className="flex items-center gap-1.5 py-0.5 px-1.5 rounded cursor-pointer hover:bg-blue-50 text-gray-600 text-[11px]"
                    >
                      <FileText size={12} className="text-blue-500 flex-shrink-0" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
                </>
              ) : (
                <p className="text-[10px] text-gray-400 italic px-2 py-0.5">No items inside</p>
              )}
            </div>
          )}
        </div>
      );
    });
  };

  // ---------- Layout ----------
  return (
    <div
      ref={containerRef}
      style={{ width: collapsed ? COLLAPSED_WIDTH : treeWidth, transition: isResizing ? 'none' : 'width 150ms ease' }}
      className="relative h-full flex-shrink-0 bg-white border-r flex flex-col select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-2 py-2 border-b">
        {!collapsed && (
          <h3 className="text-xs font-semibold tracking-wide" style={{ color: primaryColor }}>
            Organization Tree
          </h3>
        )}
        <button
          onClick={toggleCollapsed}
          className="p-1 rounded hover:bg-gray-100 text-gray-600"
          title={collapsed ? 'Expand panel' : 'Collapse panel'}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
        </button>
      </div>

      {!collapsed && (
        <>
          {/* Search */}
          <div className="px-2 py-2 border-b">
            <div className="flex items-center gap-1.5 border rounded px-2 py-1">
              <Search size={13} className="text-gray-400" />
              <input
                value={filterText}
                placeholder="Search..."
                onChange={(e) => setFilterText(e.target.value)}
                className="bg-transparent w-full outline-none text-gray-700 text-xs"
              />
            </div>
          </div>

          {/* Selected full path */}
          {selectedPath && (
            <div className="px-2 py-1.5 border-b bg-gray-50">
              <p className="text-[10px] uppercase tracking-wide text-gray-400">Full path</p>
              <p className="text-[11px] text-gray-700 break-words leading-snug">{selectedPath}</p>
            </div>
          )}

          {/* Tree */}
          <div className="flex-1 overflow-auto px-1.5 py-1">
            {loading && (
              <div className="flex items-center gap-2 text-xs text-gray-500 px-2 py-3">
                <Loader2 size={13} className="animate-spin" /> Loading hierarchy...
              </div>
            )}
            {error && <p className="text-[11px] text-red-600 px-2 py-3">{error}</p>}
            {!loading && !error && displayedTree.length === 0 && (
              <p className="text-[11px] text-gray-400 px-2 py-3">No structure found.</p>
            )}
            {!loading && !error && renderTree(displayedTree)}
          </div>
        </>
      )}

      {/* Resizer handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        tabIndex={0}
        onMouseDown={(e) => { e.preventDefault(); setIsResizing(true); }}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleHandleKeyDown}
        className="absolute top-0 right-0 -mr-1 w-2.5 h-full cursor-col-resize hover:bg-purple-500/10 transition-colors group z-20 flex items-center justify-center"
        title="Drag to resize · double-click to collapse"
      >
        <div className="w-px h-10 bg-gray-300 group-hover:bg-purple-500 rounded" />
      </div>
    </div>
  );
}
