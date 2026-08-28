"use client";

import React, { useState, useEffect } from "react";
import { FolderTree, Plus, Trash2, Play, Folder, ChevronRight, Layers, X, AlertCircle } from "lucide-react";
import { apiCall } from "@/lib/api";

interface TemplateItem {
  id: string;
  parent: string | null;
  name: string;
  folder_type: string;
  children: TemplateItem[];
}

interface FolderTemplate {
  id: string;
  name: string;
  description: string;
  tenant: string | null;
  items: TemplateItem[];
  created_at: string;
}

export default function TemplatesListTab() {
  const [templates, setTemplates] = useState<FolderTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FolderTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isApplyModalOpen, setIsApplyModalOpen] = useState<boolean>(false);
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);

  // Form states
  const [newTemplateName, setNewTemplateName] = useState<string>("");
  const [newTemplateDesc, setNewTemplateDesc] = useState<string>("");
  const [targetCabinetId, setTargetCabinetId] = useState<string>("");
  const [targetParentFolderId, setTargetParentFolderId] = useState<string>("");

  // Item creation states
  const [newItemName, setNewItemName] = useState<string>("");
  const [newItemFolderType, setNewItemFolderType] = useState<string>("DEFAULT");
  const [activeParentItemId, setActiveParentItemId] = useState<string | null>(null); // null = Root item

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/v1/documents/folder-templates/', {
        requiresAuth: true,
      });
      
      const templateArray = Array.isArray(data) ? data : (data?.results || []);
      setTemplates(templateArray);
      
      if (templateArray.length > 0) {
        // Keep currently selected template updated if it exists in the new list, otherwise default to first
        setSelectedTemplate(prev => {
          const found = templateArray.find((t: FolderTemplate) => t.id === prev?.id);
          return found || templateArray[0];
        });
      } else {
        setSelectedTemplate(null);
      }
    } catch (err: any) {
      setError(err.message);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  // Creating a new template
  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newTmpl = await apiCall('/v1/documents/folder-templates/', {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({ name: newTemplateName, description: newTemplateDesc })
      });
      
      setNewTemplateName("");
      setNewTemplateDesc("");
      setIsCreateModalOpen(false);
      await fetchTemplates();
      if (newTmpl?.id) {
        setSelectedTemplate(newTmpl);
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Deleting a template
  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template package?")) return;
    try {
      await apiCall(`/v1/documents/folder-templates/${id}/`, {
        method: "DELETE",
        requiresAuth: true,
      });
      setSelectedTemplate(null);
      fetchTemplates();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Applying a template
  const handleApplyTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      const payload: any = {};
      if (targetCabinetId) payload.cabinet_id = targetCabinetId;
      if (targetParentFolderId) payload.parent_folder_id = targetParentFolderId;

      await apiCall(`/v1/documents/folder-templates/${selectedTemplate.id}/apply/`, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify(payload)
      });

      alert("Template applied successfully!");
      setIsApplyModalOpen(false);
      setTargetCabinetId("");
      setTargetParentFolderId("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Creating a Template Item (Root or Sub-folder)
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    try {
      await apiCall(`/v1/documents/folder-templates/${selectedTemplate.id}/items/`, {
        method: "POST",
        requiresAuth: true,
        body: JSON.stringify({
          parent: activeParentItemId, // null for root, or UUID of parent item
          name: newItemName,
          folder_type: newItemFolderType
        })
      });

      setNewItemName("");
      setNewItemFolderType("DEFAULT");
      setIsItemModalOpen(false);
      setActiveParentItemId(null);
      
      // Refresh list to pull updated items tree
      const updatedList = await apiCall('/v1/documents/folder-templates/', { requiresAuth: true });
      const templateArray = Array.isArray(updatedList) ? updatedList : (updatedList?.results || []);
      setTemplates(templateArray);
      
      const refreshedCurrent = templateArray.find((t: FolderTemplate) => t.id === selectedTemplate.id);
      if (refreshedCurrent) setSelectedTemplate(refreshedCurrent);

    } catch (err: any) {
      alert(err.message);
    }
  };

  const renderTemplateItems = (items: TemplateItem[]) => {
    return (
      <ul className="pl-4 space-y-2 border-l border-gray-200 mt-2">
        {items.map((item) => (
          <li key={item.id} className="text-gray-700">
            <div className="flex items-center justify-between py-1 px-2 hover:bg-gray-50 rounded-md group">
              <div className="flex items-center space-x-2">
                <Folder className="w-4 h-4 text-[#7C3AED]" />
                <span className="font-medium text-sm">{item.name}</span>
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                  {item.folder_type}
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveParentItemId(item.id);
                  setIsItemModalOpen(true);
                }}
                className="opacity-0 group-hover:opacity-100 text-xs text-[#7C3AED] hover:underline flex items-center gap-1 bg-purple-50 px-2 py-1 rounded transition"
                title="Add Subfolder Blueprint"
              >
                <Plus size={12} /> Add Subfolder
              </button>
            </div>
            {item.children && item.children.length > 0 && renderTemplateItems(item.children)}
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Creation action inside tab view */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Folder Template Blueprints</h2>
          <p className="text-xs text-gray-500 mt-0.5">Manage multi-level sub-folder templates to instantly populate cabinets.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-purple-700 transition shadow-sm"
        >
          <Plus size={16} /> New Template
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sidebar Templates List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 h-[550px] overflow-y-auto">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Templates Catalog ({templates.length})
          </h3>
          {loading ? (
            <p className="text-sm text-gray-400 text-center py-8">Loading templates...</p>
          ) : templates.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No templates found.</p>
          ) : (
            <div className="space-y-1">
              {templates.map((tmpl) => (
                <div
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`p-3 rounded-lg cursor-pointer transition flex items-center justify-between ${
                    selectedTemplate?.id === tmpl.id
                      ? "bg-purple-50 border border-purple-200 text-purple-900 font-medium"
                      : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="truncate pr-2">
                    <p className="text-sm truncate">{tmpl.name}</p>
                    <p className="text-xs text-gray-400 truncate">{tmpl.description || "No description"}</p>
                  </div>
                  <ChevronRight size={16} className="text-gray-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Template Structure Inspector Panel */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-[550px] flex flex-col">
          {selectedTemplate ? (
            <>
              <div className="flex justify-between items-start pb-4 border-b border-gray-100">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{selectedTemplate.name}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{selectedTemplate.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setActiveParentItemId(null);
                      setIsItemModalOpen(true);
                    }}
                    className="bg-purple-100 hover:bg-purple-200 text-purple-800 px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
                  >
                    <Plus size={14} /> Add Root Folder
                  </button>
                  <button
                    onClick={() => setIsApplyModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Play size={14} /> Apply Template
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(selectedTemplate.id)}
                    className="bg-white border border-red-200 hover:bg-red-50 text-red-600 p-2 rounded-lg transition"
                    title="Delete Template"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pt-4">
                <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  Hierarchy Tree Structure
                </h4>
                {selectedTemplate.items && selectedTemplate.items.length > 0 ? (
                  renderTemplateItems(selectedTemplate.items)
                ) : (
                  <div className="text-center py-16 text-gray-400">
                    <Layers className="w-10 h-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-sm font-medium">No root items found in this template structure.</p>
                    <p className="text-xs text-gray-400 mt-1">Click &quot;Add Root Folder&quot; above to start building your template hierarchy.</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <FolderTree className="w-12 h-12 text-gray-300 mb-2" />
              <p className="text-sm font-medium">Select a folder template package from the list to preview configuration.</p>
            </div>
          )}
        </div>

      </div>

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Create Folder Template</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  placeholder="e.g. Standard Corporate Client Kit"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Description</label>
                <textarea
                  value={newTemplateDesc}
                  onChange={(e) => setNewTemplateDesc(e.target.value)}
                  placeholder="Describe folder purposes..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Template Item (Root / Sub-folder) Modal */}
      {isItemModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                {activeParentItemId ? "Add Sub-Folder Blueprint" : "Add Root Folder Blueprint"}
              </h3>
              <button onClick={() => setIsItemModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Folder Name</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Financial Statements"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Folder Type</label>
                <input
                  type="text"
                  value={newItemFolderType}
                  onChange={(e) => setNewItemFolderType(e.target.value)}
                  placeholder="DEFAULT, SECURE, etc."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#7C3AED]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#7C3AED] text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                >
                  Create Folder Node
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {isApplyModalOpen && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Apply Template Structure</h3>
              <button onClick={() => setIsApplyModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Deploying blueprint <span className="font-semibold text-gray-800">{selectedTemplate?.name}</span>. Provide either a target Cabinet UUID or a Parent Folder UUID.
            </p>
            <form onSubmit={handleApplyTemplate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Target Cabinet UUID</label>
                <input
                  type="text"
                  value={targetCabinetId}
                  onChange={(e) => setTargetCabinetId(e.target.value)}
                  placeholder="e.g. c1d2e3f4-..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="text-center text-xs text-gray-400 font-medium">- OR -</div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase mb-1">Target Parent Folder UUID</label>
                <input
                  type="text"
                  value={targetParentFolderId}
                  onChange={(e) => setTargetParentFolderId(e.target.value)}
                  placeholder="e.g. f9e8d7c6-..."
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-emerald-600"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700"
                >
                  Deploy Folders
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}